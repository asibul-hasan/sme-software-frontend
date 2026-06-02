import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, finalize, switchMap } from 'rxjs';
import { Sys1001DataService, Sys1001CompanyDto } from './data.service';
import { CoreFileApiService } from '../../../../../core/services/core-file-api.service';
import { ApiResponse, isSuccess } from '../../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

/** entity_type = 1 → Company Logo (mirrors backend constant) */
const ENTITY_TYPE_COMPANY_LOGO = 1;
const MAX_LOGO_BYTES = 100 * 1024; // 100 KB
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

@Injectable()
export class Sys1001ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Sys1001DataService);
  private fileApi = inject(CoreFileApiService);
  private toastr  = inject(ToastrService);

  isSaving         = signal(false);
  isLoading        = signal(false);
  isLogoUploading  = signal(false);
  currentCompanyNo = signal<number | null>(null);

  /**
   * Absolute URL for the <img> tag — built from the serve_path returned by the file API.
   * Empty string means no logo.
   */
  logoPreview = signal('');

  form!: FormGroup;

  createForm(): void {
    this.form = this.fb.group({
      company_no:       [null],
      company_id:       ['', [Validators.required, Validators.maxLength(15)]],
      company_name:     ['', [Validators.required, Validators.maxLength(250)]],
      company_name_nls: [''],
      company_type:     [''],
      reg_no:           [''],
      trade_license_no: [''],
      vat_reg_no:       [''],
      tin_no:           [''],
      bin_no:           [''],
      company_addr1:    [''],
      company_addr2:    [''],
      city:             [''],
      state_province:   [''],
      post_code:        [''],
      country_code:     [''],
      mobile_no:        [''],
      contact_no:       [''],
      email:            ['', [Validators.email]],
      website:          [''],
      logo_path:        [null],
      is_active:        [1, [Validators.required]],
    });
  }

  loadCompany(companyNo: number): void {
    this.isLoading.set(true);
    this.currentCompanyNo.set(companyNo);
    this.data
      .getDetail(companyNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(res => {
        if (isSuccess(res) && res.data) this.patchForm(res.data);
      });
  }

  patchForm(data: Sys1001CompanyDto): void {
    if (!this.form || !data) return;
    this.form.patchValue({
      company_no:       data.company_no,
      company_id:       data.company_id,
      company_name:     data.company_name,
      company_name_nls: data.company_name_nls,
      company_type:     data.company_type,
      reg_no:           data.reg_no,
      trade_license_no: data.trade_license_no,
      vat_reg_no:       data.vat_reg_no,
      tin_no:           data.tin_no,
      bin_no:           data.bin_no,
      company_addr1:    data.company_addr1,
      company_addr2:    data.company_addr2,
      city:             data.city,
      state_province:   data.state_province,
      post_code:        data.post_code,
      country_code:     data.country_code,
      mobile_no:        data.mobile_no,
      contact_no:       data.contact_no,
      email:            data.email,
      website:          data.website,
      logo_path:        data.logo_path ?? null,
      is_active:        data.is_active ?? 1,
    });

    // Load logo bytes via HttpClient (JWT added automatically) → blob URL for <img>
    this.revokeLogo();
    if (data.logo_path) {
      this.fileApi.fetchAsObjectUrl(data.logo_path).subscribe({
        next: url  => this.logoPreview.set(url),
        error: _   => this.logoPreview.set(''),
      });
    } else {
      this.logoPreview.set('');
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    this.isSaving.set(true);
    this.persist()
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe(res => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(this.currentCompanyNo() ? 'Company updated' : 'Company created');
          this.patchForm(res.data);
        }
      });
  }

  /**
   * Replace (or first-time upload) company logo.
   * Calls the core file API → atomically soft-deletes old file + uploads new →
   * then persists the returned serve_path to company.logo_path.
   */
  onLogoSelected(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.toastr.error('Only JPG, PNG, WebP, SVG and GIF images are accepted.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      this.toastr.error('Logo must be under 100 KB.');
      return;
    }
    const companyNo = this.currentCompanyNo();
    if (!companyNo) {
      this.toastr.error('Save the company record first before uploading a logo.');
      return;
    }
    this.isLogoUploading.set(true);
    this.fileApi
      .replace(ENTITY_TYPE_COMPANY_LOGO, companyNo, this.buildLogoFile(file))
      .pipe(
        switchMap(res => {
          if (!isSuccess(res) || !res.data) throw new Error('Upload failed');
          this.form.patchValue({ logo_path: res.data.serve_path });
          return this.persist();
        }),
        finalize(() => this.isLogoUploading.set(false)),
      )
      .subscribe(res => {
        if (isSuccess(res) && res.data) {
          this.patchForm(res.data);
          this.toastr.success('Logo uploaded');
        }
      });
  }

  /**
   * Remove the company logo.
   * Soft-deletes the file via the core file API then clears logo_path on the company record.
   */
  clearLogo(): void {
    const companyNo = this.currentCompanyNo();
    const fileNo    = this.fileApi.fileNoFromPath(this.form.value.logo_path as string);

    if (!companyNo) {
      // Unsaved record — just clear locally
      this.form.patchValue({ logo_path: null });
      this.revokeLogo();
      this.logoPreview.set('');
      return;
    }

    this.isLogoUploading.set(true);

    const doSave = () => {
      this.form.patchValue({ logo_path: null });
      this.persist()
        .pipe(finalize(() => this.isLogoUploading.set(false)))
        .subscribe(res => {
          if (isSuccess(res) && res.data) {
            this.patchForm(res.data);
            this.toastr.success('Logo removed');
          }
        });
    };

    if (fileNo) {
      this.fileApi.delete(fileNo).subscribe({ next: doSave, error: doSave });
    } else {
      doSave();
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Rename the uploaded file to `{company_name}_logo.{ext}`.
   * e.g. "Beta Holding Ltd" → "beta_holding_ltd_logo.png"
   * The File API enforces this name server-side as the stored filename.
   */
  private buildLogoFile(file: File): File {
    const raw   = (this.form.value.company_name as string | null) ?? 'company';
    const slug  = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const ext   = file.name.includes('.') ? file.name.split('.').pop()! : 'jpg';
    return new File([file], `${slug}_logo.${ext}`, { type: file.type });
  }

  /** Revoke the current blob URL to free browser memory before setting a new one. */
  private revokeLogo(): void {
    const current = this.logoPreview();
    if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
  }

  /**
   * Routes to POST (insert) or PUT/{companyNo} (update) based on whether a
   * company record already exists.
   */
  private persist(): Observable<ApiResponse<Sys1001CompanyDto>> {
    const payload    = this.buildPayload();
    const companyNo  = this.currentCompanyNo();
    return companyNo
      ? this.data.update(companyNo, payload)
      : this.data.insert(payload);
  }

  private buildPayload(): Sys1001CompanyDto {
    return { ...this.form.getRawValue(), company_no: this.currentCompanyNo() };
  }
}

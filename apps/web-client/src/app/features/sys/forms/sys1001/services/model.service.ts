import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Sys1001DataService, Sys1001CompanyDto } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

@Injectable()
export class Sys1001ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1001DataService);
  private toastr = inject(ToastrService);

  isSaving = signal(false);
  isLoading = signal(false);
  logoPreview = signal('');
  logoFileName = signal('');
  isDragActive = signal(false);
  currentCompanyNo = signal<number | null>(null);

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
      logo_path:        [''],
      is_active:        [1, [Validators.required]],
    });
  }

  loadCompany(companyNo: number): void {
    this.isLoading.set(true);
    this.currentCompanyNo.set(companyNo);

    this.data
      .getDetail(companyNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.patchForm(res.data);
        }
      });
  }

  patchForm(data: Sys1001CompanyDto): void {
    if (this.form && data) {
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
        logo_path:        data.logo_path,
        is_active:        data.is_active ?? 1,
      });

      if (data.logo_path) {
        this.logoPreview.set(data.logo_path);
      }
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    const val = this.form.getRawValue();
    const payload: Sys1001CompanyDto = {
      ...val,
      company_no: this.currentCompanyNo(),
    };

    this.isSaving.set(true);
    this.data
      .save(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success('Company saved');
          this.patchForm(res.data);
        }
      });
  }

  onLogoSelected(file: File): void {
    this.handleLogoFile(file);
  }

  clearLogo(): void {
    this.form.patchValue({ logo_path: '' });
    this.logoPreview.set('');
    this.logoFileName.set('');
  }

  private handleLogoFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const value = e.target?.result as string;
      this.form.patchValue({ logo_path: value });
      this.logoPreview.set(value);

      const companyId = this.form.getRawValue().company_id || 'company';
      const cleanId = companyId.toString().toLowerCase().replace(/\s+/g, '_');
      this.logoFileName.set(`${cleanId}_logo`);
    };
    reader.readAsDataURL(file);
  }
}

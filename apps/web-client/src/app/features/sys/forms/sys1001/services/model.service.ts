import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';

/**
 * Interface representing a Company entity.
 * Based on the sys_company table in db.md.
 */
export interface ICompany extends BaseEntity {
  company_no: number;
  company_id: string;
  company_name: string;
  company_name_nls?: string | null;
  short_name?: string | null;
  company_type?: string | null;
  trade_license_no?: string | null;
  vat_reg_no?: string | null;
  tin_no?: string | null;
  bin_no?: string | null;
  reg_no?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state_province?: string | null;
  post_code?: string | null;
  country?: string | null;
  mobile_number?: string | null;
  phone_number?: string | null;
  email?: string | null;
  website?: string | null;
  logo_path?: string | null;
  active_status: number;
  remarks?: string | null;
  description?: string | null;
}

@Injectable()
export class Sys1001ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  isLoading = signal(false);
  lastUpdated = signal<string | null>(null);
  logoPreview = signal('');
  logoFileName = signal('');
  isDragActive = signal(false);
  currentCompanyNo = signal<number | null>(null);

  // Instance of the company data
  company = signal<ICompany | null>(null);

  // Form Instance
  form!: FormGroup;

  createForm(): void {
    this.form = this.fb.group({
      company_no: [null],
      company_id: [{ value: '', disabled: true }],
      company_name: ['', [Validators.required, Validators.maxLength(200)]],
      company_name_nls: [''],
      short_name: [''],
      company_type: [''],

      // Legal & Tax Registration
      reg_no: [''],
      trade_license_no: [''],
      vat_reg_no: [''],
      tin_no: [''],
      bin_no: [''],

      // Address
      address1: [''],
      address2: [''],
      city: [''],
      state_province: [''],
      post_code: [''],
      country: [''],

      // Contact
      mobile_number: [''],
      phone_number: [''],
      email: ['', [Validators.email]],
      website: [''],

      logo_path: [''],
      active_status: [1, [Validators.required]],
      remarks: [''],
      description: [''],
      // display_sl removed per user instruction "this field there should be nothing"
    });
  }

  patchForm(data: unknown): void {
    if (this.form && data) {
      const d = data as Record<string, unknown>;
      const mappedData = {
        ...d,
        active_status: (d['active_status'] ??
          d['active_status'] ??
          1) as number,
        company_id: (d['company_id'] ?? d['company_id']) as string,
        company_name_nls: (d['company_name_nls'] ??
          d['company_name_nls']) as string,
        reg_no: (d['reg_no'] ?? d['reg_no']) as string,
        trade_license_no: (d['trade_license_no'] ??
          d['trade_license_no']) as string,
        vat_reg_no: (d['vat_reg_no'] ?? d['vat_reg_no']) as string,
        tin_no: (d['tin_no'] ?? d['tin_no']) as string,
        bin_no: (d['bin_no'] ?? d['bin_no']) as string,
        address1: (d['address1'] ?? d['address_1']) as string,
        address2: (d['address2'] ?? d['address_2']) as string,
        post_code: (d['post_code'] ?? d['post_code']) as string,
        country: (d['country'] ??
          d['country_code'] ??
          d['country_code']) as string,
        mobile_number: (d['mobile_number'] ?? d['mobile_number']) as string,
        phone_number: (d['phone_number'] ?? d['phone_number']) as string,
        email: d['email'] as string,
        logo_path: (d['logo_path'] ?? d['logo_path']) as string,
      };

      this.form.patchValue(mappedData);

      const logo = mappedData.logo_path;
      if (logo) {
        this.logoPreview.set(logo);
      }
    }
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

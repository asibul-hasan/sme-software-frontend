import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseEntity } from '../../../../../core/models/base-entity.model';

export interface ICompany extends BaseEntity {
  active: boolean;
  address_line1: string | null;
  address_line2: string | null;
  bin_no: string | null;
  city: string | null;
  company_code: string;
  company_name: string;
  company_name_local: string | null;
  company_no: number;
  company_type: string | null;
  country_code: string;
  email_primary: string | null;
  email_secondary: string | null;
  logo_url: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  postal_code: string | null;
  registration_no: string | null;
  state_province: string | null;
  tin_no: string | null;
  trade_license_no: string | null;
  vat_reg_no: string | null;
  website: string | null;
}

@Injectable()
export class Sys1001ModelService {
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  lastUpdated = signal<string | null>(null);
  logoPreview = signal('');
  logoFileName = signal('');
  isDragActive = signal(false);
  currentCompanyNo = signal<number | null>(null);

  // Instance of the company data
  company = signal<ICompany | null>(null);

  // Form Instance
  form!: FormGroup;

  constructor() {}

  createForm(): void {
    this.form = this.fb.group({
      company_no: [null],
      company_code: [{ value: '', disabled: true }],
      company_name: ['', [Validators.required, Validators.maxLength(255)]],
      company_name_local: [''],
      company_type: [''],

      // Tax & Legal
      registration_no: [''],
      trade_license_no: [''],
      vat_reg_no: [''],
      bin_no: [''],
      tin_no: [''],

      // Contact
      email_primary: ['', [Validators.email]],
      email_secondary: ['', [Validators.email]],
      phone_primary: [''],
      phone_secondary: [''],
      website: [''],
      address_line1: [''],
      address_line2: [''],
      city: [''],
      state_province: [''],
      postal_code: [''],

      // Localization & Defaults
      country_code: ['BD'],
      logo_url: [''],
      active: [true],
    });
  }

  patchForm(data: ICompany): void {
    if (this.form && data) {
      this.form.patchValue(data);
    }
  }
}

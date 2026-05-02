import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { SysDataService } from '../../services/data.service';
import { sysConstants } from '../../constants/sys.constants';

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sys1001.component.html',
  styleUrls: ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  formdata!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);

  currentCompanyNo: number | null = null;
  lastUpdated = signal<string | null>(null);

  // Constants for dropdowns
  readonly SYS_CONSTS = sysConstants;

  logoPreview = signal('');
  logoFileName = signal('');
  isDragActive = signal(false);
  private readonly maxLogoSize = 2 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    public permissionService: FormPermissionService,
    private sysService: SysDataService,
  ) {}

  ngOnInit(): void {
    // 1. Initialize Form
    this.initForm();

    // 2. Load Permissions
    this.permissionService.loadPermissions('SYS_1001').subscribe();

    // 3. Load Company Data
    this.loadInitialCompany();
  }

  private initForm(): void {
    this.formdata = this.fb.group({
      company_code: [{ value: '', disabled: true }],
      company_name: ['', [Validators.required, Validators.maxLength(255)]],
      company_name_local: [''],
      company_type: [''],

      // Tax & Legal
      reg_no: [''],
      trade_license_no: [''],
      vat_reg_no: [''],
      bin_no: [''],
      tin_no: [''],

      // Contact
      email: ['', [Validators.email]],
      email_primary: ['', [Validators.email]],
      phone: [''],
      phone_primary: [''],
      website: [''],
      address: [''],
      address_line1: [''],
      city: [''],

      // Localization & Defaults
      country_code: ['BD'],
      base_currency_no: ['', Validators.required],
      fiscal_year_start: ['', Validators.required],
      fiscal_year_start_month: ['', Validators.required],
      date_format: ['DD-MM-YYYY'],
      time_zone: ['Asia/Dhaka'],
      logo_url: [''],
    });
  }

  private loadInitialCompany(): void {
    this.isLoading.set(true);
    // Fetch list of companies
    this.sysService.getList<any>('company/list').subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          // Take the first company and load its details
          const firstCompany = res.data[0];
          this.loadCompanyDetails(
            firstCompany.companyNo || firstCompany.company_no,
          );
        } else {
          this.isLoading.set(false);
          this.toastr.warning('No company found to edit.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load companies.');
      },
    });
  }

  private loadCompanyDetails(companyNo: number): void {
    this.sysService
      .getDetails<any>('company/detail', { company_no: companyNo })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.currentCompanyNo = res.data.companyNo || res.data.company_no;
            // Map old fields to new ones if necessary for compatibility
            const data = {
              ...res.data,
              reg_no: res.data.reg_no || res.data.trade_license_no,
              email: res.data.email || res.data.email_primary,
              phone: res.data.phone || res.data.phone_primary,
              address: res.data.address || res.data.address_line1,
              fiscal_year_start_month:
                res.data.fiscal_year_start_month || res.data.fiscal_year_start,
            };
            this.formdata.patchValue(data);
            if (res.data.logo_url) {
              this.logoPreview.set(res.data.logo_url);
            }
            this.lastUpdated.set(new Date().toLocaleString());
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toastr.error('Failed to load company details.');
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    this.isDragActive.set(false);
    if (!file) {
      this.clearLogo();
      return;
    }
    this.handleLogoFile(file);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleLogoFile(file);
    }
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive.set(true);
  }

  onLogoDragLeave(): void {
    this.isDragActive.set(false);
  }

  clearLogo(): void {
    this.formdata.patchValue({ logo_url: '' });
    this.logoPreview.set('');
    this.logoFileName.set('');
  }

  private handleLogoFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Please upload a valid image file.');
      return;
    }
    if (file.size > this.maxLogoSize) {
      this.toastr.error('Logo size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result as string;
      this.formdata.patchValue({ logo_url: value });
      this.logoPreview.set(value);
      this.logoFileName.set(file.name);
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.error('Please complete all required fields correctly.');
      return;
    }

    this.isSaving.set(true);
    const rawData = this.formdata.getRawValue();
    // Map new fields back to old ones for API compatibility
    const payload = {
      ...rawData,
      company_no: this.currentCompanyNo,
      trade_license_no: rawData.reg_no,
      email_primary: rawData.email,
      phone_primary: rawData.phone,
      address_line1: rawData.address,
      fiscal_year_start: rawData.fiscal_year_start_month,
    };

    const saveObs = this.currentCompanyNo
      ? this.sysService.update<any>('company/update', payload)
      : this.sysService.create<any>('company/create', payload);

    saveObs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.toastr.success('Company settings updated successfully.');
          this.lastUpdated.set(new Date().toLocaleString());
        } else {
          this.toastr.error(
            res.message || 'Failed to update company settings.',
          );
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.toastr.error('An error occurred while saving.');
      },
    });
  }

  onReset(): void {
    if (this.currentCompanyNo) {
      this.loadCompanyDetails(this.currentCompanyNo);
    } else {
      this.formdata.reset({
        country_code: 'BD',
        date_format: 'DD-MM-YYYY',
        time_zone: 'Asia/Dhaka',
      });
      this.clearLogo();
    }
  }
}

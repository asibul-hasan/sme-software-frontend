import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from '../../../../core/services/alert.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { SysDataService } from '../../services/data.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1001ModelService } from './services/model.service';

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule, PageFormLayoutComponent],
  templateUrl: './sys1001.component.html',
  providers: [Sys1001ModelService],
  styles: [`
    .logo-box-fixed {
      width: 180px;
      height: 180px;
      background: var(--bg-secondary);
      border: 2px dashed var(--border-color);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
    }

    .logo-box-fixed:hover {
      border-color: var(--indigo);
      background: rgba(var(--indigo-rgb), 0.04);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--indigo-rgb), 0.08);
    }

    .logo-box-fixed.drag-active {
      border-color: var(--emerald);
      background: rgba(16, 185, 129, 0.08);
      transform: scale(1.02);
    }

    .logo-box-fixed.has-logo {
      border-style: solid;
      border-color: var(--border-color);
      background: #fff;
    }

    .file-input-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 10;
    }

    .logo-img-contain {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 0;
      z-index: 1;
    }

    .logo-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      opacity: 0.6;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .logo-box-fixed:hover .logo-empty-state {
      opacity: 1;
      color: var(--indigo);
    }

    .logo-empty-state mat-icon {
      font-size: 54px;
      width: 54px;
      height: 54px;
      margin-bottom: 4px;
    }

    .logo-empty-state .placeholder-text {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }

    .logo-action-bar-integrated {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      height: 42px;
      overflow: hidden;
      width: auto;
      min-width: 240px;
      margin: 0 auto;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    .logo-file-name {
      flex: 1;
      padding: 0 14px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
      border-right: 1px solid var(--border-color);
      height: 100%;
      display: flex;
      align-items: center;
      background: rgba(0,0,0,0.02);
    }

    .action-btn-main {
      background: transparent;
      border: none;
      padding: 0 18px;
      height: 100%;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.2s;
    }

    .action-btn-main:hover {
      background: var(--indigo);
      color: #fff;
    }

    .action-btn-icon {
      background: transparent;
      border: none;
      width: 42px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all 0.2s;
    }

    .action-btn-icon mat-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
    }

    .action-btn-icon:hover:not(:disabled) {
      background: rgba(0,0,0,0.04);
      color: var(--text-primary);
    }

    .action-btn-icon:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .action-sep {
      width: 1px;
      height: 22px;
      background: var(--border-color);
    }
  `]
})
export class Sys1001Component implements OnInit {
  public model = inject(Sys1001ModelService);
  formdata!: FormGroup;
  // Constants for dropdowns
  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS = sysConstants;

  private readonly maxLogoSize = 2 * 1024 * 1024;

  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  public permissionService = inject(FormPermissionService);
  private sysService = inject(SysDataService);

  ngOnInit(): void {
    // 1. Initialize Form
    this.initForm();

    // 2. Load Permissions
    this.permissionService.loadPermissions('SYS_1001').subscribe();

    // 3. Load Company Data
    this.loadInitialCompany();
  }

  onLogoUploadClick(input: HTMLInputElement): void {
    input.click();
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
    this.model.isLoading.set(true);
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
          this.model.isLoading.set(false);
          this.toastr.warning('No company found to edit.');
        }
      },
      error: () => {
        this.model.isLoading.set(false);
        this.toastr.error('Failed to load companies.');
      },
    });
  }

  private loadCompanyDetails(companyNo: number): void {
    this.sysService
      .getDetails<any>('company/detail', { company_no: companyNo })
      .subscribe({
        next: (res) => {
          this.model.isLoading.set(false);
          if (res.success && res.data) {
            this.model.currentCompanyNo.set(
              res.data.companyNo || res.data.company_no,
            );
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
              this.model.logoPreview.set(res.data.logo_url);
            }
            this.model.lastUpdated.set(new Date().toLocaleString());
          }
        },
        error: () => {
          this.model.isLoading.set(false);
          this.toastr.error('Failed to load company details.');
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    this.model.isDragActive.set(false);
    if (!file) {
      return;
    }
    this.handleLogoFile(file);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.model.isDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleLogoFile(file);
    }
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.model.isDragActive.set(true);
  }

  onLogoDragLeave(): void {
    this.model.isDragActive.set(false);
  }

  clearLogo(): void {
    this.formdata.patchValue({ logo_url: '' });
    this.model.logoPreview.set('');
    this.model.logoFileName.set('');
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
    reader.onload = (e: any) => {
      const img = new Image();
      
      // Set onload BEFORE setting src to avoid race conditions
      img.onload = () => {
        // Any size accepted, but must be near-square (max 5px difference)
        const width = img.width;
        const height = img.height;
        const diff = Math.abs(width - height);

        if (diff > 5) {
          this.toastr.error(
            `Invalid dimensions (${width}x${height}). Logo must be nearly square (maximum 5px difference between width and height).`,
          );
          return;
        }

        const value = e.target.result;
        this.formdata.patchValue({ logo_url: value });
        this.model.logoPreview.set(value);

        // Rename logic based on Company ID
        const companyId = this.formdata.getRawValue().company_code || 'company';
        const cleanId = companyId.toString().toLowerCase().replace(/\s+/g, '_');
        const finalName = `${cleanId}_logo`;
        this.model.logoFileName.set(finalName);
      };

      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.error('Please complete all required fields correctly.');
      return;
    }

    this.model.isSaving.set(true);
    const rawData = this.formdata.getRawValue();
    // Map new fields back to old ones for API compatibility
    const payload = {
      ...rawData,
      company_no: this.model.currentCompanyNo(),
      trade_license_no: rawData.reg_no,
      email_primary: rawData.email,
      phone_primary: rawData.phone,
      address_line1: rawData.address,
      fiscal_year_start: rawData.fiscal_year_start_month,
    };

    const saveObs = this.model.currentCompanyNo()
      ? this.sysService.update<any>('company/update', payload)
      : this.sysService.create<any>('company/create', payload);

    saveObs.subscribe({
      next: (res) => {
        this.model.isSaving.set(false);
        if (res.success) {
          this.toastr.success('Company settings updated successfully.');
          this.model.lastUpdated.set(new Date().toLocaleString());
        } else {
          this.toastr.error(
            res.message || 'Failed to update company settings.',
          );
        }
      },
      error: () => {
        this.model.isSaving.set(false);
        this.toastr.error('An error occurred while saving.');
      },
    });
  }

  onReset(): void {
    if (this.model.currentCompanyNo()) {
      this.loadCompanyDetails(this.model.currentCompanyNo()!);
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

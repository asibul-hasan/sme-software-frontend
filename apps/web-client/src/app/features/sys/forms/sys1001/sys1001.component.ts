import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from '../../../../core/services/alert.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { SysDataService } from '../../services/data.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1001ModelService } from './services/model.service';
import { globalConstants } from 'apps/web-client/src/app/core/constants/global.constants';
import { LogoUploadComponent } from '../../../../shared/components/logo-upload/logo-upload.component';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule, LogoUploadComponent, PageFormLayoutComponent],
  templateUrl: './sys1001.component.html',
  providers: [Sys1001ModelService],
  styleUrls: ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  public model = inject(Sys1001ModelService);
  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS = sysConstants;

  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  public permissionService = inject(FormPermissionService);
  private sysService = inject(SysDataService);

  ngOnInit(): void {
    this.model.createForm();
    this.permissionService.loadPermissions('SYS_1001').subscribe();
    this.loadInitialCompany();
  }

  private loadInitialCompany(): void {
    this.loadCompanyDetails(globalConstants.user.companyNo);
  }

  private loadCompanyDetails(companyNo: any): void {
    if (!companyNo) {
      this.toastr.warning('Invalid company ID. Please log in again.');
      return;
    }

    this.sysService.getDetails<any>(`companies/${companyNo}`, {}).subscribe({
      next: (res) => {
        const data = res?.data || res;
        const success = res?.success !== undefined ? res.success : !!data;

        if (success && data) {
          this.model.company.set(data);
          this.model.currentCompanyNo.set(data.company_no || data.companyNo);
          this.model.patchForm(data);
        }
      },
      error: (err) => {
        console.error('Failed to load company details:', err);
        this.toastr.error('Failed to load company details.');
      },
    });
  }

  onSave(): void {
    if (this.model.form.invalid) {
      this.model.form.markAllAsTouched();
      this.toastr.error('Please complete all required fields correctly.');
      return;
    }

    this.model.isSaving.set(true);
    const payload = this.model.form.getRawValue();

    const saveObs = this.model.currentCompanyNo()
      ? this.sysService.update<any>(
          `companies/${this.model.currentCompanyNo()}`,
          payload,
        )
      : this.sysService.create<any>('companies/', payload);

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
      this.model.form.reset({
        country_code: 'BD',
        date_format: 'DD-MM-YYYY',
        time_zone: 'Asia/Dhaka',
      });
      this.model.clearLogo();
    }
  }
}

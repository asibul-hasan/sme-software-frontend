import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';
import { AlertService } from '../../../../core/services/alert.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1001ModelService } from './services/model.service';
import { Sys1001DataService } from './services/data.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { isSuccess } from '../../../../core/models/response.model';
import { LogoUploadComponent } from '../../../../shared/components/logo-upload/logo-upload.component';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule, LogoUploadComponent, PageFormLayoutComponent],
  templateUrl: './sys1001.component.html',
  providers: [Sys1001ModelService, Sys1001DataService],
  styleUrls: ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  public model = inject(Sys1001ModelService);
  public dataService = inject(Sys1001DataService);
  
  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS = sysConstants;

  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  private authContext = inject(AuthContextService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.model.createForm();
    // Wrap side-effects in setTimeout to prevent ExpressionChangedAfterItHasBeenCheckedError
    // especially when dealing with translations and toastr in ngOnInit
    setTimeout(() => {
      this.permissionService.useLocalPermissions('SYS_1001');
      this.loadInitialCompany();
    });
  }

  private loadInitialCompany(): void {
    // Read tenant context reactively from AuthContextService rather than localStorage
    const companyNo = this.authContext.user()?.company_no;
    if (companyNo) {
      this.loadCompanyDetails(companyNo);
    }
  }

  private loadCompanyDetails(companyNo: number): void {
    this.model.isLoading.set(true);
    this.dataService.getCompanyDetails(companyNo)
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.model.company.set(res.data);
            this.model.currentCompanyNo.set((d['company_no'] ?? d['companyNo']) as number);
            this.model.patchForm(res.data);
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

    const companyNo = this.model.currentCompanyNo();
    this.model.isSaving.set(true);
    const payload = this.model.form.getRawValue();

    const saveObs = companyNo
      ? this.dataService.updateCompany(companyNo, payload)
      : this.dataService.createCompany(payload);

    saveObs.pipe(finalize(() => this.model.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Company settings updated successfully.');
            this.model.lastUpdated.set(new Date().toLocaleString());
            if (res.data) {
               this.model.patchForm(res.data);
            }
          } else {
            this.toastr.error(res.message || 'Failed to update company settings.');
          }
        },
        error: () => {
          this.toastr.error('An error occurred while saving.');
        },
      });
  }

  onReset(): void {
    const companyNo = this.model.currentCompanyNo();
    if (companyNo) {
      this.loadCompanyDetails(companyNo);
    } else {
      this.model.form.reset({
        active_status: 1,
        country: 'BD',
      });
      this.model.clearLogo();
    }
  }
}

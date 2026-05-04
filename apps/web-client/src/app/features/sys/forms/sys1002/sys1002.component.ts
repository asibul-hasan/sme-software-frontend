import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { SysDataService } from '../../services/data.service';
import { finalize } from 'rxjs/operators';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1002ModelService, Branch } from './services/model.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sys1002',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [DatePipe, Sys1002ModelService],
  templateUrl: './sys1002.component.html',
  styles: [],
})
export class Sys1002Component implements OnInit {
  public model = inject(Sys1002ModelService);
  formdata!: FormGroup;

  // Constants for dropdowns
  readonly sysConstants = sysConstants;
  onSearchTermChange(val: string) {
    this.model.searchTerm.set(val);
  }

  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  public permissionService = inject(FormPermissionService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    this.initForm();
    this.permissionService.loadPermissions('SYS_1002').subscribe();

    this.loadBranches();
  }

  initForm() {
    this.formdata = this.fb.group({
      branch_code: ['', [Validators.required, Validators.maxLength(20)]],
      branch_name: ['', Validators.required],
      branch_name_local: [''],
      branch_type: [''],
      is_head_office: [false],
      address_line1: [''],
      city: [''],
      phone_primary: [''],
      email: ['', Validators.email],
      manager_user_no: [''],
      cost_center_code: [''],
      opening_date: [''],
      status: ['Active'],
    });
  }

  loadBranches(reselectIndex?: number) {
    this.model.isLoading.set(true);
    this.sysService
      .getList<Branch[]>('branch/list')
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.model.branches.set(res.data);

            if (res.data.length > 0) {
              let indexToSelect = 0;
              if (
                reselectIndex !== undefined &&
                reselectIndex >= 0 &&
                reselectIndex < res.data.length
              ) {
                indexToSelect = reselectIndex;
              }
              this.selectBranch(res.data[indexToSelect], indexToSelect);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.toastr.error('Failed to load branches');
          console.error('Failed to load branches', err);
        },
      });
  }

  selectBranch(branch: Branch, index?: number) {
    if (index !== undefined) {
      this.model.lastSelectedBranchIndex = index;
    } else {
      const idx = this.model
        .branches()
        .findIndex((b) => b.branchNo === branch.branchNo);
      if (idx !== -1) this.model.lastSelectedBranchIndex = idx;
    }

    this.model.selectedBranchNo.set(branch.branchNo);
    this.model.isLoading.set(true);

    this.sysService
      .getDetails<Branch>('branch/detail', {
        branch_no: branch.branchNo,
      })
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.formdata.patchValue({
              branch_code: res.data.branchCode,
              branch_name: res.data.branchName,
              branch_name_local: res.data.branchNameLocal,
              branch_type: res.data.branchType,
              is_head_office: res.data.isHeadOffice || false,
              address_line1: res.data.addressLine1,
              city: res.data.city,
              phone_primary: res.data.phonePrimary,
              email: res.data.email,
              manager_user_no: res.data.managerUserNo ?? '',
              cost_center_code: res.data.costCenterCode,
              opening_date: res.data.openingDate
                ? new Date(res.data.openingDate)
                : null,
              status: res.data.status || 'Active',
            });
          }
        },
        error: (err) => {
          this.toastr.error('Failed to load branch details');
        },
      });
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    this.model.isSaving.set(true);
    const formValue = this.formdata.value;

    // Formatting date
    let formattedDate = null;
    if (formValue.opening_date) {
      formattedDate = this.datePipe.transform(
        formValue.opening_date,
        'yyyy-MM-dd',
      );
    }

    const payload = {
      branch_no: this.model.selectedBranchNo(),
      branch_code: formValue.branch_code,
      branch_name: formValue.branch_name,
      branch_name_local: formValue.branch_name_local,
      branch_type: formValue.branch_type,
      is_head_office: formValue.is_head_office ? 1 : 0,
      address_line1: formValue.address_line1,
      city: formValue.city,
      phone_primary: formValue.phone_primary,
      email: formValue.email,
      manager_user_no: formValue.manager_user_no,
      cost_center_code: formValue.cost_center_code,
      opening_date: formattedDate,
      status: formValue.status,
    };

    const isUpdate = !!this.model.selectedBranchNo();
    const saveObs = isUpdate
      ? this.sysService.update<unknown>('branch/update', payload)
      : this.sysService.create<unknown>('branch/create', payload);

    saveObs.pipe(finalize(() => this.model.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(
            isUpdate ? 'Branch updated' : 'Branch created',
          );
          const reselectIdx = isUpdate ? this.model.lastSelectedBranchIndex : 0;
          this.loadBranches(reselectIdx);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.toastr.error('Failed to save branch');
      },
    });
  }

  onNew() {
    this.model.selectedBranchNo.set(null);
    this.formdata.reset({
      is_head_office: false,
    });
  }

  onReset() {
    if (this.model.selectedBranchNo()) {
      // Re-fetch details
      const b = this.model
        .branches()
        .find((x) => x.branchNo === this.model.selectedBranchNo());
      if (b) {
        this.selectBranch(b);
      }
    } else {
      this.onNew();
    }
  }

  onDelete() {
    if (!this.model.selectedBranchNo()) return;

    this.alertService
      .deleteConfirm('Are you sure you want to delete this branch?')
      .subscribe((confirmed) => {
        if (confirmed) {
          this.model.isLoading.set(true);
          this.sysService
            .delete<unknown>('branch/delete', {
              branch_no: this.model.selectedBranchNo(),
            })
            .pipe(finalize(() => this.model.isLoading.set(false)))
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.toastr.success('Branch deleted successfully');
                  this.loadBranches();
                } else {
                  this.toastr.error(res.message || 'Delete failed');
                }
              },
              error: (err) => {
                this.toastr.error('Server error during delete');
                console.error(err);
              },
            });
        }
      });
  }
}

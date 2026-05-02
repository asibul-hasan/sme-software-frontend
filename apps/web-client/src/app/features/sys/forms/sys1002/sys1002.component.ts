import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { SysDataService } from '../../services/data.service';
import { finalize } from 'rxjs/operators';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';

export interface Branch {
  branchNo: number;
  branchCode: string;
  branchName: string;
  branchNameLocal?: string;
  branchType?: string;
  isHeadOffice?: boolean | number;
  addressLine1?: string;
  city?: string;
  phonePrimary?: string;
  email?: string;
  managerUserNo?: string | number;
  costCenterCode?: string;
  openingDate?: string | Date;
  status?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Component({
  selector: 'app-sys1002',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [DatePipe],
  templateUrl: './sys1002.component.html',
  styles: [],
})
export class Sys1002Component implements OnInit {
  formdata!: FormGroup;

  // Constants for dropdowns
  readonly SYS_CONSTS = sysConstants;

  branches = signal<Branch[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  searchTerm = signal('');

  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    if (!term) return data;
    return data.filter(
      (b) =>
        (b.branchName || '').toLowerCase().includes(term) ||
        (b.branchCode || '').toLowerCase().includes(term),
    );
  });

  selectedBranchNo = signal<number | null>(null);
  lastSelectedBranchIndex = 0;

  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  public permissionService = inject(FormPermissionService);
  private datePipe = inject(DatePipe);


  ngOnInit(): void {
    this.initForm();
    this.permissionService.loadPermissions('SYS_1001').subscribe();

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
    });
  }

  loadBranches(reselectIndex?: number) {
    this.isLoading.set(true);
    this.sysService
      .getList<ApiResponse<Branch[]>>('branch/list')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.branches.set(res.data);

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
          console.error('Failed to load branches', err);
        },
      });
  }

  selectBranch(branch: Branch, index?: number) {
    if (index !== undefined) {
      this.lastSelectedBranchIndex = index;
    } else {
      const idx = this.branches().findIndex(
        (b) => b.branchNo === branch.branchNo,
      );
      if (idx !== -1) this.lastSelectedBranchIndex = idx;
    }

    this.selectedBranchNo.set(branch.branchNo);
    this.isLoading.set(true);

    this.sysService
      .getDetails<ApiResponse<Branch>>('branch/detail', { branch_no: branch.branchNo })
      .pipe(finalize(() => this.isLoading.set(false)))
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
            });
          }
        },
        error: (err) => {
          console.error('Failed to get branch details', err);
        },
      });
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
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
      branch_no: this.selectedBranchNo(),
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
    };

    const isUpdate = !!this.selectedBranchNo();
    const saveObs = isUpdate
      ? this.sysService.update<ApiResponse<unknown>>('branch/update', payload)
      : this.sysService.create<ApiResponse<unknown>>('branch/create', payload);

    saveObs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
          // If inserting, we might want to select the newly added branch.
          // For simplicity, re-select the same index (or 0 if new).
          const reselectIdx = isUpdate ? this.lastSelectedBranchIndex : 0;
          this.loadBranches(reselectIdx);
        } else {
          console.error('Save failed:', res.message);
        }
      },
      error: (err) => {
        console.error('API Error:', err);
      },
    });
  }

  onNew() {
    this.selectedBranchNo.set(null);
    this.formdata.reset({
      is_head_office: false,
    });
  }

  onReset() {
    if (this.selectedBranchNo()) {
      // Re-fetch details
      const b = this.branches().find(
        (x) => x.branchNo === this.selectedBranchNo(),
      );
      if (b) {
        this.selectBranch(b);
      }
    } else {
      this.onNew();
    }
  }

  onDelete() {
    if (!this.selectedBranchNo) return;

    if (confirm('Are you sure you want to delete this branch?')) {
      this.isLoading.set(true);
      this.sysService
        .delete<ApiResponse<unknown>>('branch/delete', { branch_no: this.selectedBranchNo() })
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.loadBranches();
            } else {
              console.error('Delete failed:', res.message);
            }
          },
          error: (err) => {
            console.error('API Error:', err);
          },
        });
    }
  }
}

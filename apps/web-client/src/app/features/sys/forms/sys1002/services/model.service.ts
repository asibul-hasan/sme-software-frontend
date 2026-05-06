import { Injectable, signal, computed, inject } from '@angular/core';

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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SysDataService } from '../../../services/data.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';

@Injectable()
export class Sys1002ModelService {
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private toastr = inject(ToastrService);
  private datePipe = inject(DatePipe);

  branches = signal<Branch[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedBranchNo = signal<number | null>(null);
  lastSelectedBranchIndex = 0;
  
  form!: FormGroup;

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

  initForm() {
    this.form = this.fb.group({
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
    this.isLoading.set(true);
    this.sysService
      .getList<Branch[]>('branch/list')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.branches.set(res.data);
            if (res.data.length > 0) {
              const index = (reselectIndex !== undefined && reselectIndex < res.data.length) ? reselectIndex : 0;
              this.selectBranch(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load branches')
      });
  }

  selectBranch(branch: Branch, index?: number) {
    if (index !== undefined) this.lastSelectedBranchIndex = index;
    this.selectedBranchNo.set(branch.branchNo);
    this.isLoading.set(true);

    this.sysService.getDetails<Branch>('branch/detail', { branch_no: branch.branchNo })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.form.patchValue({
              branch_code: res.data.branchCode,
              branch_name: res.data.branchName,
              branch_name_local: res.data.branchNameLocal,
              branch_type: res.data.branchType,
              is_head_office: !!res.data.isHeadOffice,
              address_line1: res.data.addressLine1,
              city: res.data.city,
              phone_primary: res.data.phonePrimary,
              email: res.data.email,
              manager_user_no: res.data.managerUserNo ?? '',
              cost_center_code: res.data.costCenterCode,
              opening_date: res.data.openingDate ? new Date(res.data.openingDate) : null,
              status: res.data.status || 'Active',
            });
          }
        }
      });
  }

  onSave(callback?: () => void) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }

    this.isSaving.set(true);
    const val = this.form.value;
    const payload = {
      ...val,
      branch_no: this.selectedBranchNo(),
      is_head_office: val.is_head_office ? 1 : 0,
      opening_date: val.opening_date ? this.datePipe.transform(val.opening_date, 'yyyy-MM-dd') : null
    };

    const isUpdate = !!this.selectedBranchNo();
    const obs = isUpdate ? this.sysService.update<any>('branch/update', payload) : this.sysService.create<any>('branch/create', payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success(isUpdate ? 'Branch updated' : 'Branch created');
          this.loadBranches(isUpdate ? this.lastSelectedBranchIndex : 0);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      }
    });
  }

  onNew() {
    this.selectedBranchNo.set(null);
    this.form.reset({ is_head_office: false, status: 'Active' });
  }
}

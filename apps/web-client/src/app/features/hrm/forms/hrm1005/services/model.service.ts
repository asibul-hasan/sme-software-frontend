import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1005DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface LeaveType extends BaseEntity {
  leave_type_no: number;
  leave_type_id: string;
  leave_type_name: string;
  is_paid: number;
  accrual_method: number;
  requires_approval: number;
  is_encashable: number;
  default_days_per_year?: number | null;
  max_carry_forward_days?: number | null;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form + orchestration for HRM_1005 – Leave Type Setup. */
@Injectable()
export class Hrm1005ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1005DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  leaveTypes        = signal<LeaveType[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedNo        = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection     = signal<'asc' | 'desc'>('asc');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.leaveTypes()
      .filter((t) => t.leave_type_name.toLowerCase().includes(term) || t.leave_type_id.toLowerCase().includes(term))
      .sort((a, b) => (a.leave_type_id || '').localeCompare(b.leave_type_id || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      leave_type_no:          [null],
      leave_type_id:          ['', [Validators.required, Validators.maxLength(20)]],
      leave_type_name:        ['', [Validators.required, Validators.maxLength(100)]],
      is_paid:                [1],
      accrual_method:         [1, [Validators.required]],
      requires_approval:      [1],
      is_encashable:          [0],
      default_days_per_year:  [null, [Validators.min(0)]],
      max_carry_forward_days: [null, [Validators.min(0)]],
      remarks:                [''],
      is_active:              [1],
    });
  }

  loadLeaveTypes(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data.loadLeaveTypes().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.leaveTypes.set(res.data);
          if (res.data.length > 0) {
            const index = reselectIndex !== undefined && reselectIndex < res.data.length ? reselectIndex : 0;
            this.selectLeaveType(res.data[index], index);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load leave types'),
    });
  }

  selectLeaveType(item: LeaveType, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedNo.set(item.leave_type_no);
    this.isLoading.set(true);
    this.data.loadLeaveTypeDetail(item.leave_type_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            leave_type_no:          d['leave_type_no'],
            leave_type_id:          d['leave_type_id'],
            leave_type_name:        d['leave_type_name'],
            is_paid:                d['is_paid'] ?? 1,
            accrual_method:         d['accrual_method'] ?? 1,
            requires_approval:      d['requires_approval'] ?? 1,
            is_encashable:          d['is_encashable'] ?? 0,
            default_days_per_year:  d['default_days_per_year'],
            max_carry_forward_days: d['max_carry_forward_days'],
            remarks:                d['remarks'],
            is_active:              d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load leave type details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();

    const payload = {
      leave_type_no:          val.leave_type_no,
      leave_type_id:          val.leave_type_id,
      leave_type_name:        val.leave_type_name,
      is_paid:                val.is_paid ? 1 : 0,
      accrual_method:         val.accrual_method,
      requires_approval:      val.requires_approval ? 1 : 0,
      is_encashable:          val.is_encashable ? 1 : 0,
      default_days_per_year:  val.default_days_per_year,
      max_carry_forward_days: val.max_carry_forward_days,
      branch_no:              this.currentBranchNo,
      remarks:                val.remarks,
      is_active:              val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateLeaveType(this.selectedNo()!, payload)
      : this.data.saveLeaveType(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Leave type updated' : 'Leave type created');
          this.loadLeaveTypes(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteLeaveType(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Leave type deleted');
          this.loadLeaveTypes();
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({
      is_paid: 1,
      accrual_method: 1,
      requires_approval: 1,
      is_encashable: 0,
      is_active: 1,
    });
  }
}

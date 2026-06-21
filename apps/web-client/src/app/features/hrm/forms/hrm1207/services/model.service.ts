import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1207DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Settlement extends BaseEntity {
  settlement_no: number;
  settlement_id: string;
  employee_no: number | null;
  employee_id?: string | null;
  employee_name?: string | null;
  separation_type?: number | null;
  last_working_day: string | null;
  last_salary?: number | null;
  leave_encashment?: number | null;
  gratuity?: number | null;
  bonus_payable?: number | null;
  loan_recovery?: number | null;
  other_deduction?: number | null;
  net_payable?: number | null;
  remarks?: string | null;
  status: number;
  branch_no?: number | null;
  current_pay_period?: string | null;
  current_payroll_status?: string | null;
  unpaid_pay_periods?: string[] | null;
  unpaid_salary_amount?: number | null;
  unpaid_bonus_amount?: number | null;
  pending_payment_amount?: number | null;
  pending_item_count?: number | null;
  posting_event_no?: number | null;
  posting_status?: number | null;
  posting_event_type?: string | null;
  is_active: number;
  row_version: number;
}

type SettlementAction = 'submit' | 'approve' | 'reject' | 'pay' | 'cancel';

@Injectable()
export class Hrm1207ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Hrm1207DataService);
  private commApi = inject(CommonDataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private suppressPreview = false;

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  settlements = signal<Settlement[]>([]);
  employees = signal<EmployeeLookup[]>([]);
  preview = signal<Settlement | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  readonly isDraft = computed(() => this.status() === 1);

  employeeName(no?: number | null): string {
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : (no != null ? `#${no}` : '');
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.settlements()
      .filter((s) => (s.settlement_id || '').toLowerCase().includes(term) || this.employeeName(s.employee_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.settlement_no - a.settlement_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      settlement_no: [null],
      settlement_id: [{ value: '', disabled: true }],
      employee_no: [null, [Validators.required]],
      separation_type: [1],
      last_working_day: [new Date().toISOString().split('T')[0], [Validators.required]],
      last_salary: [{ value: 0, disabled: true }],
      leave_encashment: [0, [Validators.min(0)]],
      gratuity: [0, [Validators.min(0)]],
      bonus_payable: [{ value: 0, disabled: true }],
      other_deduction: [0, [Validators.min(0)]],
      remarks: [''],
      is_active: [1],
    });

    this.form.get('employee_no')?.valueChanges.subscribe(() => this.onPreviewDriverChanged());
    this.form.get('last_working_day')?.valueChanges.subscribe(() => this.onPreviewDriverChanged());
  }

  netPayable(): number {
    const v = this.form?.getRawValue() ?? {};
    const n = (x: unknown) => Number(x) || 0;
    return n(v.last_salary) + n(v.leave_encashment) + n(v.gratuity) + n(v.bonus_payable) - n(v.other_deduction);
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
  }

  loadSettlements(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadSettlements().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.settlements.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.settlement_no === reselectNo) : null;
            this.selectSettlement(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load settlements'),
    });
  }

  selectSettlement(item: Settlement): void {
    this.selectedNo.set(item.settlement_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadSettlementDetail(item.settlement_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.suppressPreview = true;
          this.form.patchValue({
            settlement_no: d.settlement_no,
            settlement_id: d.settlement_id,
            employee_no: d.employee_no,
            separation_type: d.separation_type ?? 1,
            last_working_day: d.last_working_day ? d.last_working_day.slice(0, 10) : null,
            last_salary: d.last_salary ?? 0,
            leave_encashment: d.leave_encashment ?? 0,
            gratuity: d.gratuity ?? 0,
            bonus_payable: d.bonus_payable ?? 0,
            other_deduction: d.other_deduction ?? 0,
            remarks: d.remarks,
            is_active: d.is_active,
          }, { emitEvent: false });
          this.suppressPreview = false;
          this.preview.set(d);
        }
      },
      error: () => this.toastr.error('Failed to load settlement details'),
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
    const payload = { ...val, branch_no: this.currentBranchNo };
    const obs = isUpdate ? this.data.updateSettlement(this.selectedNo()!, payload) : this.data.saveSettlement(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Settlement updated' : 'Settlement created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.settlement_no ?? null);
          this.loadSettlements(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: SettlementAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<SettlementAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', pay: 'marked paid', cancel: 'cancelled' };
          this.toastr.success(`Settlement ${past[action]}`);
          this.loadSettlements(no);
        } else {
          this.toastr.error(res.message || `${action} failed`);
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteSettlement(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Settlement deleted');
          this.loadSettlements(null);
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
    this.status.set(1);
    this.preview.set(null);
    this.suppressPreview = true;
    this.form?.reset({
      settlement_no: null,
      settlement_id: '',
      employee_no: null,
      separation_type: 1,
      last_working_day: new Date().toISOString().split('T')[0],
      last_salary: 0,
      leave_encashment: 0,
      gratuity: 0,
      bonus_payable: 0,
      other_deduction: 0,
      remarks: '',
      is_active: 1,
    }, { emitEvent: false });
    this.suppressPreview = false;
  }

  private onPreviewDriverChanged(): void {
    if (this.suppressPreview || !this.isDraft()) {
      return;
    }
    this.loadPreview();
  }

  private loadPreview(): void {
    const employeeNo = Number(this.form.get('employee_no')?.value) || null;
    const lastWorkingDay = this.form.get('last_working_day')?.value as string | null;
    if (!employeeNo || !lastWorkingDay) {
      this.preview.set(null);
      this.patchAutoAmounts(0, 0);
      return;
    }
    this.data.previewSettlement(employeeNo, lastWorkingDay, this.currentBranchNo).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.preview.set(res.data);
          this.patchAutoAmounts(res.data.last_salary ?? 0, res.data.bonus_payable ?? 0);
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Failed to refresh settlement preview'),
    });
  }

  private patchAutoAmounts(lastSalary: number, bonusPayable: number): void {
    this.form.patchValue({
      last_salary: lastSalary,
      bonus_payable: bonusPayable,
    }, { emitEvent: false });
  }
}

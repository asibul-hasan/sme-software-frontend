import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1206DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Loan extends BaseEntity {
  loan_no: number;
  loan_id: string;
  employee_no: number | null;
  loan_type?: number | null;
  principal_amount?: number | null;
  installment_count?: number | null;
  installment_amount?: number | null;
  recovered_amount?: number | null;
  outstanding_amount?: number | null;
  disbursement_date?: string | null;
  recovery_start?: string | null;
  reason?: string | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

type LoanAction = 'submit' | 'approve' | 'reject' | 'disburse' | 'cancel';

/** State + form + workflow for HRM_1206 – Loan / Advance. */
@Injectable()
export class Hrm1206ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1206DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }

  loans         = signal<Loan[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<SortDirection>('');

  readonly isDraft = computed(() => this.status() === 1);

  employeeName(no?: number | null): string {
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : (no != null ? `#${no}` : '');
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.loans()
      .filter((s) => (s.loan_id || '').toLowerCase().includes(term) || this.employeeName(s.employee_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.loan_no - a.loan_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      loan_no:           [null],
      loan_id:           ['', [Validators.required, Validators.maxLength(30)]],
      employee_no:       [null, [Validators.required]],
      loan_type:         [1],
      principal_amount:  [0, [Validators.required, Validators.min(0.01)]],
      installment_count: [1, [Validators.required, Validators.min(1)]],
      disbursement_date: [new Date().toISOString().split('T')[0]],
      recovery_start:    [null],
      reason:            [''],
      is_active:         [1],
    });
  }

  /** Live installment = principal / count. */
  installmentAmount(): number {
    const v = this.form?.getRawValue() ?? {};
    const principal = Number(v.principal_amount) || 0;
    const count = Math.max(1, Number(v.installment_count) || 1);
    return principal / count;
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
  }

  loadLoans(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadLoans().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.loans.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.loan_no === reselectNo) : null;
            this.selectLoan(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load loans'),
    });
  }

  selectLoan(item: Loan): void {
    this.selectedNo.set(item.loan_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadLoanDetail(item.loan_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.loans.update((arr) => arr.map((x) => (x.loan_no === d.loan_no ? { ...x, ...d } : x)));
          this.form.patchValue({
            loan_no:           d.loan_no,
            loan_id:           d.loan_id,
            employee_no:       d.employee_no,
            loan_type:         d.loan_type ?? 1,
            principal_amount:  d.principal_amount ?? 0,
            installment_count: d.installment_count ?? 1,
            disbursement_date: d.disbursement_date ? d.disbursement_date.slice(0, 10) : null,
            recovery_start:    d.recovery_start ? d.recovery_start.slice(0, 10) : null,
            reason:            d.reason,
            is_active:         d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load loan details'),
    });
  }

  /** The currently selected loan's full row (for recovery/outstanding display). */
  current = computed(() => this.loans().find((l) => l.loan_no === this.selectedNo()) ?? null);

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = { ...val, branch_no: this.currentBranchNo };
    const obs = isUpdate ? this.data.updateLoan(this.selectedNo()!, payload) : this.data.saveLoan(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Loan updated' : 'Loan created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.loan_no ?? null);
          this.loadLoans(savedNo);
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: LoanAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          const past: Record<LoanAction, string> = { submit: 'submitted', approve: 'approved', reject: 'rejected', disburse: 'disbursed', cancel: 'cancelled' };
          this.toastr.success(`Loan ${past[action]}`);
          this.loadLoans(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  recover(amount: number): void {
    const no = this.selectedNo();
    if (!no || !amount || amount <= 0) { this.toastr.warning('Enter a recovery amount'); return; }
    this.isSaving.set(true);
    this.data.recover(no, amount).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Recovery recorded'); this.loadLoans(no); }
        else { this.toastr.error(res.message || 'Recovery failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during recovery'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteLoan(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Loan deleted'); this.loadLoans(null); if (callback) callback(); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.form?.reset({
      loan_type: 1, principal_amount: 0, installment_count: 1,
      disbursement_date: new Date().toISOString().split('T')[0], is_active: 1,
    });
  }
}

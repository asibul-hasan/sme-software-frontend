import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1202DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Payslip {
  payslip_no: number;
  employee_no: number;
  present_days: number; absent_days: number; leave_days: number; lwp_days: number;
  gross_earning: number; total_deduction: number; net_pay: number;
  payment_status: number;
}

export interface PayrollRun extends BaseEntity {
  payroll_run_no: number;
  pay_period: string;
  run_type: number;
  period_start: string;
  period_end: string;
  status: number;
  total_gross: number; total_deduction: number; total_net: number;
  employee_count: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
  payslips?: Payslip[];
}

type RunAction = 'calculate' | 'approve' | 'pay' | 'cancel';

/** State + form + payroll workflow orchestration for HRM_1202 – Salary Processing. */
@Injectable()
export class Hrm1202ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1202DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  runs          = signal<PayrollRun[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  payslips      = signal<Payslip[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<'asc' | 'desc'>('desc');

  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }

  /** Status: 1=Draft 2=Calculated 3=Approved 4=Paid 5=Cancelled. */
  readonly isDraft = computed(() => this.status() === 1);

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.runs()
      .filter((r) => (r.pay_period || '').toLowerCase().includes(term))
      .sort((a, b) => b.payroll_run_no - a.payroll_run_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      payroll_run_no: [null],
      pay_period:     ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
      run_type:       [1, [Validators.required]],
      period_start:   ['', [Validators.required]],
      period_end:     ['', [Validators.required]],
    });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
  }

  loadRuns(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadRuns().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.runs.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((r) => r.payroll_run_no === reselectNo) : null;
            this.selectRun(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load payroll runs'),
    });
  }

  selectRun(item: PayrollRun): void {
    this.selectedNo.set(item.payroll_run_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadRunDetail(item.payroll_run_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.payslips.set(d.payslips ?? []);
          this.form.patchValue({
            payroll_run_no: d.payroll_run_no,
            pay_period:     d.pay_period,
            run_type:       d.run_type,
            period_start:   (d.period_start ?? '').slice(0, 10),
            period_end:     (d.period_end ?? '').slice(0, 10),
          });
        }
      },
      error: () => this.toastr.error('Failed to load run details'),
    });
  }

  /** Create a new Draft run (runs are not edited after creation — they are processed). */
  onSave(): void {
    if (this.selectedNo()) return;   // existing runs are processed via workflow actions, not saved
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Enter pay period (YYYY-MM) and period dates.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const payload = {
      pay_period:   val.pay_period,
      run_type:     val.run_type,
      period_start: val.period_start,
      period_end:   val.period_end,
      branch_no:    this.currentBranchNo,
    };
    this.data.createRun(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Payroll run created');
          this.loadRuns(res.data?.payroll_run_no ?? null);
        } else {
          this.toastr.error(res.message || 'Create failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during create'),
    });
  }

  doAction(action: RunAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Payroll ${action === 'pay' ? 'marked paid' : action + 'd'}`);
          this.loadRuns(no);
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
    this.data.deleteRun(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Payroll run deleted');
          this.loadRuns(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const first = `${y}-${pad(m + 1)}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    this.selectedNo.set(null);
    this.status.set(1);
    this.payslips.set([]);
    this.form?.reset({
      run_type: 1,
      pay_period: `${y}-${pad(m + 1)}`,
      period_start: first,
      period_end: `${y}-${pad(m + 1)}-${pad(lastDay)}`,
    });
  }
}

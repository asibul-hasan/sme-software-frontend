import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1204DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface RunLite { payroll_run_no: number; pay_period: string; status: number; employee_count: number; }
export interface PayslipLite { payslip_no: number; employee_no: number; net_pay: number; payment_status: number; }

export interface PayslipLine { component_no: number; component_name: string; component_type: number; amount: number; }
export interface PayslipFull {
  payslip_no: number;
  payroll_run_no: number;
  pay_period: string;
  period_start: string | null;
  period_end: string | null;
  employee_no: number;
  present_days: number; absent_days: number; leave_days: number; lwp_days: number;
  gross_earning: number; total_deduction: number; net_pay: number;
  pay_method?: number | null;
  payment_status: number;
  lines: PayslipLine[];
}

/** State for the read-only HRM_1204 Payslip Generator. */
@Injectable()
export class Hrm1204ModelService {
  private data    = inject(Hrm1204DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);

  runs        = signal<RunLite[]>([]);
  payslips    = signal<PayslipLite[]>([]);
  employees   = signal<EmployeeLookup[]>([]);
  payslip     = signal<PayslipFull | null>(null);
  isLoading   = signal(false);
  selectedRun = signal<number | null>(null);
  selectedPayslip = signal<number | null>(null);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }
  employeeMeta(no?: number | null): EmployeeLookup | null {
    return this.employees().find((x) => x.employee_no === no) ?? null;
  }

  earnings   = computed(() => (this.payslip()?.lines ?? []).filter((l) => l.component_type === 1));
  deductions = computed(() => (this.payslip()?.lines ?? []).filter((l) => l.component_type !== 1 && l.component_type !== 3));

  loadLookups(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
  }

  loadRuns(): void {
    this.isLoading.set(true);
    this.data.loadRuns().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.runs.set(res.data);
          if (res.data.length > 0) this.selectRun(res.data[0].payroll_run_no);
        }
      },
      error: () => this.toastr.error('Failed to load payroll runs'),
    });
  }

  selectRun(runNo: number | null): void {
    this.selectedRun.set(runNo);
    this.payslip.set(null);
    this.selectedPayslip.set(null);
    if (runNo == null) { this.payslips.set([]); return; }
    this.isLoading.set(true);
    this.data.loadPayslips(runNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.payslips.set(res.data);
          if (res.data.length > 0) this.selectPayslip(res.data[0].payslip_no);
        }
      },
      error: () => this.toastr.error('Failed to load payslips'),
    });
  }

  selectPayslip(payslipNo: number | null): void {
    this.selectedPayslip.set(payslipNo);
    if (payslipNo == null) { this.payslip.set(null); return; }
    this.isLoading.set(true);
    this.data.loadPayslip(payslipNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.payslip.set(res.data); },
      error: () => this.toastr.error('Failed to load payslip'),
    });
  }
}

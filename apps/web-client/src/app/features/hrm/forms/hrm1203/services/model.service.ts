import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1203DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface RunLite {
  payroll_run_no: number;
  pay_period: string;
  run_type: number;
  status: number;
  employee_count: number;
  total_net: number;
}

export interface SheetRow {
  payslip_no: number;
  employee_no: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  lwp_days: number;
  gross_earning: number;
  total_deduction: number;
  net_pay: number;
  pay_method?: number | null;
  payment_status: number;
}

/** State for the read-only HRM_1203 Salary Sheet report. */
@Injectable()
export class Hrm1203ModelService {
  private data    = inject(Hrm1203DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);

  runs        = signal<RunLite[]>([]);
  employees   = signal<EmployeeLookup[]>([]);
  sheet       = signal<SheetRow[]>([]);
  isLoading   = signal(false);
  selectedRun = signal<number | null>(null);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }

  selectedRunMeta = computed(() => this.runs().find((r) => r.payroll_run_no === this.selectedRun()) ?? null);

  rows = computed(() =>
    this.sheet().map((s) => ({ ...s, employee_name: this.employeeName(s.employee_no) })) as unknown as Record<string, unknown>[]
  );

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
    if (runNo == null) { this.sheet.set([]); return; }
    this.isLoading.set(true);
    this.data.loadSheet(runNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.sheet.set(res.data); },
      error: () => this.toastr.error('Failed to load salary sheet'),
    });
  }
}

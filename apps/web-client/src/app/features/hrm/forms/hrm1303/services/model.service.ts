import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1303DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface LeaveBalanceRow {
  leave_balance_no: number;
  employee_no: number;
  leave_type_no: number;
  leave_year: number;
  entitled_days: number;
  accrued_days: number;
  consumed_days: number;
  carried_forward: number;
  available_days: number;
}

interface LeaveTypeLite { leave_type_no: number; leave_type_name: string; }

/** State for the read-only HRM_1303 Leave Balance report. */
@Injectable()
export class Hrm1303ModelService {
  private data    = inject(Hrm1303DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);

  balances    = signal<LeaveBalanceRow[]>([]);
  employees   = signal<EmployeeLookup[]>([]);
  leaveTypes  = signal<LeaveTypeLite[]>([]);
  isLoading   = signal(false);
  year        = signal<number>(new Date().getFullYear());

  readonly yearOptions = (() => {
    const y = new Date().getFullYear();
    return [y + 1, y, y - 1, y - 2, y - 3];
  })();

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }
  leaveTypeName(no?: number | null): string {
    if (no == null) return '';
    return this.leaveTypes().find((x) => x.leave_type_no === no)?.leave_type_name ?? `#${no}`;
  }

  /** Rows enriched with resolved names for the common-table (search/sort/export use the labels). */
  rows = computed(() =>
    this.balances().map((b) => ({
      ...b,
      employee_name: this.employeeName(b.employee_no),
      leave_type_name: this.leaveTypeName(b.leave_type_no),
    })) as unknown as Record<string, unknown>[]
  );

  loadLookups(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
    this.data.loadLeaveTypes().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.leaveTypes.set(r.data); } });
  }

  loadBalances(): void {
    this.isLoading.set(true);
    this.data.loadBalances(this.year()).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.balances.set(res.data); },
      error: () => this.toastr.error('Failed to load leave balances'),
    });
  }
}

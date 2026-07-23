import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse, isSuccess } from '../../../../../core/models/response.model';
import { LeaveRequest } from './model.service';

export interface EmployeeLeaveHistoryItem {
  leave_application_no: number;
  employee_no: number;
  leave_type_no: number;
  leave_type_name?: string | null;
  from_date: string;
  to_date: string;
  total_days: number;
  status: number;
  approver_name?: string | null;
  decision_remarks?: string | null;
  reason?: string | null;
  created_at?: string | null;
}

export interface EmployeeLeaveTypeBalance {
  leave_type_no: number;
  leave_type_name: string;
  entitled_days: number;
  consumed_days: number;
  available_days: number;
}

/**
 * Form-level HTTP service for HRM_1321 – Leave Approval.
 * Reuses the HRM_1301 endpoints: the approval inbox is a view over leave
 * applications, and approve/reject route through the shared approval engine.
 */
@Injectable()
export class Hrm1321DataService {
  private hrService = inject(HrmDataService);

  /**
   * The approval list for the current approver, filtered entirely server-side.
   * status: 1/undefined = in-flight (Pending/Waiting), 2 = Approved, 3 = Rejected.
   * The other ids narrow the approver's own list. Any filter change re-calls this.
   */
  loadApprovalList(filters: {
    status?: number | null;
    department_no?: number | null;
    designation_no?: number | null;
    employee_no?: number | null;
    leave_type_no?: number | null;
  } = {}): Observable<ApiResponse<LeaveRequest[]>> {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v != null) params[k] = v;
    }
    return this.hrService.getList<LeaveRequest[]>('forms/hrm1301/leaves/status', params);
  }

  /** Approve — remarks optional (doc: "Remarks optional for approval"). */
  approve(no: number, remarks?: string): Observable<ApiResponse<LeaveRequest>> {
    return this.hrService.insert<LeaveRequest>(
      `forms/hrm1301/leaves/${no}/approve${remarks ? `?remarks=${encodeURIComponent(remarks)}` : ''}`,
      {},
    );
  }

  /** Reject — the backend requires a reason ("Leave Rejection Reasons Report"). */
  reject(no: number, remarks: string): Observable<ApiResponse<LeaveRequest>> {
    return this.hrService.insert<LeaveRequest>(
      `forms/hrm1301/leaves/${no}/reject?remarks=${encodeURIComponent(remarks)}`,
      {},
    );
  }

  /** Balance snapshot for the selected request's employee + leave type. */
  loadBalance(
    employeeNo: number,
    leaveTypeNo: number,
    leaveYear?: number,
  ): Observable<ApiResponse<Record<string, number>>> {
    const params: Record<string, string | number> = { employeeNo, leaveTypeNo };
    if (leaveYear != null) params['leaveYear'] = leaveYear;
    return this.hrService.getList<Record<string, number>>('forms/hrm1301/balance', params);
  }

  /** Leave types lookup list. */
  loadLeaveTypes(): Observable<ApiResponse<Array<{ leave_type_no: number; leave_type_name: string }>>> {
    return this.hrService.getList('forms/hrm1005/leave-types');
  }

  /** Employee leave history list for view-only modal with date range and leave type filtering. */
  loadEmployeeHistory(
    employeeNo: number,
    fromDate?: string | null,
    toDate?: string | null,
    leaveTypeNo?: number | null,
  ): Observable<ApiResponse<EmployeeLeaveHistoryItem[]>> {
    const params: Record<string, string | number> = { employeeNo };
    if (fromDate) params['fromDate'] = fromDate;
    if (toDate) params['toDate'] = toDate;
    if (leaveTypeNo != null) params['leaveTypeNo'] = leaveTypeNo;
    return this.hrService.getList<EmployeeLeaveHistoryItem[]>('forms/hrm1301/leaves', params);
  }

  /** Employee leave type balances composed from leave types + individual balances. */
  loadEmployeeBalances(employeeNo: number): Observable<ApiResponse<EmployeeLeaveTypeBalance[]>> {
    return this.loadLeaveTypes().pipe(
      switchMap((typesRes) => {
        const types = isSuccess(typesRes) && typesRes.data ? typesRes.data : [];
        if (!types.length) {
          return of({ status_code: 200, timestamp: new Date().toISOString(), message: 'OK', data: [] as EmployeeLeaveTypeBalance[] });
        }
        const requests = types.map((lt) =>
          this.loadBalance(employeeNo, lt.leave_type_no).pipe(
            map((bRes): EmployeeLeaveTypeBalance => {
              const b = isSuccess(bRes) && bRes.data ? bRes.data : ({} as Record<string, number>);
              return {
                leave_type_no: lt.leave_type_no,
                leave_type_name: lt.leave_type_name,
                entitled_days: (b['entitled_days'] || 0) + (b['carried_forward'] || 0),
                consumed_days: b['consumed_days'] || 0,
                available_days: b['available_days'] || 0,
              };
            }),
            catchError((): Observable<EmployeeLeaveTypeBalance> =>
              of({
                leave_type_no: lt.leave_type_no,
                leave_type_name: lt.leave_type_name,
                entitled_days: 0,
                consumed_days: 0,
                available_days: 0,
              }),
            ),
          ),
        );
        return forkJoin(requests).pipe(
          map((data): ApiResponse<EmployeeLeaveTypeBalance[]> => ({
            status_code: 200,
            timestamp: new Date().toISOString(),
            message: 'OK',
            data,
          })),
        );
      }),
      catchError((): Observable<ApiResponse<EmployeeLeaveTypeBalance[]>> =>
        of({ status_code: 200, timestamp: new Date().toISOString(), message: 'OK', data: [] }),
      ),
    );
  }
}

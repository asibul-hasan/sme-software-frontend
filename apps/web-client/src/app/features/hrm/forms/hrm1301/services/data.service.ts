import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { LeaveApplication, LeaveBalance, LeaveTypeOption } from './model.service';

/** Form-level HTTP service for HRM_1301 – Leave Application (/api/v1/hrm/forms/hrm1301). */
@Injectable()
export class Hrm1301DataService {
  private hrService = inject(HrmDataService);

  loadLeaves(): Observable<ApiResponse<LeaveApplication[]>> {
    return this.hrService.getList<LeaveApplication[]>('forms/hrm1301/leaves');
  }
  loadFilteredHistory(employeeNo: number, leaveTypeNo?: number | null, fromDate?: string | null, toDate?: string | null): Observable<ApiResponse<LeaveApplication[]>> {
    const params: Record<string, string | number> = { employeeNo };
    if (leaveTypeNo != null) params['leaveTypeNo'] = leaveTypeNo;
    if (fromDate) params['fromDate'] = fromDate;
    if (toDate) params['toDate'] = toDate;
    return this.hrService.getList<LeaveApplication[]>('forms/hrm1301/leaves/filtered', params);
  }
  loadLeaveDetail(no: number): Observable<ApiResponse<LeaveApplication>> {
    return this.hrService.getDtl<LeaveApplication>('forms/hrm1301/leaves', no);
  }
  saveLeave(payload: Partial<LeaveApplication>): Observable<ApiResponse<LeaveApplication>> {
    return this.hrService.insert<LeaveApplication>('forms/hrm1301/leaves', payload);
  }
  updateLeave(no: number, payload: Partial<LeaveApplication>): Observable<ApiResponse<LeaveApplication>> {
    // Backend uses POST /leaves for both insert and update
    return this.hrService.insert<LeaveApplication>('forms/hrm1301/leaves', payload);
  }
  deleteLeave(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1301/leaves', no);
  }

  // ── Workflow transitions (POST with empty body) ──────────────────────────
  action(no: number, action: 'submit' | 'approve' | 'reject' | 'cancel'): Observable<ApiResponse<LeaveApplication>> {
    return this.hrService.insert<LeaveApplication>(`forms/hrm1301/leaves/${no}/${action}`, {});
  }

  // ── Lookups ───────────────────────────────────────────────────────────────
  loadBalance(employeeNo: number, leaveTypeNo: number, leaveYear?: number): Observable<ApiResponse<LeaveBalance[] | LeaveBalance>> {
    const params: Record<string, number> = { employeeNo, leaveTypeNo };
    if (leaveYear != null) params['leaveYear'] = leaveYear;
    return this.hrService.getList<LeaveBalance[] | LeaveBalance>('forms/hrm1301/balance', params);
  }
  loadLeaveTypes(): Observable<ApiResponse<LeaveTypeOption[]>> {
    return this.hrService.getList<LeaveTypeOption[]>('forms/hrm1005/leave-types');
  }
}

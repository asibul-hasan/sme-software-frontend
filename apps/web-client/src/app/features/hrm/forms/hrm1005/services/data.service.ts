import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { BaseEntity } from '../../../../../core/models/base-entity.model';

export interface LeaveType {
  leave_type_no?: number;
  leave_type_id?: string;
  leave_type_name: string;
  is_paid?: number | null;
  statutory_category?: string | null;
  branch_no?: number | null;
  
  // Master defaults
  accrual_method?: number | null;
  requires_approval?: number | null;
  is_encashable?: number | null;
  default_days_per_year?: number | null;
  max_carry_forward_days?: number | null;
  is_carry_forward_allowed?: number | null;
  eligibility_service_months?: number | null;
  documentation_required?: number | null;
  carry_forward_validity_months?: number | null;
  is_lapsable?: number | null;
  min_duration_days?: number | null;
  max_duration_days?: number | null;

  remarks?: string | null;
  is_active?: number | null;
  row_version?: number;
}

export interface LeavePolicySetup {
  policy_no?: number;
  policy_name?: string | null;
  leave_type_no: number;
  employee_group_no: number; // Designation
  accrual_method?: number | null;
  default_days?: number | null;
  work_days_per_leave_day?: number | null;
  proration_method?: number | null;
  eligibility_service_months?: number | null;
  is_carry_forward_allowed?: number | null;
  max_carry_forward_days?: number | null;
  carry_forward_validity_months?: number | null;
  is_encashable?: number | null;
  max_encashable_days?: number | null;
  encashment_formula?: string | null;
  is_lapsable?: number | null;
  max_dept_leave_percentage?: number | null;
  specialized_config?: string | null;
  branch_no?: number | null;
  row_version?: number;
}

/** Form-level HTTP service for HRM_1005 – Leave Type Setup (/api/v1/hrm/forms/hrm1005/leave-types). */
@Injectable()
export class Hrm1005DataService {
  private hrService = inject(HrmDataService);

  loadLeaveTypes(): Observable<ApiResponse<LeaveType[]>> {
    return this.hrService.getList<LeaveType[]>('forms/hrm1005/leave-types');
  }
  loadLeaveTypeDetail(no: number): Observable<ApiResponse<LeaveType>> {
    return this.hrService.getDtl<LeaveType>('forms/hrm1005/leave-types', no);
  }
  saveLeaveType(payload: Partial<LeaveType>): Observable<ApiResponse<LeaveType>> {
    return this.hrService.insert<LeaveType>('forms/hrm1005/leave-types', payload);
  }
  updateLeaveType(no: number, payload: Partial<LeaveType>): Observable<ApiResponse<LeaveType>> {
    return this.hrService.update<LeaveType>('forms/hrm1005/leave-types', no, payload);
  }
  saveLeaveTypes(payload: Partial<LeaveType>[]): Observable<ApiResponse<LeaveType[]>> {
    return this.hrService.insert<LeaveType[]>('forms/hrm1005/leave-types/bulk', payload);
  }
  deleteLeaveType(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1005/leave-types', no);
  }

  // --- Leave Policies (Child Table) ---
  loadPolicies(): Observable<ApiResponse<LeavePolicySetup[]>> {
    return this.hrService.getList<LeavePolicySetup[]>('forms/hrm1005/policies');
  }
  savePolicy(payload: Partial<LeavePolicySetup>): Observable<ApiResponse<LeavePolicySetup>> {
    return this.hrService.insert<LeavePolicySetup>('forms/hrm1005/policies', payload);
  }
  updatePolicy(no: number, payload: Partial<LeavePolicySetup>): Observable<ApiResponse<LeavePolicySetup>> {
    return this.hrService.update<LeavePolicySetup>('forms/hrm1005/policies', no, payload);
  }
  deletePolicy(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1005/policies', no);
  }
}

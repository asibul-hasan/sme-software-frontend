import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../core/services/base-data.service';
import { ApiResponse } from '../../core/models/response.model';

/**
 * Shared service for common lookup APIs used across different modules.
 * This service centralizes access to data that is needed by multiple features
 * but doesn't necessarily belong to a single module's primary workflow.
 */
@Injectable({
  providedIn: 'root',
})
export class CommonDataService extends BaseDataService {
  protected override readonly modulePath = ''; // Root level: /api/v1/...

  // ─── HR Lookups ────────────────────────────────────────────────────────────

  getEmployeeList(filters?: {
    active_status?: number | 1;
    employment_type?: number | null;
    department_no?: number | null;
  }): Observable<ApiResponse<any[]>> {
    const params: Record<string, number> = {};
    if (filters) {
      if (filters.active_status != null)
        params['active_status'] = filters.active_status;
      if (filters.employment_type != null)
        params['employment_type'] = filters.employment_type;
      if (filters.department_no != null)
        params['department_no'] = filters.department_no;
    }
    return this.getList<any[]>('hr/employees', params);
  }

  /**
   * Fetches the list of departments for lookups.
   */
  getDepartmentList(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('hr/departments');
  }

  /**
   * Fetches the list of designations for lookups.
   */
  getDesignationList(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('hr/designations');
  }

  // ─── System Lookups ────────────────────────────────────────────────────────

  /**
   * Fetches active branches.
   */
  getBranchList(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('branches');
  }

  /**
   * Fetches active companies.
   */
  getCompanyList(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('companies');
  }
}

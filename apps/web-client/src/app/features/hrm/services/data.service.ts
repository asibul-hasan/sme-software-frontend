import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../../core/services/base-data.service';
import { ApiResponse } from '../../../core/models/response.model';

/**
 * HTTP gateway for the HR module (/api/v1/hrm/...).
 *
 * Updated to use the standardized RESTful 5-API pattern via BaseDataService.
 * Resources: departments, designations, employees.
 */
@Injectable({
  providedIn: 'root',
})
export class HrmDataService extends BaseDataService {
  protected override readonly modulePath = 'hrm';

  // ─── Departments ────────────────────────────────────────────────────────────

  getDepartments(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('departments');
  }

  getDepartmentDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('departments', no);
  }

  insertDepartment(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('departments', payload);
  }

  updateDepartment(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('departments', no, payload);
  }

  deleteDepartment(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('departments', no);
  }

  // ─── Designations ───────────────────────────────────────────────────────────

  getDesignations(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('designations');
  }

  getDesignationDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('designations', no);
  }

  insertDesignation(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('designations', payload);
  }

  updateDesignation(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('designations', no, payload);
  }

  deleteDesignation(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('designations', no);
  }

  // ─── Employees ──────────────────────────────────────────────────────────────

  getEmployees(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('employees');
  }

  getEmployeeDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('employees', no);
  }

  insertEmployee(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('employees', payload);
  }

  updateEmployee(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('employees', no, payload);
  }

  deleteEmployee(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('employees', no);
  }
}

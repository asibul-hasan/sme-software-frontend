import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IApprovalApprover, IApprovalScope, IApprovalStep, ISysLookup } from './model.service';

@Injectable()
export class Sys1108DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1108`;
  private lookupUrl = `${this.config.apiUrl}/common/lookups`;

  /** Workflow list. Omitted filters mean "all" for that column. */
  getList(filters?: { branch_no?: number | null; department_no?: number | null; menu_no?: number | null }): Observable<ApiResponse<IApprovalScope[]>> {
    let params = new HttpParams();
    if (filters?.branch_no != null) params = params.set('branch_no', filters.branch_no);
    if (filters?.department_no != null) params = params.set('department_no', filters.department_no);
    if (filters?.menu_no != null) params = params.set('menu_no', filters.menu_no);
    return this.http.get<ApiResponse<IApprovalScope[]>>(`${this.baseUrl}/workflows`, { params });
  }

  /** Steps of one workflow — loaded when a workflow row is selected. */
  getSteps(scopeNo: number): Observable<ApiResponse<IApprovalStep[]>> {
    return this.http.get<ApiResponse<IApprovalStep[]>>(`${this.baseUrl}/workflows/${scopeNo}/steps`);
  }

  /** Approvers of one step — loaded when a step row is selected. */
  getApprovers(stepNo: number): Observable<ApiResponse<IApprovalApprover[]>> {
    return this.http.get<ApiResponse<IApprovalApprover[]>>(`${this.baseUrl}/steps/${stepNo}/approvers`);
  }
  getEnrolledMenuOptions(): Observable<ApiResponse<ISysLookup[]>> {
    return this.http.get<ApiResponse<ISysLookup[]>>(`${this.baseUrl}/menus`);
  }
  getBranchOptions(): Observable<ApiResponse<ISysLookup[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.lookupUrl}/branches`).pipe(
      map((res: ApiResponse<any[]>) => ({
        ...res,
        data: res.data?.map((b: any) => ({ value: b.branch_no, label: b.branch_name })) || []
      }))
    );
  }
  getDepartmentOptions(): Observable<ApiResponse<ISysLookup[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.lookupUrl}/departments`).pipe(
      map((res: ApiResponse<any[]>) => ({
        ...res,
        data: res.data?.map((d: any) => ({ value: d.department_no, label: d.department_name })) || []
      }))
    );
  }
  getEmployeeOptions(): Observable<ApiResponse<ISysLookup[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.lookupUrl}/employees`).pipe(
      map((res: ApiResponse<any[]>) => ({
        ...res,
        data: res.data?.map((e: any) => ({ value: e.employee_no, label: e.full_name_with_id })) || []
      }))
    );
  }
  save(payload: Partial<IApprovalScope>): Observable<ApiResponse<IApprovalScope>> {
    return this.http.post<ApiResponse<IApprovalScope>>(`${this.baseUrl}/workflows`, payload);
  }
  delete(scopeNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/workflows/${scopeNo}`);
  }
}

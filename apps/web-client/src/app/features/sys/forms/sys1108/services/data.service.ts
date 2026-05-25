import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IApprovalWorkflow, ISysLookup } from './model.service';

@Injectable()
export class Sys1108DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1108`;

  getList(): Observable<ApiResponse<IApprovalWorkflow[]>> {
    return this.http.get<ApiResponse<IApprovalWorkflow[]>>(`${this.baseUrl}/workflows`);
  }
  getRoleOptions(): Observable<ApiResponse<ISysLookup[]>> {
    return this.http.get<ApiResponse<ISysLookup[]>>(`${this.baseUrl}/role-options`);
  }
  save(payload: Partial<IApprovalWorkflow>): Observable<ApiResponse<IApprovalWorkflow>> {
    return this.http.post<ApiResponse<IApprovalWorkflow>>(`${this.baseUrl}/workflows`, payload);
  }
  delete(workflowNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/workflows/${workflowNo}`);
  }
}

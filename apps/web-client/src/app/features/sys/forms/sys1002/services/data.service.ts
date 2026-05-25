import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

/**
 * Form-specific DTO for SYS1002 Branch.
 */
export interface Sys1002BranchDto {
  branch_no: number | null;
  company_no: number;
  branch_id: string | null;
  branch_name: string;
  branch_name_nls: string | null;
  branch_type: string | null;
  branch_addr1: string | null;
  branch_addr2: string | null;
  city: string | null;
  post_code: string | null;
  mobile_no: string | null;
  contact_no: string | null;
  email: string | null;
  manager_employee_no: number | null;
  manager_name: string | null;
  is_main_branch: number;
  is_active: number;
  row_version: number | null;
}

/**
 * Lightweight employee for manager dropdown.
 */
export interface Sys1002EmployeeDto {
  employee_no: number;
  employee_id: string;
  full_name: string;
  department_name: string | null;
  designation_name: string | null;
  is_active: number;
}

/**
 * Form-level HTTP service for SYS1002 Branch Setup.
 * All API calls go through the dedicated Sys1002Controller.
 */
@Injectable()
export class Sys1002DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1002`;

  getBranchList(): Observable<ApiResponse<Sys1002BranchDto[]>> {
    return this.http.get<ApiResponse<Sys1002BranchDto[]>>(`${this.baseUrl}/branches`);
  }

  getBranchDetail(branchNo: number): Observable<ApiResponse<Sys1002BranchDto>> {
    return this.http.get<ApiResponse<Sys1002BranchDto>>(`${this.baseUrl}/branches/${branchNo}`);
  }

  saveBranch(payload: Sys1002BranchDto): Observable<ApiResponse<Sys1002BranchDto>> {
    return this.http.post<ApiResponse<Sys1002BranchDto>>(`${this.baseUrl}/branches`, payload);
  }

  deleteBranch(branchNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/branches/${branchNo}`);
  }

  getEmployees(): Observable<ApiResponse<Sys1002EmployeeDto[]>> {
    return this.http.get<ApiResponse<Sys1002EmployeeDto[]>>(`${this.baseUrl}/employees`);
  }
}

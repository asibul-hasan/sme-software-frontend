import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Sys1101EmployeeDto, Sys1101UserDto, Sys1101UserRoleDto } from './model.service';

/**
 * Form-level HTTP service for SYS1101 User Management.
 * All API calls go through the dedicated Sys1101Controller.
 */
@Injectable()
export class Sys1101DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1101`;

  // ─── Employee Operations ──────────────────────────────────────────────────

  getEmployeeList(isActive?: number): Observable<ApiResponse<Sys1101EmployeeDto[]>> {
    const params: Record<string, string> = {};
    if (isActive !== undefined && isActive !== null) {
      params['is_active'] = String(isActive);
    }
    return this.http.get<ApiResponse<Sys1101EmployeeDto[]>>(`${this.baseUrl}/employees`, { params });
  }

  getEmployeeDetail(employeeNo: number): Observable<ApiResponse<Sys1101EmployeeDto>> {
    return this.http.get<ApiResponse<Sys1101EmployeeDto>>(`${this.baseUrl}/employees/${employeeNo}`);
  }

  // ─── User Operations ─────────────────────────────────────────────────────

  getUserByEmployeeNo(employeeNo: number): Observable<ApiResponse<Sys1101UserDto | null>> {
    return this.http.get<ApiResponse<Sys1101UserDto | null>>(`${this.baseUrl}/users/by-employee/${employeeNo}`);
  }

  createUser(payload: Partial<Sys1101UserDto>): Observable<ApiResponse<Sys1101UserDto>> {
    return this.http.post<ApiResponse<Sys1101UserDto>>(`${this.baseUrl}/users`, payload);
  }

  updateUser(userNo: number, payload: Partial<Sys1101UserDto>): Observable<ApiResponse<Sys1101UserDto>> {
    return this.http.put<ApiResponse<Sys1101UserDto>>(`${this.baseUrl}/users/${userNo}`, payload);
  }

  deleteUser(userNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/users/${userNo}`);
  }

  lockUser(userNo: number, locked: number): Observable<ApiResponse<Sys1101UserDto>> {
    return this.http.patch<ApiResponse<Sys1101UserDto>>(`${this.baseUrl}/users/${userNo}/lock?locked=${locked}`, {});
  }

  resetPassword(userNo: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/users/${userNo}/reset-password`, { new_password: newPassword });
  }

  // ─── User Role Operations ────────────────────────────────────────────────

  getUserRoles(userNo: number): Observable<ApiResponse<Sys1101UserRoleDto[]>> {
    return this.http.get<ApiResponse<Sys1101UserRoleDto[]>>(`${this.baseUrl}/users/${userNo}/roles`);
  }
}

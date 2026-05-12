import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from './base-data.service';
import { ApiResponse } from '../models/response.model';

/**
 * HTTP gateway for core system entities that live directly under /api/v1/.
 * Examples: companies, branches, roles, users.
 */
@Injectable({
  providedIn: 'root',
})
export class CoreDataService extends BaseDataService {
  protected override readonly modulePath = ''; // Root level: /api/v1/...

  // ─── Companies ─────────────────────────────────────────────────────────────

  getCompanies(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('companies');
  }

  getCompanyDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('companies', no);
  }

  insertCompany(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('companies', payload);
  }

  updateCompany(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('companies', no, payload);
  }

  deleteCompany(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('companies', no);
  }

  // ─── Branches ──────────────────────────────────────────────────────────────

  getBranches(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('branches');
  }

  getBranchDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('branches', no);
  }

  insertBranch(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('branches', payload);
  }

  updateBranch(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('branches', no, payload);
  }

  deleteBranch(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('branches', no);
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  getRoles(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('roles');
  }

  getRoleDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('roles', no);
  }

  insertRole(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('roles', payload);
  }

  updateRole(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('roles', no, payload);
  }

  deleteRole(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('roles', no);
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  getUsers(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('users');
  }

  searchUsers(params?: Record<string, string | number | boolean>): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('users', params);
  }

  getUserDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('users', no);
  }

  getUserByEmployeeNo(employeeNo: number): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseUrl}/users/employee/${employeeNo}`);
  }

  insertUser(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('users', payload);
  }

  updateUser(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('users', no, payload);
  }

  deleteUser(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('users', no);
  }

  setUserLocked(no: number, locked: number): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.baseUrl}/users/${no}/lock`, null, {
      params: { locked },
    });
  }

  resetUserPassword(no: number, payload: object): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/users/${no}/reset-password`, payload);
  }
}

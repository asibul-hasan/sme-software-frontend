import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../../core/services/base-data.service';
import { ApiResponse } from '../../../core/models/response.model';

/**
 * HTTP gateway for the SYS module (/api/v1/sys/...).
 *
 * Updated to use the standardized RESTful 5-API pattern via BaseDataService.
 * Resources: menus, modules, submodules, companies, branches, roles, users.
 */
@Injectable({
  providedIn: 'root',
})
export class SysDataService extends BaseDataService {
  protected override readonly modulePath = 'sys';

  // ─── Menus ──────────────────────────────────────────────────────────────────

  getMenus(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('menus');
  }

  getMenuDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('menus', no);
  }

  insertMenu(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('menus', payload);
  }

  updateMenu(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('menus', no, payload);
  }

  deleteMenu(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('menus', no);
  }

  // ─── Modules ───────────────────────────────────────────────────────────────

  getModules(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('modules');
  }

  getModuleDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('modules', no);
  }

  insertModule(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('modules', payload);
  }

  updateModule(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('modules', no, payload);
  }

  deleteModule(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('modules', no);
  }

  // ─── Submodules ────────────────────────────────────────────────────────────

  getSubmodules(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('submodules');
  }

  getSubmoduleDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('submodules', no);
  }

  insertSubmodule(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('submodules', payload);
  }

  updateSubmodule(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('submodules', no, payload);
  }

  deleteSubmodule(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('submodules', no);
  }

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

  getRoleLookupList(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('roles/lookup');
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

  getUserSummary(params?: Record<string, string | number | boolean>): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('users/summary', params);
  }

  getUserRoles(userNo: number): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>(`users/${userNo}/roles`);
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

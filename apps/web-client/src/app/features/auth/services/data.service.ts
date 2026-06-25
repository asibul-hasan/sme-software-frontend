import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseDataService } from '../../../core/services/base-data.service';
import { ApiResponse } from '../../../core/models/response.model';
import { IPermissionConfig } from '../../../core/models/permission.model';
import { SKIP_LOADER } from '../../../core/interceptors/loader.interceptor';

export interface LoginRequest {
  /**
   * Login identifier — maps to backend `sys_user.user_id`.
   * The backend still accepts the legacy `user_name` key via `@JsonAlias`,
   * but new code should send `user_id`.
   */
  user_id: string;
  password: string;
  company_no?: number;
  branch_no?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Wire shape of {@code POST /api/v1/auth/refresh}.
 * Both tokens are rotated on every call.
 */
export interface RefreshResponse {
  access_token:  string;
  refresh_token: string;
  auth_config?: AuthConfigResponse;
}

export interface AuthConfigResponse {
  access_token_expiration_ms: number;
  refresh_token_expiration_ms: number;
  access_token_refresh_before_ms: number;
  inactivity_timeout_ms: number;
}

export interface Company {
  company_no: number;
  company_name: string;
}

export interface Branch {
  branch_no: number;
  branch_name: string;
  company_no?: number;
  company_name?: string;
}

/**
 * Wire shape of `POST /api/auth/login` — mirrors the backend
 * {@code LoginResponse} after Jackson SNAKE_CASE serialisation.
 *
 * Note: `permissions` is not yet populated by the backend. It is reserved
 * here so that when the backend starts shipping it the frontend will
 * pick it up without further changes.
 */
export interface LoginResponse {
  access_token:  string;
  refresh_token: string;

  user_no:   number;
  user_name: string;

  // Employee context — present when the user is linked to an HR record.
  employee_no?:      number;
  employee_name?:    string;
  department_name?:  string;
  designation_name?: string;

  // Tenant context.
  company_no:    number;
  company_name?: string;
  branch_no:     number;
  branch_name?:  string;
  available_branches?: Branch[];
  role_nos?: number[];

  // Sidebar menu (flat list — see `menu-builder.service.ts` for shape).
  menu?: unknown[];

  permissions?: IPermissionConfig;

  /** Data-access scope: 1=BRANCH, 2=COMPANY, 3=GLOBAL (SYS re-plan). */
  access_scope?: number;
  /** 1 = the user must change their password before continuing. */
  must_change_password?: number;
  auth_config?: AuthConfigResponse;
}

export interface RegisterRequest {
  user_name: string;
  password: string;
  email: string;
  full_name: string;
}

export interface RegisterCompanyRequest {
  company_name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface UserContextResponse {
  company_no: number;
  company_name: string;
  branches: Branch[];
}

/**
 * Wire shape of `GET /api/auth/permissions/check?formId=` — mirrors the
 * backend {@code FormPermissionResponse} after SNAKE_CASE serialisation.
 */
export interface FormPermissionData {
  form_id:     string;
  form_name?:  string;
  can_view:    boolean;
  can_insert:  boolean;
  can_update:  boolean;
  can_delete:  boolean;
}

/**
 * Wire shape of `GET /api/auth/me` — mirrors the backend {@code CurrentUserResponse}.
 */
export interface CurrentUserData {
  user_no:      number;
  user_name:    string;
  name?:        string;
  employee_no?: number;
  designation?: string;
  company_no:   number;
  company_name?: string;
  branch_no?:   number;
  branch_name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthDataService extends BaseDataService {
  protected override readonly modulePath = 'auth';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, credentials)
      .pipe(map(res => res.data));
  }

  /** Validates the stored refresh token and rotates both tokens. */
  refresh(request: RefreshTokenRequest): Observable<RefreshResponse> {
    return this.http
      .post<ApiResponse<RefreshResponse>>(`${this.baseUrl}/refresh`, request, {
        context: new HttpContext().set(SKIP_LOADER, true)
      })
      .pipe(map(res => res.data));
  }

  getConfig(): Observable<AuthConfigResponse> {
    return this.http
      .get<ApiResponse<AuthConfigResponse>>(`${this.baseUrl}/config`, {
        context: new HttpContext().set(SKIP_LOADER, true)
      })
      .pipe(map(res => res.data));
  }

  getProfile(): Observable<CurrentUserData> {
    return this.http
      .get<ApiResponse<CurrentUserData>>(`${this.baseUrl}/me`)
      .pipe(map((res) => res.data));
  }

  getUserContexts(userId: string): Observable<UserContextResponse[]> {
    return this.http.get<ApiResponse<UserContextResponse[]>>(`${this.baseUrl}/contexts`, {
      params: { user_id: userId },
    }).pipe(map(res => res.data));
  }

  /**
   * Returns the full envelope so callers can inspect status/message. The
   * `FormPermissionService` uses {@link isSuccess} on the envelope to decide
   * whether to apply the flags or fall back to "no permissions".
   */
  checkFormPermission(formId: string): Observable<ApiResponse<FormPermissionData>> {
    return this.http.get<ApiResponse<FormPermissionData>>(`${this.baseUrl}/permissions/check`, {
      params: { formId },
    });
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/logout`, {})
      .pipe(map(() => void 0));
  }

  switchBranch(branchNo: number): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/switch-branch`, { branch_no: branchNo })
      .pipe(map(res => res.data));
  }

  /** Switch the active company (multi-company users). branchNo optional → server picks default. */
  switchCompany(companyNo: number, branchNo?: number): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/switch-company`,
        { company_no: companyNo, branch_no: branchNo ?? null })
      .pipe(map(res => res.data));
  }

  changePassword(payload: ChangePasswordPayload): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/change-password`, payload);
  }

  register(userData: RegisterRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/register`, userData).pipe(map(res => res.data));
  }

  registerCompany(data: RegisterCompanyRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/register-company`, data).pipe(map(res => res.data));
  }

  getPermissions(): Observable<unknown> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseUrl}/permissions`).pipe(map(res => res.data));
  }

  getCompaniesByUserId(userId: string): Observable<Company[]> {
    return this.http.get<ApiResponse<Company[]>>(`${this.baseUrl}/companies`, {
      params: { user_id: userId },
    }).pipe(map(res => res.data));
  }

  getBranchesByUserId(userId: string): Observable<Branch[]> {
    return this.http.get<ApiResponse<Branch[]>>(`${this.baseUrl}/branches`, {
      params: { user_id: userId },
    }).pipe(map(res => res.data));
  }
}

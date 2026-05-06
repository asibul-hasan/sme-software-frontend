import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from '../../../core/services/app-config.service';
import { IPermissionConfig } from '../../../core/models/permission.model';
import { User } from '../../../core/models/user.model';

import { ApiResponse } from '../../../core/models/response.model';

export interface LoginRequest {
  user_name: string;
  password: string;
  company_no?: number;
  branch_no?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// User interface removed - now imported from core/models

export interface Company {
  id?: number;
  company_no?: number;
  companyName: string;
  companyShortName?: string;
  name?: string;
}

export interface Branch {
  id?: number;
  branch_no?: number;
  branchName: string;
  name?: string;
}

export interface FormPermissionData {
  formId?: string;
  form_Id?: string;
  formName?: string;
  form_name?: string;
  create: string | boolean;
  update: string | boolean;
  delete: string | boolean;
  view: string | boolean;
}

export interface UserContextResponse {
  company_no: number;
  company_name: string;
  branches: Array<{
    branch_no: number;
    branch_name: string;
  }>;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_name: string;
  user_no: number;
  company_no: number;
  branch_no: number;
  company_name?: string;
  branch_name?: string;
  user?: User; 
  permissions?: IPermissionConfig;
  menu?: unknown[];
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  company_no: number;
  phone?: string;
  designation?: string;
  branch_ids?: number[];
}

export interface RegisterCompanyRequest {
  companyName: string;
  companyShortName: string;
  adminEmail: string;
  password: string;
  country: string;
  baseCurrencyCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get apiUrl() {
    return `${this.config.apiUrl}/auth`;
  }

  // Generic CRUD Methods
  getList<T>(path: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`).pipe(map(res => res.data));
  }

  getDetails<T>(path: string, params: Record<string, string | number | boolean>): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`, { params }).pipe(map(res => res.data));
  }

  create<T>(path: string, payload: unknown): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload).pipe(map(res => res.data));
  }

  update<T>(path: string, payload: unknown): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload).pipe(map(res => res.data));
  }

  delete<T>(path: string, params: Record<string, string | number | boolean>): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}/${path}`, { params }).pipe(map(res => res.data));
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      map(res => res.data)
    );
  }

  refresh(request: RefreshTokenRequest): Observable<LoginResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/refresh`, request).pipe(
      map(res => res.data)
    );
  }

  register(userData: RegisterRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/register`, userData).pipe(map(res => res.data));
  }

  registerCompany(data: RegisterCompanyRequest): Observable<unknown> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/register-company`, data).pipe(map(res => res.data));
  }

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(map(res => res.data));
  }

  getUserContexts(userName: string): Observable<UserContextResponse[]> {
    return this.http.get<ApiResponse<UserContextResponse[]>>(`${this.apiUrl}/contexts`, {
      params: { user_name: userName },
    }).pipe(map(res => res.data));
  }

  getPermissions(): Observable<unknown> {
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/permissions`).pipe(map(res => res.data));
  }

  getCompaniesByUserName(userName: string): Observable<Company[]> {
    return this.http.get<ApiResponse<Company[]>>(`${this.apiUrl}/companies`, {
      params: { user_name: userName },
    }).pipe(map(res => res.data));
  }

  getBranchesByUserName(userName: string): Observable<Branch[]> {
    return this.http.get<ApiResponse<Branch[]>>(`${this.apiUrl}/branches`, {
      params: { user_name: userName },
    }).pipe(map(res => res.data));
  }

  checkFormPermission(formId: string): Observable<FormPermissionData> {
    return this.http.get<ApiResponse<FormPermissionData>>(`${this.apiUrl}/permissions/check`, {
      params: { formId },
    }).pipe(map(res => res.data));
  }
}

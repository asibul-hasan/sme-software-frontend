import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

export interface LoginRequest {
  company_no: number;
  branch_no: number;
  user_name: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password?: string;
  company_id: number;
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

export interface User {
  id: number;
  name: string;
  email: string;
  company_id: number;
  phone?: string;
  designation?: string;
  branch_ids?: number[];
}

export interface LoginResponse {
  access_token: string;
  user: User;
  permissions: any; // IPermissionConfig
  menu?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private get apiUrl() {
    return `${this.config.apiUrl}/auth`;
  }

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
  ) {}

  // Generic CRUD Methods
  getList<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${path}`);
  }

  getDetails<T>(path: string, params: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${path}`, { params });
  }

  create<T>(path: string, payload: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${path}`, payload);
  }

  update<T>(path: string, payload: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${path}`, payload);
  }

  delete<T>(path: string, params: any): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${path}`, { params });
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.apiUrl}/login`, {
      params: credentials as any,
    });
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  registerCompany(data: RegisterCompanyRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register-company`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  getPermissions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permissions`);
  }

  getCompaniesByUserName(userName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/companies`, {
      params: { user_name: userName },
    });
  }

  getBranchesByUserName(userName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/branches`, {
      params: { user_name: userName },
    });
  }

  checkFormPermission(formId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permissions/check`, {
      params: { formId },
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
  providedIn: 'root'
})
export class AuthDataService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
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
    return this.http.post<any>(`${this.apiUrl}/companies`, { user_name: userName });
  }

  getBranchesByUserName(userName: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/branches`, { user_name: userName });
  }

  checkFormPermission(formId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/permissions/check`, { formId });
  }
}

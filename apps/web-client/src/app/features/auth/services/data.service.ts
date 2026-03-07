import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
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

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  getPermissions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permissions`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { UserOption, Option, MappingRow } from './model.service';

/**
 * Form-level HTTP service for SYS1107 User-Company Mapping (form-wise Sys1107Controller).
 */
@Injectable()
export class Sys1107DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1107`;

  getUsers(): Observable<ApiResponse<UserOption[]>> {
    return this.http.get<ApiResponse<UserOption[]>>(`${this.baseUrl}/users`);
  }

  getCompanies(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/companies`);
  }

  getMappings(userNo: number): Observable<ApiResponse<MappingRow[]>> {
    return this.http.get<ApiResponse<MappingRow[]>>(`${this.baseUrl}/users/${userNo}/mappings`);
  }

  saveMappings(userNo: number, rows: MappingRow[]): Observable<ApiResponse<MappingRow[]>> {
    return this.http.post<ApiResponse<MappingRow[]>>(`${this.baseUrl}/users/${userNo}/mappings`, rows);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { UserOption, Option, RoleOption, MappingRow } from './model.service';

/**
 * Form-level HTTP service for SYS1104 User-Branch Mapping (form-wise Sys1104Controller).
 */
@Injectable()
export class Sys1104DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1104`;

  getUsers(): Observable<ApiResponse<UserOption[]>> {
    return this.http.get<ApiResponse<UserOption[]>>(`${this.baseUrl}/users`);
  }

  getBranches(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/branches`);
  }

  getRoles(): Observable<ApiResponse<RoleOption[]>> {
    return this.http.get<ApiResponse<RoleOption[]>>(`${this.baseUrl}/roles`);
  }

  getMappings(userNo: number): Observable<ApiResponse<MappingRow[]>> {
    return this.http.get<ApiResponse<MappingRow[]>>(`${this.baseUrl}/users/${userNo}/mappings`);
  }

  saveMappings(userNo: number, rows: MappingRow[]): Observable<ApiResponse<MappingRow[]>> {
    return this.http.post<ApiResponse<MappingRow[]>>(`${this.baseUrl}/users/${userNo}/mappings`, rows);
  }

  /** Apply the same mappings to many users at once (backend loops + reconciles each). */
  bulkSaveMappings(userNos: number[], rows: MappingRow[]): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/mappings/bulk`, {
      user_nos: userNos,
      rows,
    });
  }
}

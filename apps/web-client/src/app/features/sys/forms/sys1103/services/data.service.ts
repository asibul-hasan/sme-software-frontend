import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { RoleOption, MatrixRow } from './model.service';

/**
 * Form-level HTTP service for SYS1103 Role Permission Matrix.
 * Talks to the dedicated Sys1103Controller (form-wise API).
 */
@Injectable()
export class Sys1103DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1103`;

  getRoles(): Observable<ApiResponse<RoleOption[]>> {
    return this.http.get<ApiResponse<RoleOption[]>>(`${this.baseUrl}/roles`);
  }

  getMatrix(roleNo: number): Observable<ApiResponse<MatrixRow[]>> {
    return this.http.get<ApiResponse<MatrixRow[]>>(`${this.baseUrl}/roles/${roleNo}/matrix`);
  }

  saveMatrix(roleNo: number, rows: MatrixRow[]): Observable<ApiResponse<MatrixRow[]>> {
    return this.http.post<ApiResponse<MatrixRow[]>>(`${this.baseUrl}/roles/${roleNo}/matrix`, rows);
  }
}

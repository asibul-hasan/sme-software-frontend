import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ICostCenter } from './model.service';

@Injectable()
export class Sys1007DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1007`;

  getList(): Observable<ApiResponse<ICostCenter[]>> {
    return this.http.get<ApiResponse<ICostCenter[]>>(`${this.baseUrl}/cost-centers`);
  }
  save(payload: Partial<ICostCenter>): Observable<ApiResponse<ICostCenter>> {
    return this.http.post<ApiResponse<ICostCenter>>(`${this.baseUrl}/cost-centers`, payload);
  }
  delete(costCenterNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/cost-centers/${costCenterNo}`);
  }
}

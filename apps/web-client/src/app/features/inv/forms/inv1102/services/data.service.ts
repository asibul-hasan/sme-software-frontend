import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IAdjustment, Lookups } from './model.service';

@Injectable()
export class Inv1102DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1102`;

  getLookups(): Observable<ApiResponse<Lookups>> {
    return this.http.get<ApiResponse<Lookups>>(`${this.baseUrl}/lookups`);
  }
  getList(): Observable<ApiResponse<IAdjustment[]>> {
    return this.http.get<ApiResponse<IAdjustment[]>>(`${this.baseUrl}/adjustments`);
  }
  getDetail(no: number): Observable<ApiResponse<IAdjustment>> {
    return this.http.get<ApiResponse<IAdjustment>>(`${this.baseUrl}/adjustments/${no}`);
  }
  save(payload: Partial<IAdjustment>): Observable<ApiResponse<IAdjustment>> {
    return this.http.post<ApiResponse<IAdjustment>>(`${this.baseUrl}/adjustments`, payload);
  }
  submit(no: number): Observable<ApiResponse<IAdjustment>> {
    return this.http.post<ApiResponse<IAdjustment>>(`${this.baseUrl}/adjustments/${no}/submit`, {});
  }
  approve(no: number): Observable<ApiResponse<IAdjustment>> {
    return this.http.post<ApiResponse<IAdjustment>>(`${this.baseUrl}/adjustments/${no}/approve`, {});
  }
  cancel(no: number): Observable<ApiResponse<IAdjustment>> {
    return this.http.post<ApiResponse<IAdjustment>>(`${this.baseUrl}/adjustments/${no}/cancel`, {});
  }
  delete(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/adjustments/${no}`);
  }
}

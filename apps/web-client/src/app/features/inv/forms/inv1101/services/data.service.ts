import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IOpening, Lookups } from './model.service';

@Injectable()
export class Inv1101DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1101`;

  getLookups(): Observable<ApiResponse<Lookups>> {
    return this.http.get<ApiResponse<Lookups>>(`${this.baseUrl}/lookups`);
  }
  getList(): Observable<ApiResponse<IOpening[]>> {
    return this.http.get<ApiResponse<IOpening[]>>(`${this.baseUrl}/openings`);
  }
  getDetail(adjustmentNo: number): Observable<ApiResponse<IOpening>> {
    return this.http.get<ApiResponse<IOpening>>(`${this.baseUrl}/openings/${adjustmentNo}`);
  }
  save(payload: Partial<IOpening>): Observable<ApiResponse<IOpening>> {
    return this.http.post<ApiResponse<IOpening>>(`${this.baseUrl}/openings`, payload);
  }
  post(adjustmentNo: number): Observable<ApiResponse<IOpening>> {
    return this.http.post<ApiResponse<IOpening>>(`${this.baseUrl}/openings/${adjustmentNo}/post`, {});
  }
  delete(adjustmentNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/openings/${adjustmentNo}`);
  }
}

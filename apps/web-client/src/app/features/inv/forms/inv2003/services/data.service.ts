import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ITransfer, Lookups } from './model.service';

@Injectable()
export class Inv2003DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv2003`;

  getLookups(): Observable<ApiResponse<Lookups>> {
    return this.http.get<ApiResponse<Lookups>>(`${this.baseUrl}/lookups`);
  }
  getList(): Observable<ApiResponse<ITransfer[]>> {
    return this.http.get<ApiResponse<ITransfer[]>>(`${this.baseUrl}/transfers`);
  }
  getDetail(no: number): Observable<ApiResponse<ITransfer>> {
    return this.http.get<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers/${no}`);
  }
  save(payload: Partial<ITransfer>): Observable<ApiResponse<ITransfer>> {
    return this.http.post<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers`, payload);
  }
  submit(no: number): Observable<ApiResponse<ITransfer>> {
    return this.http.post<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers/${no}/submit`, {});
  }
  dispatch(no: number): Observable<ApiResponse<ITransfer>> {
    return this.http.post<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers/${no}/dispatch`, {});
  }
  receive(no: number, payload: Partial<ITransfer>): Observable<ApiResponse<ITransfer>> {
    return this.http.post<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers/${no}/receive`, payload);
  }
  cancel(no: number): Observable<ApiResponse<ITransfer>> {
    return this.http.post<ApiResponse<ITransfer>>(`${this.baseUrl}/transfers/${no}/cancel`, {});
  }
  delete(no: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/transfers/${no}`);
  }
}

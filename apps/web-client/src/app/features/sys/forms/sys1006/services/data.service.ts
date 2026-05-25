import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IExchangeRate, Lookup } from './model.service';

@Injectable()
export class Sys1006DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1006`;

  getCurrencies(): Observable<ApiResponse<Lookup[]>> {
    return this.http.get<ApiResponse<Lookup[]>>(`${this.baseUrl}/currencies`);
  }
  getList(): Observable<ApiResponse<IExchangeRate[]>> {
    return this.http.get<ApiResponse<IExchangeRate[]>>(`${this.baseUrl}/exchange-rates`);
  }
  save(payload: Partial<IExchangeRate>): Observable<ApiResponse<IExchangeRate>> {
    return this.http.post<ApiResponse<IExchangeRate>>(`${this.baseUrl}/exchange-rates`, payload);
  }
  delete(exchangeRateNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/exchange-rates/${exchangeRateNo}`);
  }
}

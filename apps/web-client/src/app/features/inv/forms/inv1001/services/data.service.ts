import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IProduct, Lookups } from './model.service';

@Injectable()
export class Inv1001DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1001`;

  getList(): Observable<ApiResponse<IProduct[]>> {
    return this.http.get<ApiResponse<IProduct[]>>(`${this.baseUrl}/products`);
  }
  getDetail(productNo: number): Observable<ApiResponse<IProduct>> {
    return this.http.get<ApiResponse<IProduct>>(`${this.baseUrl}/products/${productNo}`);
  }
  save(payload: Partial<IProduct>): Observable<ApiResponse<IProduct>> {
    return this.http.post<ApiResponse<IProduct>>(`${this.baseUrl}/products`, payload);
  }
  delete(productNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/products/${productNo}`);
  }
  getLookups(): Observable<ApiResponse<Lookups>> {
    return this.http.get<ApiResponse<Lookups>>(`${this.baseUrl}/lookups`);
  }
}

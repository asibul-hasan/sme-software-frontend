import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBarcode, Lookups } from './model.service';

@Injectable()
export class Inv1002DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1002`;

  getLookups(): Observable<ApiResponse<Lookups>> {
    return this.http.get<ApiResponse<Lookups>>(`${this.baseUrl}/lookups`);
  }
  getBarcodes(productNo: number): Observable<ApiResponse<IBarcode[]>> {
    const params = new HttpParams().set('productNo', String(productNo));
    return this.http.get<ApiResponse<IBarcode[]>>(`${this.baseUrl}/barcodes`, { params });
  }
  nextCode(): Observable<ApiResponse<{ code: string }>> {
    return this.http.get<ApiResponse<{ code: string }>>(`${this.baseUrl}/barcodes/next-code`);
  }
  save(payload: Partial<IBarcode>): Observable<ApiResponse<IBarcode>> {
    return this.http.post<ApiResponse<IBarcode>>(`${this.baseUrl}/barcodes`, payload);
  }
  delete(barcodeNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/barcodes/${barcodeNo}`);
  }
}

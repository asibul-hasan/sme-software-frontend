import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IRack, Option } from './model.service';

@Injectable()
export class Inv2002DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv2002`;

  getWarehouseOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/warehouse-options`);
  }
  getList(warehouseNo: number): Observable<ApiResponse<IRack[]>> {
    const params = new HttpParams().set('warehouseNo', String(warehouseNo));
    return this.http.get<ApiResponse<IRack[]>>(`${this.baseUrl}/racks`, { params });
  }
  save(payload: Partial<IRack>): Observable<ApiResponse<IRack>> {
    return this.http.post<ApiResponse<IRack>>(`${this.baseUrl}/racks`, payload);
  }
  delete(rackNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/racks/${rackNo}`);
  }
}

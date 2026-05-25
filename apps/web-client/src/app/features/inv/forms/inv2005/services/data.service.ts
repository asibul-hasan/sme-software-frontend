import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IReorder, Option } from './model.service';

@Injectable()
export class Inv2005DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv2005`;

  getWarehouseOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/warehouse-options`);
  }
  getProductOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/product-options`);
  }
  getList(warehouseNo: number): Observable<ApiResponse<IReorder[]>> {
    const params = new HttpParams().set('warehouseNo', String(warehouseNo));
    return this.http.get<ApiResponse<IReorder[]>>(`${this.baseUrl}/reorders`, { params });
  }
  saveBulk(warehouseNo: number, rows: IReorder[]): Observable<ApiResponse<IReorder[]>> {
    const params = new HttpParams().set('warehouseNo', String(warehouseNo));
    return this.http.post<ApiResponse<IReorder[]>>(`${this.baseUrl}/reorders/bulk`, rows, { params });
  }
  delete(reorderNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/reorders/${reorderNo}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IWarehouse } from './model.service';

@Injectable()
export class Inv2001DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv2001`;

  getList(): Observable<ApiResponse<IWarehouse[]>> {
    return this.http.get<ApiResponse<IWarehouse[]>>(`${this.baseUrl}/warehouses`);
  }
  save(payload: Partial<IWarehouse>): Observable<ApiResponse<IWarehouse>> {
    return this.http.post<ApiResponse<IWarehouse>>(`${this.baseUrl}/warehouses`, payload);
  }
  delete(warehouseNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/warehouses/${warehouseNo}`);
  }
}

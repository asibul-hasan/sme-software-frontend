import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface BatchExpiryRow {
  batch_no: number;
  batch_code: string;
  product_no: number;
  product_name?: string;
  variant_no?: number | null;
  mfg_date?: string | null;
  expiry_date?: string | null;
  days_to_expiry?: number | null;
  expiry_status: string;
  received_cost?: number;
  warehouse_no?: number;
  warehouse_name?: string;
  qty_on_hand?: number;
  qty_available?: number;
  stock_value?: number;
}

@Injectable()
export class Inv2004DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv2004`;

  batches(filters: { warehouseNo?: number | null; productNo?: number | null; status?: string | null; nearDays?: number | null }): Observable<ApiResponse<BatchExpiryRow[]>> {
    let params = new HttpParams();
    if (filters.warehouseNo) params = params.set('warehouseNo', String(filters.warehouseNo));
    if (filters.productNo) params = params.set('productNo', String(filters.productNo));
    if (filters.status) params = params.set('status', filters.status);
    if (filters.nearDays) params = params.set('nearDays', String(filters.nearDays));
    return this.http.get<ApiResponse<BatchExpiryRow[]>>(`${this.baseUrl}/batches`, { params });
  }
}

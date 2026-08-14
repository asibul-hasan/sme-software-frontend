import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface Option { value: number; label: string; }

export interface ICountLine {
  count_dtl_no: number;
  line_no: number;
  product_no: number;
  product_name?: string | null;
  variant_no?: number | null;
  batch_no?: number | null;
  batch_code?: string | null;
  /** What the system held when the sheet opened — not editable. */
  system_qty: number;
  counted_qty: number;
  variance_qty: number;
  unit_cost: number;
  variance_value: number;
  remarks?: string | null;
}

export interface ICount {
  count_no: number;
  count_id: string;
  count_date: string;
  warehouse_no: number;
  warehouse_name?: string | null;
  count_type: number;
  status: number;
  freeze_stock: number;
  variance_adjustment_no?: number | null;
  remarks?: string | null;
  line_count: number;
  variance_line_count: number;
  variance_value_total: number;
  lines: ICountLine[];
}

@Injectable()
export class Inv2006DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get base() { return `${this.config.apiUrl}/inv/forms/inv2006`; }

  warehouseOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.base}/warehouse-options`);
  }

  list(): Observable<ApiResponse<ICount[]>> {
    return this.http.get<ApiResponse<ICount[]>>(`${this.base}/counts`);
  }

  detail(no: number): Observable<ApiResponse<ICount>> {
    return this.http.get<ApiResponse<ICount>>(`${this.base}/counts/${no}`);
  }

  start(body: {
    warehouse_no: number;
    count_date: string;
    count_type: number;
    freeze_stock: number;
    product_nos: number[];
    remarks?: string | null;
  }): Observable<ApiResponse<ICount>> {
    return this.http.post<ApiResponse<ICount>>(`${this.base}/counts/start`, body);
  }

  saveCounts(no: number, lines: ICountLine[]): Observable<ApiResponse<ICount>> {
    return this.http.put<ApiResponse<ICount>>(`${this.base}/counts/${no}/lines`, lines);
  }

  post(no: number): Observable<ApiResponse<ICount>> {
    return this.http.post<ApiResponse<ICount>>(`${this.base}/counts/${no}/post`, {});
  }

  cancel(no: number): Observable<ApiResponse<ICount>> {
    return this.http.post<ApiResponse<ICount>>(`${this.base}/counts/${no}/cancel`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface PurOption { no: number; name: string; }
export interface PurLookups { suppliers: PurOption[]; warehouses: PurOption[]; products: PurOption[]; uoms: PurOption[]; }

export interface ReturnLine {
  return_dtl_no?: number;
  product_no: number | null;
  product_name?: string;
  uom_no: number | null;
  uom_name?: string;
  qty: number;
  unit_cost: number;
  tax_rate_pct?: number;
  tax_amount?: number;
  line_total?: number;
  batch_code?: string | null;
  remarks?: string | null;
}

export interface PurReturn {
  return_no?: number;
  return_id?: string;
  return_date: string;
  supplier_no: number | null;
  supplier_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  return_reason?: number | null;
  settlement_mode?: number | null;
  status?: number;
  sub_total?: number;
  tax_amount?: number;
  grand_total?: number;
  remarks?: string | null;
  lines: ReturnLine[];
}

const BASE = 'forms/pur1103';

/** Form-level HTTP service for PUR_1103 – Purchase Return. */
@Injectable()
export class Pur1103DataService {
  private pur = inject(PurDataService);

  lookups(): Observable<ApiResponse<PurLookups>> { return this.pur.getList<PurLookups>(`${BASE}/lookups`); }
  list(): Observable<ApiResponse<PurReturn[]>> { return this.pur.getList<PurReturn[]>(`${BASE}/returns`); }
  detail(no: number): Observable<ApiResponse<PurReturn>> { return this.pur.getList<PurReturn>(`${BASE}/returns/${no}`); }
  create(payload: PurReturn): Observable<ApiResponse<PurReturn>> { return this.pur.insert<PurReturn>(`${BASE}/returns`, payload); }
  cancel(no: number, reason: string): Observable<ApiResponse<PurReturn>> { return this.pur.insert<PurReturn>(`${BASE}/returns/${no}/cancel`, { reason }); }
}

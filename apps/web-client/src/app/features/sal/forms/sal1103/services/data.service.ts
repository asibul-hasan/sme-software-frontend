import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SalOption { no: number; name: string; }
export interface SalLookups { customers: SalOption[]; warehouses: SalOption[]; products: SalOption[]; uoms: SalOption[]; }

export interface ReturnLine {
  return_dtl_no?: number;
  product_no: number | null;
  product_name?: string;
  uom_no: number | null;
  uom_name?: string;
  qty: number;
  net_unit_price: number;
  unit_cost: number;
  tax_rate_pct?: number;
  tax_amount?: number;
  line_total?: number;
  restock_flag?: number;
  batch_code?: string | null;
  remarks?: string | null;
}

export interface SalReturn {
  return_no?: number;
  return_id?: string;
  return_date: string;
  customer_no: number | null;
  customer_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  return_reason?: number | null;
  refund_method?: number | null;
  status?: number;
  sub_total?: number;
  tax_amount?: number;
  grand_total?: number;
  total_cost?: number;
  remarks?: string | null;
  lines: ReturnLine[];
}

const BASE = 'forms/sal1103';

/** Form-level HTTP service for SAL_1103 – Sales Return. */
@Injectable()
export class Sal1103DataService {
  private sal = inject(SalDataService);

  lookups(): Observable<ApiResponse<SalLookups>> { return this.sal.getList<SalLookups>(`${BASE}/lookups`); }
  list(): Observable<ApiResponse<SalReturn[]>> { return this.sal.getList<SalReturn[]>(`${BASE}/returns`); }
  detail(no: number): Observable<ApiResponse<SalReturn>> { return this.sal.getList<SalReturn>(`${BASE}/returns/${no}`); }
  create(payload: SalReturn): Observable<ApiResponse<SalReturn>> { return this.sal.insert<SalReturn>(`${BASE}/returns`, payload); }
  cancel(no: number, reason: string): Observable<ApiResponse<SalReturn>> { return this.sal.insert<SalReturn>(`${BASE}/returns/${no}/cancel`, { reason }); }
}

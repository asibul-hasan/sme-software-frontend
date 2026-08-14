import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SalOption { no: number; name: string; }
export interface SalLookups { customers: SalOption[]; warehouses: SalOption[]; products: SalOption[]; uoms: SalOption[]; }

export interface SaleLine {
  invoice_dtl_no?: number;
  line_no?: number;
  product_no: number | null;
  product_name?: string;
  uom_no: number | null;
  uom_name?: string;
  qty: number;
  unit_price: number;
  line_discount_pct?: number;
  tax_rate_pct?: number;
  taxable_amount?: number;
  tax_amount?: number;
  line_total?: number;
  unit_cost?: number;
  batch_code?: string | null;
  remarks?: string | null;
}

export interface Sale {
  invoice_no?: number;
  invoice_id?: string;
  invoice_date: string;
  sale_type: number | null;
  customer_no: number | null;
  customer_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  status?: number;
  sub_total?: number;
  taxable_amount?: number;
  tax_amount?: number;
  shipping_charge?: number;
  round_off?: number;
  grand_total?: number;
  paid_amount?: number;
  due_amount?: number;
  total_cost?: number;
  due_date?: string | null;
  remarks?: string | null;
  gl_voucher_no?: string | null;
  lines: SaleLine[];
}

const BASE = 'forms/sal1001';

/** Form-level HTTP service for SAL_1001 – Sales Invoice. */
@Injectable()
export class Sal1001DataService {
  private sal = inject(SalDataService);

  lookups(): Observable<ApiResponse<SalLookups>> { return this.sal.getList<SalLookups>(`${BASE}/lookups`); }
  list(): Observable<ApiResponse<Sale[]>> { return this.sal.getList<Sale[]>(`${BASE}/invoices`); }
  detail(no: number): Observable<ApiResponse<Sale>> { return this.sal.getList<Sale>(`${BASE}/invoices/${no}`); }
  save(payload: Sale): Observable<ApiResponse<Sale>> { return this.sal.insert<Sale>(`${BASE}/invoices`, payload); }
  update(no: number, payload: Sale): Observable<ApiResponse<Sale>> { return this.sal.update<Sale>(`${BASE}/invoices`, no, payload); }
  submit(no: number): Observable<ApiResponse<Sale>> { return this.sal.insert<Sale>(`${BASE}/invoices/${no}/submit`, {}); }
  cancel(no: number, reason: string): Observable<ApiResponse<Sale>> { return this.sal.insert<Sale>(`${BASE}/invoices/${no}/cancel`, { reason }); }
  remove(no: number): Observable<ApiResponse<void>> { return this.sal.delete<void>(`${BASE}/invoices`, no); }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface PurOption { no: number; name: string; }
export interface PurLookups { suppliers: PurOption[]; warehouses: PurOption[]; products: PurOption[]; uoms: PurOption[]; }

export interface InvoiceLine {
  invoice_dtl_no?: number;
  line_no?: number;
  product_no: number | null;
  product_name?: string;
  uom_no: number | null;
  uom_name?: string;
  qty: number;
  qty_base?: number;
  unit_price: number;
  discount_pct?: number;
  discount_amount?: number;
  tax_rate_pct?: number;
  taxable_amount?: number;
  tax_amount?: number;
  line_total?: number;
  final_unit_cost?: number;
  batch_code?: string | null;
  remarks?: string | null;
}

export interface Invoice {
  invoice_no?: number;
  invoice_id?: string;
  supplier_invoice_no: string;
  invoice_date: string;
  supplier_no: number | null;
  supplier_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  status?: number;
  sub_total?: number;
  discount_total?: number;
  taxable_amount?: number;
  tax_amount?: number;
  shipping_charge?: number;
  other_charges?: number;
  round_off?: number;
  grand_total?: number;
  paid_amount?: number;
  due_amount?: number;
  due_date?: string | null;
  remarks?: string | null;
  lines: InvoiceLine[];
}

const BASE = 'forms/pur1102';

/** Form-level HTTP service for PUR_1102 – Purchase Invoice. */
@Injectable()
export class Pur1102DataService {
  private pur = inject(PurDataService);

  lookups(): Observable<ApiResponse<PurLookups>> { return this.pur.getList<PurLookups>(`${BASE}/lookups`); }
  list(): Observable<ApiResponse<Invoice[]>> { return this.pur.getList<Invoice[]>(`${BASE}/invoices`); }
  detail(no: number): Observable<ApiResponse<Invoice>> { return this.pur.getList<Invoice>(`${BASE}/invoices/${no}`); }
  save(payload: Invoice): Observable<ApiResponse<Invoice>> { return this.pur.insert<Invoice>(`${BASE}/invoices`, payload); }
  update(no: number, payload: Invoice): Observable<ApiResponse<Invoice>> { return this.pur.update<Invoice>(`${BASE}/invoices`, no, payload); }
  submit(no: number): Observable<ApiResponse<Invoice>> { return this.pur.insert<Invoice>(`${BASE}/invoices/${no}/submit`, {}); }
  reject(no: number): Observable<ApiResponse<Invoice>> { return this.pur.insert<Invoice>(`${BASE}/invoices/${no}/reject`, {}); }
  cancel(no: number, reason: string): Observable<ApiResponse<Invoice>> { return this.pur.insert<Invoice>(`${BASE}/invoices/${no}/cancel`, { reason }); }
  remove(no: number): Observable<ApiResponse<void>> { return this.pur.delete<void>(`${BASE}/invoices`, no); }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface OrderLine {
  order_dtl_no?: number;
  product_no: number | null;
  product_name?: string;
  uom_no: number | null;
  uom_name?: string;
  order_qty: number;
  received_qty_base?: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate_pct?: number;
  tax_amount?: number;
  line_total?: number;
  remarks?: string | null;
}

export interface PurchaseOrder {
  order_no?: number;
  order_id?: string;
  order_date: string;
  supplier_no: number | null;
  supplier_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  expected_date?: string | null;
  status?: number;
  sub_total?: number;
  discount_total?: number;
  tax_amount?: number;
  shipping_estimate?: number;
  grand_total?: number;
  received_value?: number;
  terms_note?: string | null;
  remarks?: string | null;
  lines: OrderLine[];
}

const BASE = 'forms/pur1101';

/** Form-level HTTP service for PUR_1101 – Purchase Order. */
@Injectable()
export class Pur1101DataService {
  private pur = inject(PurDataService);

  list(): Observable<ApiResponse<PurchaseOrder[]>> { return this.pur.getList<PurchaseOrder[]>(`${BASE}/orders`); }
  detail(no: number): Observable<ApiResponse<PurchaseOrder>> { return this.pur.getList<PurchaseOrder>(`${BASE}/orders/${no}`); }
  save(payload: PurchaseOrder): Observable<ApiResponse<PurchaseOrder>> { return this.pur.insert<PurchaseOrder>(`${BASE}/orders`, payload); }
  update(no: number, payload: PurchaseOrder): Observable<ApiResponse<PurchaseOrder>> { return this.pur.update<PurchaseOrder>(`${BASE}/orders`, no, payload); }
  submit(no: number): Observable<ApiResponse<PurchaseOrder>> { return this.pur.insert<PurchaseOrder>(`${BASE}/orders/${no}/submit`, {}); }
  cancel(no: number, reason: string): Observable<ApiResponse<PurchaseOrder>> { return this.pur.insert<PurchaseOrder>(`${BASE}/orders/${no}/cancel`, { reason }); }
  remove(no: number): Observable<ApiResponse<void>> { return this.pur.delete<void>(`${BASE}/orders`, no); }
}

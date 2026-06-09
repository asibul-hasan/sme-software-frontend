import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface ReceiptLine {
  receipt_dtl_no?: number;
  line_no?: number;
  order_dtl_no?: number | null;
  product_no: number | null;
  product_name?: string;
  variant_no?: number | null;
  uom_no: number | null;
  uom_name?: string;
  qty: number;
  qty_base?: number;
  unit_cost: number;
  tax_rate_pct?: number;
  tax_amount?: number;
  line_total?: number;
  batch_no?: number | null;
  batch_code?: string | null;
  mfg_date?: string | null;
  expiry_date?: string | null;
  remarks?: string | null;
}

export interface Receipt {
  receipt_no?: number;
  receipt_id?: string;
  receipt_date: string;
  supplier_no: number | null;
  supplier_name?: string;
  warehouse_no: number | null;
  warehouse_name?: string;
  order_no?: number | null;
  order_id?: string | null;
  status?: number;
  sub_total?: number;
  tax_amount?: number;
  grand_total?: number;
  remarks?: string | null;
  cancel_reason?: string | null;
  lines: ReceiptLine[];
}

const BASE = 'forms/pur1105';

/** Form-level HTTP service for PUR_1105 - Goods Receipt Note. */
@Injectable()
export class Pur1105DataService {
  private pur = inject(PurDataService);

  list(): Observable<ApiResponse<Receipt[]>> { return this.pur.getList<Receipt[]>(`${BASE}/receipts`); }
  detail(no: number): Observable<ApiResponse<Receipt>> { return this.pur.getList<Receipt>(`${BASE}/receipts/${no}`); }
  save(payload: Receipt): Observable<ApiResponse<Receipt>> { return this.pur.insert<Receipt>(`${BASE}/receipts`, payload); }
  update(no: number, payload: Receipt): Observable<ApiResponse<Receipt>> { return this.pur.update<Receipt>(`${BASE}/receipts`, no, payload); }
  post(no: number): Observable<ApiResponse<Receipt>> { return this.pur.insert<Receipt>(`${BASE}/receipts/${no}/post`, {}); }
  cancel(no: number, reason: string): Observable<ApiResponse<Receipt>> { return this.pur.insert<Receipt>(`${BASE}/receipts/${no}/cancel`, { reason }); }
  remove(no: number): Observable<ApiResponse<void>> { return this.pur.delete<void>(`${BASE}/receipts`, no); }
}

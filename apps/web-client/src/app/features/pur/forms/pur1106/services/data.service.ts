import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface LandedCostAlloc {
  landed_cost_alloc_no?: number;
  invoice_dtl_no: number;
  line_no?: number;
  product_no?: number;
  product_name?: string;
  qty_base?: number;
  taxable_amount?: number;
  previous_alloc?: number;
  allocated_amount?: number;
  final_unit_cost?: number;
}

export interface LandedCost {
  landed_cost_no?: number;
  landed_cost_id?: string;
  cost_date: string;
  invoice_no: number | null;
  invoice_id?: string;
  supplier_name?: string;
  receipt_no?: number | null;
  cost_type?: number;
  vendor_no?: number | null;
  amount: number;
  alloc_basis?: number;
  status?: number;
  remarks?: string | null;
  invoice_landed_cost_total?: number;
  allocations?: LandedCostAlloc[];
}

const BASE = 'forms/pur1106';

/** Form-level HTTP service for PUR_1106 - Landed Cost. */
@Injectable()
export class Pur1106DataService {
  private pur = inject(PurDataService);

  list(): Observable<ApiResponse<LandedCost[]>> { return this.pur.getList<LandedCost[]>(`${BASE}/landed-costs`); }
  detail(no: number): Observable<ApiResponse<LandedCost>> { return this.pur.getList<LandedCost>(`${BASE}/landed-costs/${no}`); }
  postedInvoices(): Observable<ApiResponse<LandedCost[]>> { return this.pur.getList<LandedCost[]>(`${BASE}/posted-invoices`); }
  preview(invoiceNo: number, amount: number, basis: number): Observable<ApiResponse<LandedCostAlloc[]>> {
    return this.pur.getList<LandedCostAlloc[]>(`${BASE}/invoices/${invoiceNo}/preview`, { amount, basis });
  }
  save(payload: LandedCost): Observable<ApiResponse<LandedCost>> { return this.pur.insert<LandedCost>(`${BASE}/landed-costs`, payload); }
  update(no: number, payload: LandedCost): Observable<ApiResponse<LandedCost>> { return this.pur.update<LandedCost>(`${BASE}/landed-costs`, no, payload); }
  apply(no: number): Observable<ApiResponse<LandedCost>> { return this.pur.insert<LandedCost>(`${BASE}/landed-costs/${no}/apply`, {}); }
  remove(no: number): Observable<ApiResponse<void>> { return this.pur.delete<void>(`${BASE}/landed-costs`, no); }
}

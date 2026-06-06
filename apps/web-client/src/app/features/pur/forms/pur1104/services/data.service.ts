import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface PurOption { no: number; name: string; }

export interface OpenInvoice {
  invoice_no: number;
  invoice_id: string;
  supplier_invoice_no: string;
  invoice_date: string;
  grand_total: number;
  due_amount: number;
}

export interface Alloc {
  payment_alloc_no?: number;
  invoice_no: number | null;
  invoice_id?: string;
  invoice_date?: string;
  invoice_due?: number;
  allocated_amount: number;
}

export interface Payment {
  payment_no?: number;
  payment_id?: string;
  payment_date: string;
  supplier_no: number | null;
  supplier_name?: string;
  payment_method: number | null;
  amount: number;
  allocated_amount?: number;
  unallocated_amount?: number;
  cheque_no?: string | null;
  cheque_date?: string | null;
  txn_ref?: string | null;
  status?: number;
  remarks?: string | null;
  allocations: Alloc[];
}

const BASE = 'forms/pur1104';

/** Form-level HTTP service for PUR_1104 – Supplier Payment. */
@Injectable()
export class Pur1104DataService {
  private pur = inject(PurDataService);

  suppliers(): Observable<ApiResponse<PurOption[]>> { return this.pur.getList<PurOption[]>(`${BASE}/suppliers`); }
  openInvoices(supplierNo: number): Observable<ApiResponse<OpenInvoice[]>> { return this.pur.getList<OpenInvoice[]>(`${BASE}/open-invoices`, { supplierNo }); }
  list(): Observable<ApiResponse<Payment[]>> { return this.pur.getList<Payment[]>(`${BASE}/payments`); }
  detail(no: number): Observable<ApiResponse<Payment>> { return this.pur.getList<Payment>(`${BASE}/payments/${no}`); }
  create(payload: Payment): Observable<ApiResponse<Payment>> { return this.pur.insert<Payment>(`${BASE}/payments`, payload); }
  cancel(no: number, reason: string): Observable<ApiResponse<Payment>> { return this.pur.insert<Payment>(`${BASE}/payments/${no}/cancel`, { reason }); }
}

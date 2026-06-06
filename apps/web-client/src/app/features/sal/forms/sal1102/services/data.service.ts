import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SalOption { no: number; name: string; }

export interface OpenInvoice {
  invoice_no: number;
  invoice_id: string;
  invoice_date: string;
  grand_total: number;
  due_amount: number;
}

export interface Alloc {
  receipt_alloc_no?: number;
  invoice_no: number | null;
  invoice_id?: string;
  invoice_date?: string;
  invoice_due?: number;
  allocated_amount: number;
}

export interface Receipt {
  receipt_no?: number;
  receipt_id?: string;
  receipt_date: string;
  customer_no: number | null;
  customer_name?: string;
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

const BASE = 'forms/sal1102';

/** Form-level HTTP service for SAL_1102 – Customer Receipt. */
@Injectable()
export class Sal1102DataService {
  private sal = inject(SalDataService);

  customers(): Observable<ApiResponse<SalOption[]>> { return this.sal.getList<SalOption[]>(`${BASE}/customers`); }
  openInvoices(customerNo: number): Observable<ApiResponse<OpenInvoice[]>> { return this.sal.getList<OpenInvoice[]>(`${BASE}/open-invoices`, { customerNo }); }
  list(): Observable<ApiResponse<Receipt[]>> { return this.sal.getList<Receipt[]>(`${BASE}/receipts`); }
  detail(no: number): Observable<ApiResponse<Receipt>> { return this.sal.getList<Receipt>(`${BASE}/receipts/${no}`); }
  create(payload: Receipt): Observable<ApiResponse<Receipt>> { return this.sal.insert<Receipt>(`${BASE}/receipts`, payload); }
  cancel(no: number, reason: string): Observable<ApiResponse<Receipt>> { return this.sal.insert<Receipt>(`${BASE}/receipts/${no}/cancel`, { reason }); }
}

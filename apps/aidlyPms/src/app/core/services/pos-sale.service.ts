import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SaleInvoice, SaleInvoiceItem, SaleInvoicePayment } from '../models/customer.models';

export interface CreateSalePayload {
  invoice: Partial<SaleInvoice>;
  items: Partial<SaleInvoiceItem>[];
  payments: Partial<SaleInvoicePayment>[];
}

export interface SaleReturnItem {
  product_no: number;
  return_qty: number;
  unit_price: number;
  total_price: number;
  batch_number?: string;
  sale_invoice_item_no?: number | null;
  disposition?: number;
}

export interface CreateSaleReturnPayload {
  original_invoice_no: string;
  sale_invoice_no?: number;
  customer_no: number;
  return_amount: number;
  cash_paid_refund?: number;
  discount_deduction?: number;
  discount_percent?: number;
  refund_method?: string;
  account_no?: number;
  reason?: string;
  items: SaleReturnItem[];
}

export interface SaleReturnRecord {
  return_no: number;
  return_invoice_no: string;
  original_invoice_no: string;
  customer_no: number;
  customer_name?: string;
  return_amount: number;
  return_date: string;
  reason?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class PosSaleService {
  private readonly api = inject(ApiService);

  createSale(payload: CreateSalePayload): Observable<ApiResponse<SaleInvoice>> {
    return this.api.post<SaleInvoice>('pos/sales', payload);
  }

  getSaleRecords(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<SaleInvoice>>> {
    return this.api.getPaged<SaleInvoice>('pos/sales', params);
  }

  getSale(invoiceNo: string): Observable<ApiResponse<SaleInvoice>> {
    return this.api.get<SaleInvoice>(`pos/sales/${invoiceNo}`);
  }

  createSaleReturn(payload: CreateSaleReturnPayload): Observable<ApiResponse<SaleReturnRecord>> {
    return this.api.post<SaleReturnRecord>('pos/sales/returns', payload);
  }

  getSaleReturns(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<SaleReturnRecord>>> {
    return this.api.getPaged<SaleReturnRecord>('pos/sales/returns', params);
  }

  voidSale(saleInvoiceNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`pos/sales/${saleInvoiceNo}`);
  }
}


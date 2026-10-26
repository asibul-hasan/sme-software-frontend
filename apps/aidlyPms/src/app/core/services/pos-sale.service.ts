import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { 
  SaleInvoice, 
  SaleInvoiceItem, 
  SaleInvoicePayment,
  SaleReturn,
  ReturnLineReq,
  ReturnReq,
  ExchangeReq,
  ExchangeResult
} from '../models/customer.models';

export interface CreateSalePayload {
  invoice: Partial<SaleInvoice>;
  items: Partial<SaleInvoiceItem>[];
  payments: Partial<SaleInvoicePayment>[];
}

export interface SaleReturnItem {
  product_no: number;
  return_qty: number;
  unit_price?: number;
  total_price?: number;
  batch_number?: string;
  sale_invoice_item_no?: number | null;
  disposition?: number;
  reason_code?: number;
}

export interface CreateSaleReturnPayload {
  sale_invoice_no?: number;
  lines?: ReturnLineReq[];
  refund_method?: number;
  idempotency_key?: string;
  note?: string;

  // Legacy field support
  original_invoice_no?: string;
  customer_no?: number;
  return_amount?: number;
  cash_paid_refund?: number;
  discount_deduction?: number;
  discount_percent?: number;
  account_no?: number;
  reason?: string;
  items?: SaleReturnItem[];
}

export type SaleReturnRecord = SaleReturn;

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

  createSaleReturn(payload: CreateSaleReturnPayload | ReturnReq): Observable<ApiResponse<SaleReturn>> {
    return this.api.post<SaleReturn>('pos/sales/returns', payload);
  }

  processExchange(payload: ExchangeReq): Observable<ApiResponse<ExchangeResult>> {
    return this.api.post<ExchangeResult>('pos/exchange', payload);
  }

  getSaleReturns(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<SaleReturn>>> {
    return this.api.getPaged<SaleReturn>('pos/sales/returns', params);
  }

  getSaleReturnById(id: number): Observable<ApiResponse<SaleReturn>> {
    return this.api.get<SaleReturn>(`pos/sales/returns/${id}`);
  }

  voidSale(
    saleInvoiceNo: number,
    payload?: { reason?: string; approval_note?: string; approved_by_user_no?: number }
  ): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>(`pos/sales/${saleInvoiceNo}/void`, payload ?? { reason: 'Counter void requested' });
  }
}


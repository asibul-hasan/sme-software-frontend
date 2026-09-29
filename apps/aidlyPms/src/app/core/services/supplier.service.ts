import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SuppSupplier, PurPurchaseInvoice, PurSupplierPayment, PurPurchaseReturn } from '../models/supplier.models';

export interface CreatePurchasePayload {
  invoice: Partial<PurPurchaseInvoice>;
  items: unknown[];
  batches: unknown[];
  payments: unknown[];
}

export interface SupplierPaymentPayload {
  supplier_no: number;
  payment_amount: number;
  account_no: number;
  payment_type: string;
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly api = inject(ApiService);

  // Suppliers
  getSuppliers(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<SuppSupplier>>> {
    return this.api.getPaged<SuppSupplier>('pur/suppliers', params);
  }

  getSupplier(supplierNo: number): Observable<ApiResponse<SuppSupplier>> {
    return this.api.get<SuppSupplier>(`pur/suppliers/${supplierNo}`);
  }

  searchSuppliers(query: string): Observable<ApiResponse<PagedResult<SuppSupplier>>> {
    return this.api.getPaged<SuppSupplier>('pur/suppliers', { search: query, pageSize: 50 });
  }

  createSupplier(supplier: Partial<SuppSupplier>): Observable<ApiResponse<SuppSupplier>> {
    return this.api.post<SuppSupplier>('pur/suppliers', supplier);
  }

  updateSupplier(supplierNo: number, supplier: Partial<SuppSupplier>): Observable<ApiResponse<SuppSupplier>> {
    return this.api.put<SuppSupplier>(`pur/suppliers/${supplierNo}`, supplier);
  }

  deleteSupplier(supplierNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`pur/suppliers/${supplierNo}`);
  }

  // Purchases
  createPurchaseInvoice(payload: CreatePurchasePayload): Observable<ApiResponse<PurPurchaseInvoice>> {
    return this.api.post<PurPurchaseInvoice>('pur/invoices', payload);
  }

  getPurchaseInvoices(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<PurPurchaseInvoice>>> {
    return this.api.getPaged<PurPurchaseInvoice>('pur/invoices', params);
  }

  getPurchases(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<PurPurchaseInvoice>>> {
    return this.getPurchaseInvoices(params);
  }

  getPurchaseInvoice(invoiceNo: number): Observable<ApiResponse<PurPurchaseInvoice>> {
    return this.api.get<PurPurchaseInvoice>(`pur/invoices/${invoiceNo}`);
  }

  // Returns
  createPurchaseReturn(payload: unknown): Observable<ApiResponse<PurPurchaseReturn>> {
    return this.api.post<PurPurchaseReturn>('pur/returns', payload);
  }

  getPurchaseReturns(params?: Record<string, unknown>): Observable<ApiResponse<PurPurchaseReturn[]>> {
    return this.api.get<PurPurchaseReturn[]>('pur/returns', params);
  }

  // Payments
  paySupplier(payload: SupplierPaymentPayload): Observable<ApiResponse<PurSupplierPayment>> {
    return this.api.post<PurSupplierPayment>('pur/payments', payload);
  }

  createSupplierPayment(payload: { supplier_no: number; amount: number; payment_method: number; note?: string; account_no?: number }): Observable<ApiResponse<PurSupplierPayment>> {
    return this.api.post<PurSupplierPayment>('pur/payments', payload);
  }

  getSupplierLedger(supplierNo: number): Observable<ApiResponse<any>> {
    return this.api.get<any>(`pur/suppliers/${supplierNo}/ledger`);
  }
}


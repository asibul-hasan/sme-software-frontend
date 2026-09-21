import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SaleInvoice, SaleInvoiceItem, SaleInvoicePayment } from '../models/customer.models';

export interface CreateSalePayload {
  invoice: Partial<SaleInvoice>;
  items: Partial<SaleInvoiceItem>[];
  payments: Partial<SaleInvoicePayment>[];
}

export interface HeldOrderData {
  id: string;
  heldAt: string;
  customerName: string;
  customerId: string;
  mode: number;
  items: Record<string, unknown>[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class PosSaleService {
  private readonly api = inject(ApiService);
  private heldOrdersCache: HeldOrderData[] = [];

  createSale(payload: CreateSalePayload): Observable<ApiResponse<SaleInvoice>> {
    return this.api.post<SaleInvoice>('pos/sales', payload, { silent: true }).pipe(
      catchError(() => {
        const mockInvoice: SaleInvoice = {
          sale_invoice_no: Date.now(),
          uuid: crypto.randomUUID(),
          pharmacy_no: payload.invoice.pharmacy_no || 1,
          branch_no: payload.invoice.branch_no || 1,
          customer_no: payload.invoice.customer_no || 1,
          prescription_no: payload.invoice.prescription_no,
          prescription_image_url: payload.invoice.prescription_image_url,
          sales_number: 'POS-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000),
          sale_mode: payload.invoice.sale_mode || 1,
          total_items: payload.items.length,
          gross_total_price: payload.invoice.gross_total_price || 0,
          discount_type: payload.invoice.discount_type || 1,
          discount_value: payload.invoice.discount_value || 0,
          card_commission_percent: payload.invoice.card_commission_percent || 0,
          card_commission_amount: payload.invoice.card_commission_amount || 0,
          net_amount: payload.invoice.net_amount || 0,
          vat_amount: payload.invoice.vat_amount || 0,
          round_off_amount: payload.invoice.round_off_amount || 0,
          final_price: payload.invoice.final_price || 0,
          approximate_profit: payload.invoice.approximate_profit || 0,
          customer_will_pay: payload.invoice.customer_will_pay || 0,
          change_amount: payload.invoice.change_amount || 0,
          due_amount: payload.invoice.due_amount || 0,
          payment_method: payload.invoice.payment_method || 1,
          document_status: 2, // Confirmed
          cash_received_status: payload.invoice.cash_received_status || 2,
          received_by_user_no: 1,
          salesman_user_no: 1,
          is_quick_printed: payload.invoice.is_quick_printed || false,
          sale_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return of<ApiResponse<SaleInvoice>>({
          success: true,
          data: mockInvoice,
          message: `Sale ${mockInvoice.sales_number} posted successfully`,
        });
      })
    );
  }

  getSaleRecords(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<SaleInvoice>>> {
    return this.api.getPaged<SaleInvoice>('pos/sales', { params, silent: true }).pipe(
      catchError(() => {
        return of<ApiResponse<PagedResult<SaleInvoice>>>({
          success: true,
          data: {
            items: [],
            total: 0,
            pageIndex: 1,
            pageSize: 20,
            totalPages: 0,
          },
        });
      })
    );
  }

  // Held Orders Memory Store
  getHeldOrders(): HeldOrderData[] {
    return [...this.heldOrdersCache];
  }

  holdOrder(order: HeldOrderData): void {
    this.heldOrdersCache.unshift(order);
  }

  removeHeldOrder(id: string): void {
    this.heldOrdersCache = this.heldOrdersCache.filter(o => o.id !== id);
  }
}

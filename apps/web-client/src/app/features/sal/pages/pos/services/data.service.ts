import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

// ── contracts (mirror the .NET DTOs) ────────────────────────────────────────

export interface PosOption { no: number; name: string; }

export interface PosTerminal {
  terminal_no: number;
  terminal_id: string;
  terminal_name: string;
  warehouse_no: number;
  warehouse_name?: string | null;
  receipt_prefix?: string | null;
}

export interface PosSession {
  session_no: number;
  session_id: string;
  terminal_no: number;
  terminal_name?: string | null;
  warehouse_no: number;
  cashier_user_no: number;
  opened_at: string;
  opening_float: number;
  status: number;
}

export interface BarcodeHit {
  barcode: string;
  product_no: number;
  product_id?: string | null;
  product_name?: string | null;
  variant_no?: number | null;
  variant_name?: string | null;
  uom_no?: number | null;
  /** A carton barcode resolves to its pack size, so one scan adds the whole pack. */
  pack_qty: number;
  unit_price: number;
}

export interface PriceLineRequest {
  product_no: number;
  variant_no?: number | null;
  uom_no?: number | null;
  qty: number;
  unit_price?: number | null;
  line_discount_type?: number;
  line_discount_value?: number;
  remarks?: string | null;
}

export interface PricedLine {
  product_no: number;
  product_name?: string | null;
  variant_no?: number | null;
  uom_no: number;
  qty: number;
  qty_base: number;
  unit_price: number;
  mrp?: number | null;
  line_discount_amount: number;
  bill_discount_share: number;
  tax_rate_pct: number;
  taxable_amount: number;
  tax_amount: number;
  line_total: number;
}

export interface QuoteResult {
  sub_total: number;
  line_discount_total: number;
  bill_discount_amount: number;
  taxable_amount: number;
  tax_amount: number;
  shipping_charge: number;
  round_off: number;
  grand_total: number;
  lines: PricedLine[];
}

export interface Tender {
  payment_method: number;
  amount: number;
  tendered_amount?: number | null;
  card_last4?: string | null;
  mobile_provider?: string | null;
  txn_ref?: string | null;
  remarks?: string | null;
}

export interface SaleResult {
  invoice_no: number;
  invoice_id: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  change_amount?: number;
}

/**
 * HTTP gateway for the till. Everything monetary is round-tripped through the
 * server — this service never computes a total.
 */
@Injectable()
export class PosDataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get sal() { return `${this.config.apiUrl}/sal/forms/sal1001`; }
  private get terminals() { return `${this.config.apiUrl}/sal/forms/sal1005`; }
  private get inv() { return `${this.config.apiUrl}/inv/forms/inv1001`; }
  private get customers() { return `${this.config.apiUrl}/sal/forms/sal1102`; }

  // ── setup ─────────────────────────────────────────────────────────────────

  getTerminals(): Observable<ApiResponse<PosTerminal[]>> {
    return this.http.get<ApiResponse<PosTerminal[]>>(`${this.terminals}/terminals`);
  }

  getCustomers(): Observable<ApiResponse<PosOption[]>> {
    return this.http.get<ApiResponse<PosOption[]>>(`${this.customers}/customers`);
  }

  // ── session ───────────────────────────────────────────────────────────────

  currentSession(terminalNo: number): Observable<ApiResponse<PosSession | null>> {
    const params = new HttpParams().set('terminalNo', String(terminalNo));
    return this.http.get<ApiResponse<PosSession | null>>(`${this.sal}/sessions/current`, { params });
  }

  openSession(terminalNo: number, openingFloat: number): Observable<ApiResponse<PosSession>> {
    return this.http.post<ApiResponse<PosSession>>(`${this.sal}/sessions/open`, {
      terminal_no: terminalNo,
      opening_float: openingFloat,
    });
  }

  // ── selling ───────────────────────────────────────────────────────────────

  resolveBarcode(barcode: string): Observable<ApiResponse<BarcodeHit>> {
    const params = new HttpParams().set('barcode', barcode);
    return this.http.get<ApiResponse<BarcodeHit>>(`${this.inv}/resolve-barcode`, { params });
  }

  quotePrice(body: {
    customer_no: number | null;
    bill_discount_type: number;
    bill_discount_value: number;
    shipping_charge: number;
    allow_below_min_price: boolean;
    lines: PriceLineRequest[];
  }): Observable<ApiResponse<QuoteResult>> {
    return this.http.post<ApiResponse<QuoteResult>>(`${this.sal}/sales/quote-price`, body);
  }

  confirmSale(body: {
    client_uuid: string;
    terminal_no: number;
    customer_no: number;
    bill_discount_type: number;
    bill_discount_value: number;
    shipping_charge: number;
    allow_below_min_price: boolean;
    remarks?: string | null;
    lines: PriceLineRequest[];
    tenders: Tender[];
  }): Observable<ApiResponse<SaleResult>> {
    return this.http.post<ApiResponse<SaleResult>>(`${this.sal}/sales`, body);
  }
}

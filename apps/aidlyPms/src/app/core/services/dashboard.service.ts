import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/common.models';

export interface DashboardSummary {
  today_sales: number;
  today_sales_count: number;
  today_profit: number;
  today_purchases: number;
  today_expenses: number;
  today_cash_collected: number;
  total_customer_due: number;
  total_supplier_payable: number;
  total_inventory_valuation: number;
  total_products_count: number;
  low_stock_items_count: number;
  expired_items_count: number;
  near_expiry_items_count: number;
}

export interface FastMovingProduct {
  product_no: number;
  product_name: string;
  total_sold_pcs: number;
  total_revenue: number;
}

export interface CashbookEntry {
  entry_date: string;
  doc_type: string;
  doc_no: string;
  description?: string;
  cash_in: number;
  cash_out: number;
  balance: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.api.get<DashboardSummary>('dashboard/summary');
  }

  getAnalytics(limit = 10): Observable<ApiResponse<FastMovingProduct[]>> {
    return this.api.get<FastMovingProduct[]>('dashboard/analytics', { limit });
  }

  getCashbook(date?: string): Observable<ApiResponse<CashbookEntry[]>> {
    const params: Record<string, unknown> = {};
    if (date) params['date'] = date;
    return this.api.get<CashbookEntry[]>('dashboard/cashbook', params);
  }
}

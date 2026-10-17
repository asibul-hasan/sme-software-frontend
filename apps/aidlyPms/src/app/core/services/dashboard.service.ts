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
  total_bank_balance?: number;
  total_mfs_balance?: number;
  total_cash_balance?: number;
  today_incomes?: number;
  today_demurrage?: number;
  pending_handover_count?: number;
  pending_handover_amount?: number;
  today_sale_returns?: number;
  today_purchase_returns?: number;
  today_due_collected?: number;
  today_supplier_paid?: number;
}

export interface FastMovingProduct {
  product_no: number;
  product_name: string;
  generic_name?: string;
  total_sold_pcs: number;
  total_revenue: number;
  total_profit?: number;
  profit_margin_pct?: number;
}

export interface CashbookEntry {
  entry_date: string;
  doc_type: string;
  doc_no: string;
  description?: string;
  cash_in: number;
  cash_out: number;
  balance: number;
  account_no?: number;
  account_name?: string;
  account_type?: number;
}

export interface DailySalesTrend {
  date_label: string;
  date_val: string;
  buy_price: number;
  gross_profit: number;
  total_sale: number;
  op_cost: number;
  net_profit: number;
}

export interface FinancialReportSummary {
  from_date: string;
  to_date: string;
  total_sales: number;
  total_sales_count: number;
  total_profit: number;
  total_purchases: number;
  total_expenses: number;
  total_incomes: number;
  cash_collected: number;
  due_collected: number;
  supplier_paid: number;
  sale_returns: number;
  purchase_returns: number;
  net_profit: number;
  net_cash_flow: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.api.get<DashboardSummary>('dashboard/summary');
  }

  getAnalytics(
    paramsOrLimit?: number | { fromDate?: string; toDate?: string; limit?: number; sort?: string; sortBy?: string },
    sort = 'desc'
  ): Observable<ApiResponse<FastMovingProduct[]>> {
    let params: Record<string, unknown> = {};
    if (typeof paramsOrLimit === 'number') {
      params = { limit: paramsOrLimit, sort };
    } else if (paramsOrLimit) {
      params = { ...paramsOrLimit };
    }
    return this.api.get<FastMovingProduct[]>('dashboard/analytics', params);
  }

  getCashbook(
    dateOrParams?: string | { date?: string; fromDate?: string; toDate?: string; accountNo?: number; accountType?: number }
  ): Observable<ApiResponse<CashbookEntry[]>> {
    let params: Record<string, unknown> = {};
    if (typeof dateOrParams === 'string') {
      params = { date: dateOrParams };
    } else if (dateOrParams) {
      params = { ...dateOrParams };
    }
    return this.api.get<CashbookEntry[]>('dashboard/cashbook', params);
  }

  getTrends(params?: { fromDate?: string; toDate?: string }): Observable<ApiResponse<DailySalesTrend[]>> {
    return this.api.get<DailySalesTrend[]>('dashboard/trends', params as Record<string, unknown>);
  }

  getReportSummary(params?: { fromDate?: string; toDate?: string }): Observable<ApiResponse<FinancialReportSummary>> {
    return this.api.get<FinancialReportSummary>('dashboard/report-summary', params as Record<string, unknown>);
  }

  getBranches(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('sys/branches');
  }
}

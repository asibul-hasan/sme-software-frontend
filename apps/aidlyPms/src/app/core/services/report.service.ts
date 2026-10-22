import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';

export interface ExpiryBatchItem {
  product_no: number;
  product_name: string;
  generic_name?: string;
  company_name?: string;
  batch_no: number;
  batch_number: string;
  expiry_date: string;
  days_until_expiry: number;
  quantity_pcs: number;
  unit_cost_price: number;
  unit_sale_price: number;
  total_cost_value: number;
  total_mrp_value: number;
  rak_number?: string;
  bucket: string;
}

export interface ExpiryBucketSummary {
  expired_count: number;
  expired_cost_value: number;
  critical_30_count: number;
  critical_30_cost_value: number;
  moderate_60_count: number;
  moderate_60_cost_value: number;
  approaching_90_count: number;
  approaching_90_cost_value: number;
  total_at_risk_count: number;
  total_at_risk_cost_value: number;
}

export interface ExpiryBucketReport {
  summary: ExpiryBucketSummary;
  items: ExpiryBatchItem[];
}

export interface AbcFsnItem {
  product_no: number;
  product_name: string;
  generic_name?: string;
  company_name?: string;
  current_stock_pcs: number;
  units_sold: number;
  total_revenue: number;
  cumulative_revenue_percent: number;
  abc_classification: string;
  movement_frequency: number;
  fsn_velocity: string;
  turnover_rate: number;
}

export interface ProductMarginItem {
  product_no: number;
  product_name: string;
  generic_name?: string;
  company_name?: string;
  trade_price_cost: number;
  mrp_sale_price: number;
  profit_per_unit: number;
  margin_percent: number;
  total_units_sold: number;
  total_realized_profit: number;
}

export interface DailyReturnItem {
  sale_return_no: number;
  return_number: string;
  sale_invoice_no: number;
  sales_number: string;
  customer_name: string;
  return_date: string;
  total_items: number;
  final_refund_price: number;
  cash_paid_refund: number;
  refund_method: number;
  return_status: number;
  exchange_invoice_no?: number;
  exchange_sales_number?: string;
  created_by_user_name?: string;
}

export interface DailyReturnsReport {
  date: string;
  total_returns_count: number;
  total_refund_amount: number;
  total_cash_refund: number;
  items: DailyReturnItem[];
}

export interface AuditLogItem {
  audit_no: number;
  pharmacy_no: number;
  branch_no: number;
  user_no?: number;
  user_name?: string;
  table_name: string;
  record_id: number;
  action: string;
  old_data?: string;
  new_data?: string;
  ip_address?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly api = inject(ApiService);

  getExpiryBuckets(): Observable<ApiResponse<ExpiryBucketReport>> {
    return this.api.get<ExpiryBucketReport>('reports/expiry-buckets');
  }

  getAbcFsn(days = 90): Observable<ApiResponse<AbcFsnItem[]>> {
    return this.api.get<AbcFsnItem[]>('reports/abc-fsn', { days });
  }

  getMarginAnalysis(): Observable<ApiResponse<ProductMarginItem[]>> {
    return this.api.get<ProductMarginItem[]>('reports/margin-analysis');
  }

  getDailyReturns(date?: string): Observable<ApiResponse<DailyReturnsReport>> {
    const params: Record<string, unknown> = {};
    if (date) params['date'] = date;
    return this.api.get<DailyReturnsReport>('reports/daily-returns', params);
  }

  getAuditLogs(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<AuditLogItem>>> {
    return this.api.getPaged<AuditLogItem>('audit/logs', params);
  }
}

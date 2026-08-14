import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface DailySales {
  sale_date: string;
  invoice_count: number;
  gross_sales: number;
  discount_total: number;
  tax_amount: number;
  net_sales: number;
  cost_total: number;
  margin: number;
  margin_pct: number;
  paid_total: number;
  due_total: number;
  average_basket: number;
}

export interface ProductSales {
  product_no: number;
  product_name?: string | null;
  qty_sold: number;
  net_sales: number;
  cost_total: number;
  margin: number;
  margin_pct: number;
}

export interface CashierSales {
  cashier_user_no: number;
  cashier_name?: string | null;
  invoice_count: number;
  net_sales: number;
  average_basket: number;
  variance_total: number;
}

export interface HourlySales {
  hour: number;
  invoice_count: number;
  net_sales: number;
}

export interface SalesReport {
  from_date: string;
  to_date: string;
  totals: DailySales;
  daily: DailySales[];
  by_product: ProductSales[];
  by_cashier: CashierSales[];
  by_hour: HourlySales[];
}

@Injectable()
export class Sal1301DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  getSales(from: string, to: string): Observable<ApiResponse<SalesReport>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<SalesReport>>(
      `${this.config.apiUrl}/sal/reports/sal1301/sales`, { params });
  }
}

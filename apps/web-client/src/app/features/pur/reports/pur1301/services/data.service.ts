import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SupplierAging {
  supplier_no: number;
  supplier_name?: string | null;
  current_amount: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total_due: number;
  oldest_days: number;
  invoice_count: number;
}

export interface AgingReport {
  as_of: string;
  total_due: number;
  rows: SupplierAging[];
}

export interface SpendRow {
  key_no: number;
  label?: string | null;
  invoice_count: number;
  spend: number;
  share_pct: number;
}

export interface SpendReport {
  from_date: string;
  to_date: string;
  total_spend: number;
  by_supplier: SpendRow[];
  by_category: SpendRow[];
}

@Injectable()
export class Pur1301DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get base() { return `${this.config.apiUrl}/pur/reports/pur1301`; }

  aging(asOf: string): Observable<ApiResponse<AgingReport>> {
    const params = new HttpParams().set('asOf', asOf);
    return this.http.get<ApiResponse<AgingReport>>(`${this.base}/aging`, { params });
  }

  spend(from: string, to: string): Observable<ApiResponse<SpendReport>> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<ApiResponse<SpendReport>>(`${this.base}/spend`, { params });
  }
}

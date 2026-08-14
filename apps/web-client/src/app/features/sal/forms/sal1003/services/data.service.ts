import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface PosSession {
  session_no: number;
  session_id: string;
  terminal_no: number;
  terminal_name?: string | null;
  cashier_user_no: number;
  opened_at: string;
  opening_float: number;
  closed_at?: string | null;
  expected_cash?: number | null;
  counted_cash?: number | null;
  cash_variance?: number | null;
  total_sales: number;
  total_returns: number;
  invoice_count: number;
  status: number;
  variance_remarks?: string | null;
}

export interface TenderTotal {
  payment_method: number;
  method_name: string;
  amount: number;
}

export interface SessionSummary {
  session: PosSession | null;
  tenders: TenderTotal[];
  expected_cash: number;
  /** Opening float plus cash taken — what should physically be in the drawer. */
  expected_drawer: number;
  total_sales: number;
  total_returns: number;
  invoice_count: number;
  non_cash_total: number;
  /** Sale value left on credit; explains why sales and tenders differ. */
  due_total: number;
}

@Injectable()
export class Sal1003DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);

  private get base() { return `${this.config.apiUrl}/sal/forms/sal1001`; }

  getSessions(status?: number): Observable<ApiResponse<PosSession[]>> {
    let params = new HttpParams();
    if (status != null) params = params.set('status', String(status));
    return this.http.get<ApiResponse<PosSession[]>>(`${this.base}/sessions`, { params });
  }

  getSummary(sessionNo: number): Observable<ApiResponse<SessionSummary>> {
    return this.http.get<ApiResponse<SessionSummary>>(`${this.base}/sessions/${sessionNo}/summary`);
  }

  close(sessionNo: number, body: {
    counted_cash: number;
    variance_approved: boolean;
    remarks?: string | null;
  }): Observable<ApiResponse<PosSession>> {
    return this.http.post<ApiResponse<PosSession>>(`${this.base}/sessions/${sessionNo}/close`, body);
  }
}

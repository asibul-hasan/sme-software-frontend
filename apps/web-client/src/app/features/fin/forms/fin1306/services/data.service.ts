import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface CashFlowRow {
  account_no: number;
  account_code: string;
  account_name: string;
  control_type: number;
  opening: number;
  receipts: number;
  payments: number;
  closing: number;
}

export interface CashFlow {
  from_date: string;
  to_date: string;
  opening_cash: number;
  total_receipts: number;
  total_payments: number;
  net_cash_flow: number;
  closing_cash: number;
  rows: CashFlowRow[];
}

/** Form-level HTTP service for FIN_1306 – Cash Flow. */
@Injectable()
export class Fin1306DataService {
  private fin = inject(FinDataService);
  cashFlow(from?: string, to?: string): Observable<ApiResponse<CashFlow>> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.fin.getList<CashFlow>('forms/fin1306/cash-flow', Object.keys(params).length ? params : undefined);
  }
}

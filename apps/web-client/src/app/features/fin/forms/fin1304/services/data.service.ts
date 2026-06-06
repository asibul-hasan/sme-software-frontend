import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface StatementRow {
  account_no: number;
  account_code: string;
  account_name: string;
  amount: number;
}

export interface ProfitAndLoss {
  from_date: string;
  to_date: string;
  income: StatementRow[];
  expense: StatementRow[];
  total_income: number;
  total_expense: number;
  net_profit: number;
}

/** Form-level HTTP service for FIN_1304 – Profit & Loss. */
@Injectable()
export class Fin1304DataService {
  private fin = inject(FinDataService);
  profitAndLoss(from?: string, to?: string): Observable<ApiResponse<ProfitAndLoss>> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.fin.getList<ProfitAndLoss>('forms/fin1304/profit-loss', Object.keys(params).length ? params : undefined);
  }
}

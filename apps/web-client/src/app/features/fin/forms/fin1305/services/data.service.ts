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

export interface BalanceSheet {
  as_of: string;
  assets: StatementRow[];
  liabilities: StatementRow[];
  equity: StatementRow[];
  current_earnings: number;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  total_liabilities_equity: number;
  balanced: boolean;
}

/** Form-level HTTP service for FIN_1305 – Balance Sheet. */
@Injectable()
export class Fin1305DataService {
  private fin = inject(FinDataService);
  balanceSheet(asOf?: string): Observable<ApiResponse<BalanceSheet>> {
    return this.fin.getList<BalanceSheet>('forms/fin1305/balance-sheet', asOf ? { asOf } : undefined);
  }
}

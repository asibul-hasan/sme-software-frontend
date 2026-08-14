import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface FinYearOption {
  fin_year_no: number;
  fin_year_id: string;
  fin_year_name: string;
  start_date: string;
  end_date: string;
  is_closed: number | null;
}

export interface FinPeriod {
  fin_period_no: number;
  fin_year_no: number;
  fin_period_id: string;
  fin_period_name: string;
  start_date: string;
  end_date: string;
  period_status: number;
}

export interface CloseResult {
  voucher_no: number | null;
  voucher_id: string | null;
  total_income: number;
  total_expense: number;
  net_profit: number;
}

export interface CloseAccount {
  account_no: number;
  account_code: string;
  account_name: string;
}

/** Form-level HTTP service for FIN_1401 – Period / Year-End Close. */
@Injectable()
export class Fin1401DataService {
  private fin = inject(FinDataService);

  getYears(): Observable<ApiResponse<FinYearOption[]>> {
    return this.fin.getList<FinYearOption[]>('forms/fin1401/years');
  }
  getPeriods(finYearNo: number): Observable<ApiResponse<FinPeriod[]>> {
    return this.fin.getList<FinPeriod[]>('forms/fin1401/periods', { finYearNo });
  }
  setPeriodStatus(finPeriodNo: number, status: number): Observable<ApiResponse<FinPeriod>> {
    // PUT /forms/fin1401/periods/{no}/status?status=X — status carried as a query param
    return this.fin.update<FinPeriod>('forms/fin1401/periods', `${finPeriodNo}/status?status=${status}`, {});
  }
  // accounts for the retained-earnings selector (postable accounts; reuse FIN_1004 lookup)
  getAccounts(): Observable<ApiResponse<CloseAccount[]>> {
    return this.fin.getList<CloseAccount[]>('forms/fin1004/accounts');
  }
  yearEndClose(payload: { fin_year_no: number; retained_earnings_account_no: number; income_summary_account_no: number }): Observable<ApiResponse<CloseResult>> {
    return this.fin.insert<CloseResult>('forms/fin1401/year-end-close', payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { CommonDataService, CurrencyLookup } from '../../../../../shared/services/common-data.service';
import { SysDataService } from '../../../../sys/services/data.service';

export interface OpeningAccount {
  account_no: number;
  account_code: string;
  account_name: string;
  root_type: number;
  normal_balance: 'dr' | 'cr';
  control_type: number | null;
}

export interface OpeningLine {
  account_no: number | null;
  account_code?: string;
  account_name?: string;
  dr_cr?: 'dr' | 'cr';
  amount?: number;
  amount_base?: number;
  debit?: number;
  credit?: number;
}

export interface RateHistory {
  exchange_rate_no: number;
  rate_date: string;
  rate: number;
  created_by: number;
  created_at: string;
}

export interface OpeningResult {
  voucher_no: number;
  voucher_id: string;
  total_debit: number;
  total_credit: number;
  balancing_amount: number;
}

/** Form-level HTTP service for FIN_1004 – Opening Balance. */
@Injectable()
export class Fin1004DataService {
  private fin = inject(FinDataService);
  private common = inject(CommonDataService);
  private sys = inject(SysDataService);

  getAccounts(): Observable<ApiResponse<OpeningAccount[]>> {
    return this.fin.getList<OpeningAccount[]>('forms/fin1004/accounts');
  }

  getCurrencies(): Observable<ApiResponse<CurrencyLookup[]>> {
    return this.common.getCurrencyList();
  }

  getRateHistory(currencyNo: number): Observable<ApiResponse<RateHistory[]>> {
    return this.sys.getList<RateHistory[]>('forms/sys1004/currencies/rate-history', { currency_no: currencyNo });
  }

  post(payload: {
    voucher_date: string;
    currency_no?: number | null;
    exchange_rate?: number | null;
    opening_equity_account_no?: number | null;
    narration?: string;
    lines: OpeningLine[];
  }): Observable<ApiResponse<OpeningResult>> {
    return this.fin.insert<OpeningResult>('forms/fin1004/post', payload);
  }
}

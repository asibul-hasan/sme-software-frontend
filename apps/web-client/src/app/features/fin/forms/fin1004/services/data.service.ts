import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface OpeningAccount {
  account_no: number;
  account_code: string;
  account_name: string;
  root_type: number;
  normal_balance: number;
  control_type: number | null;
}

export interface OpeningLine {
  account_no: number | null;
  account_code?: string;
  account_name?: string;
  debit: number;
  credit: number;
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

  getAccounts(): Observable<ApiResponse<OpeningAccount[]>> {
    return this.fin.getList<OpeningAccount[]>('forms/fin1004/accounts');
  }
  post(payload: {
    voucher_date: string;
    opening_equity_account_no: number;
    narration?: string;
    lines: OpeningLine[];
  }): Observable<ApiResponse<OpeningResult>> {
    return this.fin.insert<OpeningResult>('forms/fin1004/post', payload);
  }
}

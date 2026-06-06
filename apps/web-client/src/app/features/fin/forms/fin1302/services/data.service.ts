import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface AccountLite { account_no: number; account_code: string; account_name: string; }
export interface LedgerRow {
  ledger_no: number; voucher_no: number; voucher_id: string; voucher_date: string;
  voucher_type_name?: string | null; narration?: string | null; debit: number; credit: number; running_balance: number;
}
export interface LedgerResult {
  account_no: number; account_code: string; account_name: string;
  from_date: string; to_date: string;
  opening_balance: number; total_debit: number; total_credit: number; closing_balance: number;
  rows: LedgerRow[];
}

/** Form-level HTTP service for FIN_1302 – Account Ledger. */
@Injectable()
export class Fin1302DataService {
  private fin = inject(FinDataService);
  ledger(accountNo: number, from?: string, to?: string): Observable<ApiResponse<LedgerResult>> {
    const params: Record<string, string | number> = { accountNo };
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.fin.getList<LedgerResult>('forms/fin1302/ledger', params);
  }
  loadAccounts(): Observable<ApiResponse<AccountLite[]>> { return this.fin.getList<AccountLite[]>('forms/fin1001/accounts'); }
}

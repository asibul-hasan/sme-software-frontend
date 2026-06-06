import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface BankAccount {
  account_no: number;
  account_code: string;
  account_name: string;
}

export interface ReconLine {
  ledger_no: number;
  voucher_no: number;
  voucher_id: string;
  voucher_date: string;
  narration: string;
  debit: number;
  credit: number;
  cleared: boolean;
}

export interface Worksheet {
  account_no: number;
  account_code: string;
  account_name: string;
  statement_date: string;
  book_balance: number;
  lines: ReconLine[];
}

export interface Recon {
  bank_recon_no: number;
  bank_recon_id: string;
  account_no: number;
  account_code: string;
  account_name: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  cleared_balance: number;
  difference: number;
  status: number;
  narration: string;
  lines: ReconLine[];
}

/** Form-level HTTP service for FIN_1102 – Bank Reconciliation. */
@Injectable()
export class Fin1102DataService {
  private fin = inject(FinDataService);

  getBankAccounts(): Observable<ApiResponse<BankAccount[]>> {
    return this.fin.getList<BankAccount[]>('forms/fin1102/bank-accounts');
  }
  getWorksheet(accountNo: number, statementDate?: string): Observable<ApiResponse<Worksheet>> {
    const params: Record<string, string | number> = { accountNo };
    if (statementDate) params['statementDate'] = statementDate;
    return this.fin.getList<Worksheet>('forms/fin1102/worksheet', params);
  }
  getList(): Observable<ApiResponse<Recon[]>> {
    return this.fin.getList<Recon[]>('forms/fin1102/recons');
  }
  save(payload: {
    account_no: number;
    statement_date: string;
    statement_balance: number;
    narration?: string;
    cleared_ledger_nos: number[];
  }): Observable<ApiResponse<Recon>> {
    return this.fin.insert<Recon>('forms/fin1102/recons', payload);
  }
}

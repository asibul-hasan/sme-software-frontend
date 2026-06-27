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
  bank_date: string;
  reference_no?: string;
  narration: string;
  debit: number;
  credit: number;
  cleared: boolean;
  reconciled: boolean;
  bank_recon_id?: string;
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
  getWorksheet(
    accountNo: number,
    statementDate?: string,
    fromDate?: string,
    toDate?: string,
    status?: string,
  ): Observable<ApiResponse<Worksheet>> {
    const params: Record<string, string | number> = { accountNo };
    if (statementDate) params['statementDate'] = statementDate;
    if (fromDate) params['fromDate'] = fromDate;
    if (toDate) params['toDate'] = toDate;
    if (status) params['status'] = status;
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
    cleared_lines: { ledger_no: number; bank_date: string }[];
  }): Observable<ApiResponse<Recon>> {
    return this.fin.insert<Recon>('forms/fin1102/recons', payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { BankAccount, AccountLite } from './model.service';

/** Form-level HTTP service for FIN_1005 – Bank/Cash Account. */
@Injectable()
export class Fin1005DataService {
  private fin = inject(FinDataService);
  loadBanks(): Observable<ApiResponse<BankAccount[]>> { return this.fin.getList<BankAccount[]>('forms/fin1005/bank-accounts'); }
  loadDetail(no: number): Observable<ApiResponse<BankAccount>> { return this.fin.getDtl<BankAccount>('forms/fin1005/bank-accounts', no); }
  save(p: Partial<BankAccount>): Observable<ApiResponse<BankAccount>> { return this.fin.insert<BankAccount>('forms/fin1005/bank-accounts', p); }
  update(no: number, p: Partial<BankAccount>): Observable<ApiResponse<BankAccount>> { return this.fin.update<BankAccount>('forms/fin1005/bank-accounts', no, p); }
  remove(no: number): Observable<ApiResponse<void>> { return this.fin.delete<void>('forms/fin1005/bank-accounts', no); }
  loadAccounts(): Observable<ApiResponse<AccountLite[]>> { return this.fin.getList<AccountLite[]>('forms/fin1001/accounts'); }
}

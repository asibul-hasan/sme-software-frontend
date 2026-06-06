import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Account, AccountGroupLite } from './model.service';

/** Form-level HTTP service for FIN_1001 – Chart of Accounts (/api/v1/fin/forms/fin1001/accounts). */
@Injectable()
export class Fin1001DataService {
  private fin = inject(FinDataService);
  loadAccounts(): Observable<ApiResponse<Account[]>> {
    return this.fin.getList<Account[]>('forms/fin1001/accounts');
  }
  loadDetail(no: number): Observable<ApiResponse<Account>> {
    return this.fin.getDtl<Account>('forms/fin1001/accounts', no);
  }
  save(p: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.fin.insert<Account>('forms/fin1001/accounts', p);
  }
  update(no: number, p: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.fin.update<Account>('forms/fin1001/accounts', no, p);
  }
  remove(no: number): Observable<ApiResponse<void>> {
    return this.fin.delete<void>('forms/fin1001/accounts', no);
  }
  loadGroups(): Observable<ApiResponse<AccountGroupLite[]>> {
    return this.fin.getList<AccountGroupLite[]>('forms/fin1002/groups');
  }
}

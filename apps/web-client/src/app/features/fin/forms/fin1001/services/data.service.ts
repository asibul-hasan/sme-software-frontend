import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Account } from './model.service';

/**
 * Form-level HTTP data service for FIN_1001 – Unified Chart of Accounts.
 * Handles unified API operations for all COA hierarchy nodes (groups & accounts).
 */
@Injectable()
export class Fin1001DataService {
  private readonly fin = inject(FinDataService);

  // ── Unified Chart of Accounts Endpoints ────────────────────────────────────

  /** Loads all Chart of Accounts records (groups & accounts) for the current company. */
  loadAccounts(): Observable<ApiResponse<Account[]>> {
    return this.fin.getList<Account[]>('forms/fin1001/accounts');
  }

  /** Loads detailed properties of a single COA node. */
  loadAccountDetail(accountNo: number): Observable<ApiResponse<Account>> {
    return this.fin.getDtl<Account>('forms/fin1001/accounts', accountNo);
  }

  /** Creates a new COA record (group or leaf account). */
  saveAccount(payload: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.fin.insert<Account>('forms/fin1001/accounts', payload);
  }

  /** Updates an existing COA record. */
  updateAccount(accountNo: number, payload: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.fin.update<Account>('forms/fin1001/accounts', accountNo, payload);
  }

  /** Soft-deletes a COA record (blocked if child nodes or transactions exist). */
  deleteAccount(accountNo: number): Observable<ApiResponse<void>> {
    return this.fin.delete<void>('forms/fin1001/accounts', accountNo);
  }
}


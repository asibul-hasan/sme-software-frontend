import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface TrialBalanceRow {
  account_no: number;
  account_code: string;
  account_name: string;
  root_type: number;
  debit: number;
  credit: number;
}

/** Form-level HTTP service for FIN_1301 – Trial Balance. */
@Injectable()
export class Fin1301DataService {
  private fin = inject(FinDataService);
  trialBalance(asOf?: string): Observable<ApiResponse<TrialBalanceRow[]>> {
    return this.fin.getList<TrialBalanceRow[]>('forms/fin1301/trial-balance', asOf ? { asOf } : undefined);
  }
}

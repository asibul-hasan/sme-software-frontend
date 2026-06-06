import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface DayBookRow {
  ledger_no: number; voucher_no: number; voucher_id: string; voucher_date: string;
  voucher_type_name?: string | null; account_code?: string | null; account_name?: string | null;
  narration?: string | null; debit: number; credit: number;
}

/** Form-level HTTP service for FIN_1303 – Day Book. */
@Injectable()
export class Fin1303DataService {
  private fin = inject(FinDataService);
  dayBook(from?: string, to?: string): Observable<ApiResponse<DayBookRow[]>> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return this.fin.getList<DayBookRow[]>('forms/fin1303/day-book', params);
  }
}

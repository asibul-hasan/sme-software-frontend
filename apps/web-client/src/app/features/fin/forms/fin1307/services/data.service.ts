import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

/** Field names mirror `Fin1307AgingRowDto` exactly — the backend DTO is the contract. */
export interface AgingRow {
  party_no: number;
  party_name?: string | null;
  current_amount: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total_outstanding: number;
}

export interface Aging {
  as_of_date: string;
  party_type: number;
  rows: AgingRow[];
  grand_total: number;
}

/** Form-level HTTP service for FIN_1307 – AR/AP Aging. */
@Injectable()
export class Fin1307DataService {
  private fin = inject(FinDataService);
  aging(partyType: number, asOf?: string): Observable<ApiResponse<Aging>> {
    const params: Record<string, string | number> = { partyType };
    if (asOf) params['asOf'] = asOf;
    return this.fin.getList<Aging>('forms/fin1307/aging', params);
  }
}

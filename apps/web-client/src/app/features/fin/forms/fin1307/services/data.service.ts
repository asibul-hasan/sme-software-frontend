import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface AgingRow {
  party_type: number;
  party_no: number;
  current: number;
  bucket1: number;
  bucket2: number;
  bucket3: number;
  outstanding: number;
}

export interface Aging {
  as_of: string;
  party_type: number;
  rows: AgingRow[];
  total_current: number;
  total_b1: number;
  total_b2: number;
  total_b3: number;
  total_outstanding: number;
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

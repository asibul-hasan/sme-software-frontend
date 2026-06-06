import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface OutboxEvent {
  event_no: number; company_no: number; branch_no?: number | null;
  aggregate_type: string; aggregate_id: string; event_type: string;
  status: number; retry_count?: number | null;
  created_at?: string | null; published_at?: string | null; payload?: string | null;
}

/** Form-level HTTP service for FIN_1201 – Auto-Posting Monitor. */
@Injectable()
export class Fin1201DataService {
  private fin = inject(FinDataService);
  events(status: number): Observable<ApiResponse<OutboxEvent[]>> { return this.fin.getList<OutboxEvent[]>('forms/fin1201/events', { status }); }
  drain(): Observable<ApiResponse<{ handled: number }>> { return this.fin.insert<{ handled: number }>('forms/fin1201/drain', {}); }
  redrive(no: number): Observable<ApiResponse<void>> { return this.fin.insert<void>(`forms/fin1201/events/${no}/redrive`, {}); }
}

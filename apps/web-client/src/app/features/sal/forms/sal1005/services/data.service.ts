import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SalOption { no: number; name: string; }
export interface TerminalLookups { warehouses: SalOption[]; }

export interface ITerminal {
  terminal_no?: number | null;
  terminal_id: string;
  terminal_name: string;
  warehouse_no: number | null;
  warehouse_name?: string | null;
  device_uuid?: string | null;
  receipt_prefix?: string | null;
  cash_gl_account_no?: number | null;
  remarks?: string | null;
  is_active?: number | null;
  row_version?: number;
}

const BASE = 'forms/sal1005';

/** Form-level HTTP service for SAL_1005 — POS Terminal Setup. */
@Injectable()
export class Sal1005DataService {
  private sal = inject(SalDataService);

  lookups(): Observable<ApiResponse<TerminalLookups>> {
    return this.sal.getList<TerminalLookups>(`${BASE}/lookups`);
  }

  list(): Observable<ApiResponse<ITerminal[]>> {
    return this.sal.getList<ITerminal[]>(`${BASE}/terminals`);
  }

  save(payload: ITerminal): Observable<ApiResponse<ITerminal>> {
    return this.sal.insert<ITerminal>(`${BASE}/terminals`, payload);
  }

  update(no: number, payload: ITerminal): Observable<ApiResponse<ITerminal>> {
    return this.sal.update<ITerminal>(`${BASE}/terminals`, no, payload);
  }

  remove(no: number): Observable<ApiResponse<void>> {
    return this.sal.delete<void>(`${BASE}/terminals`, no);
  }
}

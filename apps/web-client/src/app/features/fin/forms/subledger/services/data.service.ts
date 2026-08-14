import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SubLedgerPartyRow {
  party_no: number;
  party_name: string;
  subledger_balance: number;
  gl_balance: number;
  difference: number;
}

export interface SubLedgerRecon {
  as_of_date: string;
  party_type: number;
  subledger_total: number;
  gl_control_total: number;
  unattributed_gl: number;
  difference: number;
  no_control_account: boolean;
  rows: SubLedgerPartyRow[];
}

export interface SubLedgerStatementRow {
  txn_date: string;
  ref_doc_type: number;
  ref_doc_no: string;
  debit: number;
  credit: number;
  running_balance: number;
  remarks?: string | null;
}

export interface SubLedgerStatement {
  party_no: number;
  party_name: string;
  party_type: number;
  from_date: string;
  to_date: string;
  opening_balance: number;
  closing_balance: number;
  rows: SubLedgerStatementRow[];
}

/**
 * Form-level HTTP service for FIN_1202 (AP) and FIN_1203 (AR). The form segment is
 * passed in rather than fixed, because the two forms share one screen — see the
 * component for why.
 */
@Injectable()
export class SubLedgerDataService {
  private fin = inject(FinDataService);

  reconciliation(formSegment: string, asOf: string): Observable<ApiResponse<SubLedgerRecon>> {
    return this.fin.getList<SubLedgerRecon>(`forms/${formSegment}/reconciliation`, { asOf });
  }

  statement(formSegment: string, partyNo: number, from: string, to: string): Observable<ApiResponse<SubLedgerStatement>> {
    return this.fin.getList<SubLedgerStatement>(`forms/${formSegment}/statement`, { partyNo, from, to });
  }
}

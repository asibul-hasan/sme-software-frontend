import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

/** A pending approval routed to the current user's role. */
export interface PendingApproval {
  approval_request_no: number;
  document_type: string;
  document_no: string;
  document_pk: number;
  amount: number;
  current_step: number;
  approver_role_no: number;
  requested_by: number;
  requested_at: string;
}

/** HTTP service for the Approval Inbox (/api/v1/sys/approvals). */
@Injectable()
export class ApprovalInboxDataService {
  private sys = inject(SysDataService);

  loadPending(): Observable<ApiResponse<PendingApproval[]>> {
    return this.sys.getList<PendingApproval[]>('approvals/pending');
  }
  approve(no: number, remarks?: string): Observable<ApiResponse<unknown>> {
    return this.sys.insert<unknown>(`approvals/${no}/approve`, { remarks: remarks ?? null });
  }
  reject(no: number, remarks?: string): Observable<ApiResponse<unknown>> {
    return this.sys.insert<unknown>(`approvals/${no}/reject`, { remarks: remarks ?? null });
  }
}

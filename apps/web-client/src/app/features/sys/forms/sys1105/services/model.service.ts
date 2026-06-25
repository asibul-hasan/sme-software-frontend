import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { sysAuditActionTypeOptions } from '../../../../../core/constants/common-options.constants';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1105DataService } from './data.service';

export interface AuditLogRow {
  audit_log_no: number;
  branch_no?: number | null;
  user_no?: number | null;
  session_no?: number | null;
  table_name: string;
  record_pk: string;
  action_type: string;
  ip_address?: string | null;
  action_at: string;
}

export interface AuditLogFilter {
  table_name?: string;
  action_type?: string;
  user_no?: number | null;
  from_at?: string;
  to_at?: string;
  limit?: number;
}

/** View-model for SYS1105 Activity Log Viewer (read-only). */
@Injectable()
export class Sys1105ModelService {
  private data = inject(Sys1105DataService);

  logs = signal<AuditLogRow[]>([]);
  isLoading = signal(false);

  filter: AuditLogFilter = { limit: 200 };

  readonly actionTypeOptions = sysAuditActionTypeOptions;

  search(): void {
    this.isLoading.set(true);
    this.data
      .search(this.filter)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.logs.set(res.data);
        else this.logs.set([]);
      });
  }

  reset(): void {
    this.filter = { limit: 200 };
    this.search();
  }
}

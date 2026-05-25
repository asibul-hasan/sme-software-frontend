import { Injectable, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1109DataService } from './data.service';

export interface SessionRow {
  session_no: number;
  user_no: number;
  user_id: string;
  user_name: string;
  ip_address?: string | null;
  user_agent?: string | null;
  active_branch_no?: number | null;
  active_company_no?: number | null;
  login_at: string;
  last_seen_at?: string | null;
  expired_at?: string | null;
  logout_at?: string | null;
  is_revoked: number;
  is_live: boolean;
}

export interface LoginAttemptRow {
  login_attempt_no: number;
  user_id: string;
  user_name?: string | null;
  ip_address?: string | null;
  is_success: number;
  fail_reason?: string | null;
  attempted_at: string;
}

/** View-model for SYS1109 Session/Login Monitor (read-only + force-logout). */
@Injectable()
export class Sys1109ModelService {
  private data = inject(Sys1109DataService);
  private toastr = inject(ToastrService);

  sessions = signal<SessionRow[]>([]);
  attempts = signal<LoginAttemptRow[]>([]);
  activeTab = signal<'sessions' | 'attempts'>('sessions');
  isLoading = signal(false);

  loadSessions(): void {
    this.isLoading.set(true);
    this.data
      .getSessions()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.sessions.set(res.data);
        else this.sessions.set([]);
      });
  }

  loadAttempts(): void {
    this.isLoading.set(true);
    this.data
      .getLoginAttempts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.attempts.set(res.data);
        else this.attempts.set([]);
      });
  }

  refresh(): void {
    if (this.activeTab() === 'sessions') this.loadSessions();
    else this.loadAttempts();
  }

  revoke(sessionNo: number): void {
    this.isLoading.set(true);
    this.data
      .revokeSession(sessionNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Session revoked');
            this.loadSessions();
          } else {
            this.toastr.error(res.message || 'Revoke failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during revoke'),
      });
  }
}

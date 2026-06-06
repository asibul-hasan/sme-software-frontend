import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1102DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Punch {
  employee_no: number;
  att_date: string;
  in_time: string | null;
  out_time: string | null;
  shift_no: number | null;
  __uid?: number;
}

export interface SyncResult { created: number; updated: number; skipped: number; total: number; messages: string[]; }

export interface AttendanceRow {
  attendance_no: number;
  employee_no: number;
  att_date: string;
  in_time: string | null;
  out_time: string | null;
  status: number;
  late_minutes: number;
  worked_hours: number;
  source: number;
  is_locked: number;
}

interface ShiftLite { shift_no: number; shift_name: string; shift_id: string; }

/** State for the HRM_1102 Device-Sync Attendance form (staging punches + recent grid). */
@Injectable()
export class Hrm1102ModelService {
  private data    = inject(Hrm1102DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }
  private uidSeq = 1;

  punches    = signal<Punch[]>([]);
  recent     = signal<AttendanceRow[]>([]);
  employees  = signal<EmployeeLookup[]>([]);
  shifts     = signal<ShiftLite[]>([]);
  isLoading  = signal(false);
  isSaving   = signal(false);
  lastResult = signal<SyncResult | null>(null);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }
  shiftName(no?: number | null): string {
    if (no == null) return '—';
    return this.shifts().find((x) => x.shift_no === no)?.shift_name ?? `#${no}`;
  }

  hasPunches = computed(() => this.punches().length > 0);

  loadLookups(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
    this.data.loadShifts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.shifts.set(r.data); } });
  }

  loadRecent(): void {
    this.isLoading.set(true);
    this.data.loadRecent().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.recent.set(res.data); },
      error: () => this.toastr.error('Failed to load recent attendance'),
    });
  }

  addPunch(p: Omit<Punch, '__uid'>): boolean {
    if (p.employee_no == null || !p.att_date) { this.toastr.warning('Employee and date are required'); return false; }
    if (this.punches().some((x) => x.employee_no === p.employee_no && x.att_date === p.att_date)) {
      this.toastr.warning('A punch for this employee and date is already staged'); return false;
    }
    this.punches.update((arr) => [...arr, { ...p, __uid: this.uidSeq++ }]);
    return true;
  }
  removePunch(uid?: number): void { this.punches.update((arr) => arr.filter((x) => x.__uid !== uid)); }
  clearPunches(): void { this.punches.set([]); }

  sync(): void {
    if (this.punches().length === 0) { this.toastr.warning('Stage at least one punch to sync'); return; }
    this.isSaving.set(true);
    const payload = this.punches().map((p) => ({
      employee_no: p.employee_no, att_date: p.att_date, in_time: p.in_time || null, out_time: p.out_time || null, shift_no: p.shift_no ?? null,
    }));
    this.data.sync(this.currentBranchNo, payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.lastResult.set(res.data);
          this.toastr.success(res.message || 'Punches synced');
          this.clearPunches();
          this.loadRecent();
        } else { this.toastr.error(res.message || 'Sync failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during sync'),
    });
  }
}

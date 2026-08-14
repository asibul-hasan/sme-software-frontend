import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { PosSession, Sal1003DataService, SessionSummary } from './data.service';

/** A denomination row in the cash-count grid. */
export interface DenomRow {
  value: number;
  label: string;
  count: number | null;
}

/** Bangladeshi notes and coins, largest first — the order a drawer is counted in. */
const DENOMINATIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1000, label: '৳1000' },
  { value: 500, label: '৳500' },
  { value: 200, label: '৳200' },
  { value: 100, label: '৳100' },
  { value: 50, label: '৳50' },
  { value: 20, label: '৳20' },
  { value: 10, label: '৳10' },
  { value: 5, label: '৳5' },
  { value: 2, label: '৳2' },
  { value: 1, label: '৳1' },
];

/**
 * SAL_1003 POS Closing.
 *
 * The screen exists to make one number trustworthy: what is physically in the
 * drawer versus what the recorded tenders say should be. Everything else on it
 * is context for explaining a difference.
 */
@Injectable()
export class Sal1003ModelService {
  private data = inject(Sal1003DataService);
  private toastr = inject(ToastrService);

  sessions = signal<PosSession[]>([]);
  selectedNo = signal<number | null>(null);
  summary = signal<SessionSummary | null>(null);

  denominations = signal<DenomRow[]>(DENOMINATIONS.map((d) => ({ ...d, count: null })));
  /** Used when the cashier types a total instead of counting note by note. */
  manualCount = signal<number | null>(null);
  useDenominations = signal(true);

  varianceApproved = signal(false);
  remarks = signal('');

  isLoading = signal(false);
  isClosing = signal(false);

  readonly isClosed = computed(() => (this.summary()?.session?.status ?? 1) === 3);

  readonly countedCash = computed(() => {
    if (!this.useDenominations()) return this.manualCount() ?? 0;
    return this.denominations().reduce((sum, d) => sum + d.value * (d.count ?? 0), 0);
  });

  readonly expectedDrawer = computed(() => this.summary()?.expected_drawer ?? 0);

  readonly variance = computed(() => round2(this.countedCash() - this.expectedDrawer()));

  /** A cent of slack for rounding; anything more is a real discrepancy. */
  readonly hasVariance = computed(() => Math.abs(this.variance()) > 0.01);

  readonly canClose = computed(() => {
    if (!this.selectedNo() || this.isClosed() || this.isClosing()) return false;
    // The server enforces this too; mirroring it here keeps the button honest.
    if (this.hasVariance() && (!this.varianceApproved() || !this.remarks().trim())) return false;
    return true;
  });

  loadSessions(): void {
    this.isLoading.set(true);
    this.data
      .getSessions()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.sessions.set(res.data);

        // Land on the drawer that still needs closing, which is why anyone opens this form.
        const open = res.data.find((s) => s.status === 1);
        if (open) this.select(open.session_no);
      });
  }

  select(sessionNo: number): void {
    this.selectedNo.set(sessionNo);
    this.resetCount();

    this.data.getSummary(sessionNo).subscribe((res) => {
      if (isSuccess(res) && res.data) this.summary.set(res.data);
    });
  }

  setDenomCount(index: number, count: number | null): void {
    const next = [...this.denominations()];
    next[index] = { ...next[index], count: count != null && count >= 0 ? count : null };
    this.denominations.set(next);
  }

  resetCount(): void {
    this.denominations.set(DENOMINATIONS.map((d) => ({ ...d, count: null })));
    this.manualCount.set(null);
    this.varianceApproved.set(false);
    this.remarks.set('');
  }

  close(onClosed: () => void): void {
    const sessionNo = this.selectedNo();
    if (!sessionNo || !this.canClose()) return;

    this.isClosing.set(true);
    this.data
      .close(sessionNo, {
        counted_cash: this.countedCash(),
        variance_approved: this.varianceApproved(),
        remarks: this.remarks().trim() || null,
      })
      .pipe(finalize(() => this.isClosing.set(false)))
      .subscribe({
        next: (res) => {
          if (!isSuccess(res) || !res.data) return;
          this.toastr.success(`Session ${res.data.session_id} closed`);
          this.loadSessions();
          this.select(sessionNo);
          onClosed();
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not close the session')),
      });
  }
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** The server explains variance and sign-off refusals; show its wording, not ours. */
function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } })?.error?.message;
  return message?.trim() ? message : fallback;
}

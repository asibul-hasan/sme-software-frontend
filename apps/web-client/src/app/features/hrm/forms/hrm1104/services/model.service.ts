import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1104DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface RosterLine {
  roster_line_no?: number | null;
  employee_no: number;
  shift_no: number;
  weekly_off?: number | null;
  __uid?: number;   // local stable id for working set
}

export interface Roster extends BaseEntity {
  roster_no: number;
  roster_id: string;
  roster_name: string;
  from_date: string | null;
  to_date: string | null;
  status: number;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
  lines?: RosterLine[];
}

interface ShiftLite { shift_no: number; shift_name: string; shift_id: string; }

type RosterAction = 'publish' | 'cancel';

/** State + form + working-line-set for HRM_1104 – Shift Roster. */
@Injectable()
export class Hrm1104ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1104DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null { return this.authCtx.user()?.branch_no ?? null; }
  private uidSeq = 1;

  rosters       = signal<Roster[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  shifts        = signal<ShiftLite[]>([]);
  lines         = signal<RosterLine[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  status        = signal<number>(1);
  sortDirection = signal<'asc' | 'desc'>('desc');

  readonly isDraft = computed(() => this.status() === 1);

  employeeName(no?: number | null): string {
    if (no == null) return '';
    const e = this.employees().find((x) => x.employee_no === no);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${no}`;
  }
  shiftName(no?: number | null): string {
    if (no == null) return '';
    return this.shifts().find((x) => x.shift_no === no)?.shift_name ?? `#${no}`;
  }
  weekdayName(d?: number | null): string {
    if (d == null) return '—';
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d] ?? '—';
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.rosters()
      .filter((s) => (s.roster_id || '').toLowerCase().includes(term) || (s.roster_name || '').toLowerCase().includes(term))
      .sort((a, b) => b.roster_no - a.roster_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      roster_no:   [null],
      roster_id:   ['', [Validators.required, Validators.maxLength(30)]],
      roster_name: ['', [Validators.required, Validators.maxLength(120)]],
      from_date:   [new Date().toISOString().split('T')[0], [Validators.required]],
      to_date:     [new Date().toISOString().split('T')[0], [Validators.required]],
      is_active:   [1],
    });
  }

  loadLookups(): void {
    this.commApi.getEmployeeList().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.employees.set(r.data); } });
    this.data.loadShifts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.shifts.set(r.data); } });
  }

  // ── working line set ──────────────────────────────────────────────────────
  addLine(employeeNo: number | null, shiftNo: number | null, weeklyOff: number | null): boolean {
    if (employeeNo == null || shiftNo == null) { this.toastr.warning('Pick an employee and a shift'); return false; }
    if (this.lines().some((l) => l.employee_no === employeeNo)) { this.toastr.warning('Employee already in this roster'); return false; }
    this.lines.update((arr) => [...arr, { employee_no: employeeNo, shift_no: shiftNo, weekly_off: weeklyOff ?? null, __uid: this.uidSeq++ }]);
    return true;
  }
  removeLine(uid?: number): void {
    this.lines.update((arr) => arr.filter((l) => l.__uid !== uid));
  }

  loadRosters(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadRosters().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.rosters.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.roster_no === reselectNo) : null;
            this.selectRoster(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load rosters'),
    });
  }

  selectRoster(item: Roster): void {
    this.selectedNo.set(item.roster_no);
    this.status.set(item.status);
    this.isLoading.set(true);
    this.data.loadRosterDetail(item.roster_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.status.set(d.status);
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: this.uidSeq++ })));
          this.form.patchValue({
            roster_no:   d.roster_no,
            roster_id:   d.roster_id,
            roster_name: d.roster_name,
            from_date:   d.from_date ? d.from_date.slice(0, 10) : null,
            to_date:     d.to_date ? d.to_date.slice(0, 10) : null,
            is_active:   d.is_active,
          });
        }
      },
      error: () => this.toastr.error('Failed to load roster details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one employee to the roster.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const payload = {
      ...val,
      branch_no: this.currentBranchNo,
      lines: this.lines().map((l) => ({ employee_no: l.employee_no, shift_no: l.shift_no, weekly_off: l.weekly_off ?? null })),
    };
    const obs = isUpdate ? this.data.updateRoster(this.selectedNo()!, payload) : this.data.saveRoster(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Roster updated' : 'Roster created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.roster_no ?? null);
          this.loadRosters(savedNo);
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  doAction(action: RosterAction): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isSaving.set(true);
    this.data.action(no, action).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Roster ${action === 'publish' ? 'published' : 'cancelled'}`);
          this.loadRosters(no);
        } else { this.toastr.error(res.message || `${action} failed`); }
      },
      error: (err) => this.toastr.error(err?.error?.message || `Server error during ${action}`),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteRoster(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Roster deleted'); this.loadRosters(null); if (callback) callback(); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.lines.set([]);
    const today = new Date().toISOString().split('T')[0];
    this.form?.reset({ from_date: today, to_date: today, is_active: 1 });
  }
}

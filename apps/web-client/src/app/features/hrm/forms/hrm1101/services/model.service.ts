import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1101DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface Attendance extends BaseEntity {
  attendance_no: number;
  employee_no: number;
  att_date: string;
  shift_no?: number | null;
  in_time?: string | null;
  out_time?: string | null;
  status: number;
  late_minutes?: number | null;
  early_out_minutes?: number | null;
  worked_hours?: number | null;
  ot_hours?: number | null;
  source?: number | null;
  is_locked?: number | null;
  branch_no?: number | null;
  is_active: number;
  row_version: number;
}

/** State + form + orchestration for HRM_1101 – Manual Attendance. List sorts newest-date first. */
@Injectable()
export class Hrm1101ModelService {
  private fb       = inject(FormBuilder);
  private data     = inject(Hrm1101DataService);
  private commApi  = inject(CommonDataService);
  private toastr   = inject(ToastrService);
  private authCtx  = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  attendances     = signal<Attendance[]>([]);
  employees       = signal<EmployeeLookup[]>([]);
  isLoading       = signal(false);
  isSaving        = signal(false);
  searchTerm      = signal('');
  selectedNo      = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  /** Employee display name resolved locally from the lookup list. */
  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.attendances()
      .filter((a) => (a.att_date || '').includes(term) || this.employeeName(a.employee_no).toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (b.att_date || '').localeCompare(a.att_date || '') || b.attendance_no - a.attendance_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      attendance_no: [null],
      employee_no:   [null, [Validators.required]],
      att_date:      [new Date().toISOString().split('T')[0], [Validators.required]],
      status:        [1, [Validators.required]],
      in_time:       [null],
      out_time:      [null],
      late_minutes:  [0, [Validators.min(0)]],
      ot_hours:      [0, [Validators.min(0)]],
      is_locked:     [0],
      is_active:     [1],
    });
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
  }

  /** Reselect by PK after reload (list is date-sorted, so index is unreliable — per CLAUDE.md). */
  loadAttendances(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadAttendances().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.attendances.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((a) => a.attendance_no === reselectNo) : null;
            this.selectAttendance(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load attendance'),
    });
  }

  selectAttendance(item: Attendance): void {
    this.selectedNo.set(item.attendance_no);
    this.isLoading.set(true);
    this.data.loadAttendanceDetail(item.attendance_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            attendance_no: d['attendance_no'],
            employee_no:   d['employee_no'],
            att_date:      (d['att_date'] as string ?? '').slice(0, 10),
            status:        d['status'] ?? 1,
            in_time:       (d['in_time'] as string ?? '')?.slice(0, 5) || null,
            out_time:      (d['out_time'] as string ?? '')?.slice(0, 5) || null,
            late_minutes:  d['late_minutes'] ?? 0,
            ot_hours:      d['ot_hours'] ?? 0,
            is_locked:     d['is_locked'] ?? 0,
            is_active:     d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load attendance details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();

    const payload = {
      attendance_no: val.attendance_no,
      employee_no:   val.employee_no,
      att_date:      val.att_date,
      status:        val.status,
      in_time:       val.in_time || null,
      out_time:      val.out_time || null,
      late_minutes:  val.late_minutes,
      ot_hours:      val.ot_hours,
      branch_no:     this.currentBranchNo,
      is_active:     val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateAttendance(this.selectedNo()!, payload)
      : this.data.saveAttendance(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Attendance updated' : 'Attendance recorded');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.attendance_no ?? null);
          this.loadAttendances(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteAttendance(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Attendance deleted');
          this.loadAttendances(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({
      att_date: new Date().toISOString().split('T')[0],
      status: 1,
      late_minutes: 0,
      ot_hours: 0,
      is_locked: 0,
      is_active: 1,
    });
  }
}

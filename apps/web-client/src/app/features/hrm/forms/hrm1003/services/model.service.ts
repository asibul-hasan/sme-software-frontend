import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1003DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface Shift extends BaseEntity {
  shift_no: number;
  shift_id: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_minutes?: number | null;
  half_day_minutes?: number | null;
  break_minutes?: number | null;
  weekly_off_mask?: number | null;
  is_night_shift: number;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form + orchestration for HRM_1003 – Shift Setup. Mirrors the SYS_1005 form-wise model. */
@Injectable()
export class Hrm1003ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1003DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  shifts            = signal<Shift[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedShiftNo   = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  filteredShifts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.shifts()
      .filter((s) => s.shift_name.toLowerCase().includes(term) || s.shift_id.toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.shift_id || '').localeCompare(b.shift_id || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filteredShifts);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      shift_no:         [null],
      shift_id:         ['', [Validators.required, Validators.maxLength(20)]],
      shift_name:       ['', [Validators.required, Validators.maxLength(100)]],
      start_time:       ['09:00', [Validators.required]],
      end_time:         ['18:00', [Validators.required]],
      grace_minutes:    [0, [Validators.min(0)]],
      half_day_minutes: [null, [Validators.min(0)]],
      break_minutes:    [0, [Validators.min(0)]],
      weekly_off_mask:  [0],
      is_night_shift:   [0],
      remarks:          [''],
      is_active:        [1],
    });
  }

  loadShifts(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data.loadShifts().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.shifts.set(res.data);
          if (res.data.length > 0) {
            const index = reselectIndex !== undefined && reselectIndex < res.data.length ? reselectIndex : 0;
            this.selectShift(res.data[index], index);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load shifts'),
    });
  }

  selectShift(shift: Shift, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedShiftNo.set(shift.shift_no);
    this.isLoading.set(true);
    this.data.loadShiftDetail(shift.shift_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            shift_no:         d['shift_no'],
            shift_id:         d['shift_id'],
            shift_name:       d['shift_name'],
            start_time:       (d['start_time'] as string ?? '').slice(0, 5),
            end_time:         (d['end_time'] as string ?? '').slice(0, 5),
            grace_minutes:    d['grace_minutes'],
            half_day_minutes: d['half_day_minutes'],
            break_minutes:    d['break_minutes'],
            weekly_off_mask:  d['weekly_off_mask'] ?? 0,
            is_night_shift:   d['is_night_shift'] ?? 0,
            remarks:          d['remarks'],
            is_active:        d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load shift details'),
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
    const isUpdate = !!this.selectedShiftNo();

    const payload = {
      shift_no:         val.shift_no,
      shift_id:         val.shift_id,
      shift_name:       val.shift_name,
      start_time:       val.start_time,
      end_time:         val.end_time,
      grace_minutes:    val.grace_minutes,
      half_day_minutes: val.half_day_minutes,
      break_minutes:    val.break_minutes,
      weekly_off_mask:  val.weekly_off_mask,
      is_night_shift:   val.is_night_shift ? 1 : 0,
      branch_no:        this.currentBranchNo,
      remarks:          val.remarks,
      is_active:        val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateShift(this.selectedShiftNo()!, payload)
      : this.data.saveShift(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Shift updated' : 'Shift created');
          this.loadShifts(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const shiftNo = this.selectedShiftNo();
    if (!shiftNo) return;
    this.isLoading.set(true);
    this.data.deleteShift(shiftNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Shift deleted');
          this.loadShifts();
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedShiftNo.set(null);
    this.form?.reset({
      start_time: '09:00',
      end_time: '18:00',
      grace_minutes: 0,
      break_minutes: 0,
      weekly_off_mask: 0,
      is_night_shift: 0,
      is_active: 1,
    });
  }
}

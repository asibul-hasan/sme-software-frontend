import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1006DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface Holiday extends BaseEntity {
  holiday_no: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: number;
  is_recurring: number;
  leave_year?: number | null;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form + orchestration for HRM_1006 – Holiday Calendar. */
@Injectable()
export class Hrm1006ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1006DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  holidays          = signal<Holiday[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedNo        = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.holidays()
      .filter((h) => h.holiday_name.toLowerCase().includes(term) || (h.holiday_date || '').includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.holiday_date || '').localeCompare(b.holiday_date || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      holiday_no:   [null],
      holiday_date: ['', [Validators.required]],
      holiday_name: ['', [Validators.required, Validators.maxLength(150)]],
      holiday_type: [1, [Validators.required]],
      is_recurring: [0],
      leave_year:   [null],
      remarks:      [''],
      is_active:    [1],
    });
  }

  loadHolidays(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data.loadHolidays().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.holidays.set(res.data);
          if (res.data.length > 0) {
            const index = reselectIndex !== undefined && reselectIndex < res.data.length ? reselectIndex : 0;
            this.selectHoliday(res.data[index], index);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load holidays'),
    });
  }

  selectHoliday(item: Holiday, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedNo.set(item.holiday_no);
    this.isLoading.set(true);
    this.data.loadHolidayDetail(item.holiday_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            holiday_no:   d['holiday_no'],
            holiday_date: (d['holiday_date'] as string ?? '').slice(0, 10),
            holiday_name: d['holiday_name'],
            holiday_type: d['holiday_type'] ?? 1,
            is_recurring: d['is_recurring'] ?? 0,
            leave_year:   d['leave_year'],
            remarks:      d['remarks'],
            is_active:    d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load holiday details'),
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
      holiday_no:   val.holiday_no,
      holiday_date: val.holiday_date,
      holiday_name: val.holiday_name,
      holiday_type: val.holiday_type,
      is_recurring: val.is_recurring ? 1 : 0,
      leave_year:   val.leave_year,
      branch_no:    this.currentBranchNo,
      remarks:      val.remarks,
      is_active:    val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateHoliday(this.selectedNo()!, payload)
      : this.data.saveHoliday(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Holiday updated' : 'Holiday created');
          this.loadHolidays(isUpdate ? this.lastSelectedIndex : 0);
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
    this.data.deleteHoliday(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Holiday deleted');
          this.loadHolidays();
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
      holiday_type: 1,
      is_recurring: 0,
      is_active: 1,
    });
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1006DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import {
  makePaginator,
  SortDirection,
} from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holiday?: Holiday;
  dateStr: string;
}

export interface Holiday extends BaseEntity {
  holiday_no: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: number;
  alternate_type?: number | null;
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
  private fb = inject(FormBuilder);
  private data = inject(Hrm1006DataService);
  private toastr = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  holidays = signal<Holiday[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  selectedDate = signal<string | null>(null);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  filterYear = signal<number | null>(null);

  generateYear = signal<number | null>(new Date().getFullYear());
  isGenerating = signal(false);

  // Calendar state
  calendarMonth = signal(new Date().getMonth());
  calendarYear = signal(new Date().getFullYear());

  readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  readonly weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filterY = this.filterYear();

    const filtered = this.holidays().filter(
      (h) => {
        const matchTerm = h.holiday_name.toLowerCase().includes(term) ||
          (h.holiday_date || '').includes(term);
        let matchYear = true;
        if (filterY != null) {
          const hYear = h.leave_year || (h.holiday_date ? new Date(h.holiday_date).getFullYear() : null);
          if (hYear !== filterY) {
            matchYear = false;
          }
        }
        return matchTerm && matchYear;
      }
    );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) =>
      (a.holiday_date || '').localeCompare(b.holiday_date || ''),
    );
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  // Calendar computed
  calendarTitle = computed(
    () => `${this.monthNames[this.calendarMonth()]} ${this.calendarYear()}`,
  );

  calendarDays = computed<CalendarDay[]>(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const holidays = this.holidays();
    const holidayMap = new Map<string, Holiday>();
    holidays.forEach((h) => {
      if (h.holiday_date) {
        const d = h.holiday_date.slice(0, 10);
        holidayMap.set(d, h);
      }
    });

    const days: CalendarDay[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({
        date: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
        holiday: undefined,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dow = dateObj.getDay();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: d,
        month,
        year,
        isCurrentMonth: true,
        isToday:
          d === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
        isWeekend: dow === 0 || dow === 5 || dow === 6,
        holiday: holidayMap.get(dateStr),
        dateStr,
      });
    }

    // Next month leading days to fill 42 cells
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({
        date: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
        holiday: undefined,
        dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return days;
  });

  stats = computed(() => {
    const all = this.holidays();
    return {
      total: all.length,
      public: all.filter((h) => h.holiday_type === 1).length,
      religious: all.filter((h) => h.holiday_type === 2).length,
      optional: all.filter((h) => h.holiday_type === 3).length,
    };
  });

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      holiday_no: [null],
      holiday_date: ['', [Validators.required]],
      holiday_name: ['', [Validators.required, Validators.maxLength(150)]],
      holiday_type: [1, [Validators.required]],
      is_recurring: [0],
      leave_year: [null],
      remarks: [''],
      is_active: [1],
    });

    this.form.get('holiday_date')?.valueChanges.subscribe(val => {
      if (val) {
        this.selectedDate.set(val);
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          this.calendarYear.set(d.getFullYear());
          this.calendarMonth.set(d.getMonth());
        }
      } else {
        this.selectedDate.set(null);
      }
    });
  }

  loadHolidays(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadHolidays()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.holidays.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
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
    this.data
      .loadHolidayDetail(item.holiday_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.form.patchValue({
              holiday_no: d['holiday_no'],
              holiday_date: ((d['holiday_date'] as string) ?? '').slice(0, 10),
              holiday_name: d['holiday_name'],
              holiday_type: d['holiday_type'] ?? 1,
              is_recurring: d['is_recurring'] ?? 0,
              leave_year: d['leave_year'],
              remarks: d['remarks'],
              is_active: d['is_active'],
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
      holiday_no: val.holiday_no,
      holiday_date: val.holiday_date,
      holiday_name: val.holiday_name,
      holiday_type: val.holiday_type,
      is_recurring: val.is_recurring ? 1 : 0,
      leave_year: val.leave_year,
      branch_no: this.currentBranchNo,
      remarks: val.remarks,
      is_active: val.is_active,
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

  onInlineEdit(row: Record<string, unknown>): void {
    const holidayNo = row['holiday_no'] as number;
    if (!holidayNo) return;
    
    this.isSaving.set(true);
    const payload = {
      holiday_no: holidayNo,
      holiday_date: row['holiday_date'] as string,
      holiday_name: row['holiday_name'] as string,
      holiday_type: row['holiday_type'] as number,
      alternate_type: row['alternate_type'] as number,
      is_recurring: row['is_recurring'] ? 1 : 0,
      leave_year: row['leave_year'] as number,
      branch_no: this.currentBranchNo,
      remarks: row['remarks'] as string,
      is_active: row['is_active'] as number,
    };

    this.data.updateHoliday(holidayNo, payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Holiday updated');
          this.loadHolidays();
        } else {
          this.toastr.error(res.message || 'Update failed');
          this.loadHolidays(); // reload to revert invalid edit
        }
      },
      error: () => {
        this.toastr.error('Server error during update');
        this.loadHolidays(); // reload to revert invalid edit
      }
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .deleteHoliday(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
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

  onGenerate(): void {
    const year = this.generateYear();
    if (!year) return;
    this.isGenerating.set(true);
    this.data.generateHolidays(year).pipe(finalize(() => this.isGenerating.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(`Holidays generated for ${year}`);
          this.loadHolidays();
        } else {
          this.toastr.error(res.message || 'Generation failed');
        }
      },
      error: () => this.toastr.error('Server error during generation')
    });
  }

  prevMonth(): void {
    const m = this.calendarMonth();
    if (m === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update((y) => y - 1);
    } else {
      this.calendarMonth.set(m - 1);
    }
  }

  nextMonth(): void {
    const m = this.calendarMonth();
    if (m === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update((y) => y + 1);
    } else {
      this.calendarMonth.set(m + 1);
    }
  }

  holidayTypeClass(type?: number): string {
    switch (type) {
      case 1:
        return 'public';
      case 2:
        return 'religious';
      case 3:
        return 'optional';
      default:
        return '';
    }
  }
}

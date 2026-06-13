import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Sys1003DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';

import { IBranch } from '../../sys1002/services/model.service';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { makePaginator } from '../../../../../core/utils/paginator';

// ─── Status Mappers ──────────────────────────────────────────────────────────
// Backend uses Short codes; frontend displays strings.

const IS_CLOSED_MAP: Record<number, string> = { 0: 'Open', 1: 'Closed' };
const IS_CLOSED_REVERSE: Record<string, number> = { Open: 0, Closed: 1 };

const PERIOD_STATUS_MAP: Record<number, string> = { 1: 'Open', 2: 'Closed', 3: 'Locked' };
const PERIOD_STATUS_REVERSE: Record<string, number> = { Open: 1, Closed: 2, Locked: 3 };

export function isClosedToLabel(val: number | null | undefined): string {
  return IS_CLOSED_MAP[val ?? 0] ?? 'Open';
}

export function labelToIsClosed(val: string | null | undefined): number {
  return IS_CLOSED_REVERSE[val ?? 'Open'] ?? 0;
}

export function periodStatusToLabel(val: number | null | undefined): string {
  return PERIOD_STATUS_MAP[val ?? 1] ?? 'Open';
}

export function labelToPeriodStatus(val: string | null | undefined): number {
  return PERIOD_STATUS_REVERSE[val ?? 'Open'] ?? 1;
}

// ─── Domain Interfaces ───────────────────────────────────────────────────────
// Field names match the backend DTOs (snake_case).

export interface FinancialYearPeriod extends BaseEntity {
  fin_period_no?: number;
  fin_year_no?: number;
  fin_period_id: string;
  fin_period_name: string;
  start_date: string;
  end_date: string;
  period_type?: number;     // 1=Monthly, 2=Quarterly, 3=Half-Yearly, 4=Yearly, 5=Adjustment
  period_status?: number;   // 1=Open, 2=Closed, 3=Locked
  remarks?: string;
  is_active?: number;
  row_version?: number;
}

export interface FinancialYear extends BaseEntity {
  fin_year_no: number;
  fin_year_id: string;
  fin_year_name: string;
  start_date: string;
  end_date: string;
  is_closed: number;        // 0=Open, 1=Closed
  branch_no: number;
  remarks?: string;
  is_active?: number;
  row_version?: number;
  periods: FinancialYearPeriod[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * State + form + orchestration service for SYS1003 – Financial Year Setup.
 *
 * Responsibilities:
 *  - Reactive signals (list, loading flags, selection)
 *  - FormGroup + FormArray construction and patching
 *  - Orchestration of Sys1003DataService calls (load, save, delete)
 *
 * HTTP endpoint paths live in Sys1003DataService.
 */
@Injectable()
export class Sys1003ModelService {
  private fb        = inject(FormBuilder);
  private data      = inject(Sys1003DataService);
  private toastr    = inject(ToastrService);
  private datePipe  = inject(DatePipe);
  private authCtx   = inject(AuthContextService);

  /** Current logged-in branch — the default branch assignment on New. */
  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  financialYears    = signal<FinancialYear[]>([]);
  branches          = signal<IBranch[]>([]);
  isSaving          = signal(false);
  isClosed          = signal(false);
  searchTerm        = signal('');
  selectedYearNo    = signal<number | null>(null);
  lastSelectedIndex = 0;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredYears = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.financialYears().filter(
      (y) =>
        y.fin_year_name.toLowerCase().includes(term) ||
        y.fin_year_id.toLowerCase().includes(term),
    );
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator(this.filteredYears);

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  get periodsFormArray(): FormArray {
    return this.form.get('periods') as FormArray;
  }

  initForm(): void {
    this.form = this.fb.group({
      fin_year_no:  [null],
      fin_year_id:  ['', [Validators.required, Validators.maxLength(20)]],
      fin_year_name: [''],
      branch_nos:   [[] as number[]],   // multi-branch; empty = all branches
      start_date:   ['', [Validators.required]],
      end_date:     ['', [Validators.required]],
      is_closed:    [0],    // 0=Open, 1=Closed
      remarks:      [''],
      periods:      this.fb.array([]),
    }, {
      validators: [CustomValidators.minMax('start_date', 'end_date')]
    });
  }

  private setClosedState(closed: boolean): void {
    this.isClosed.set(closed);
    if (closed) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

  addPeriodRow(period?: FinancialYearPeriod): void {
    const group = this.fb.group({
      fin_period_no:   [period?.fin_period_no ?? null],
      fin_period_id:   [period?.fin_period_id ?? '', Validators.required],
      fin_period_name: [period?.fin_period_name ?? '', Validators.required],
      start_date:      [period?.start_date ?? '', Validators.required],
      end_date:        [period?.end_date ?? '', Validators.required],
      period_status:   [period?.period_status ?? 1, Validators.required],  // 1=Open
      period_type:     [period?.period_type ?? 1],  // 1=Monthly
      remarks:         [period?.remarks ?? ''],
    });
    this.periodsFormArray.push(group);
  }

  /** Auto-generate fin_year_id from start & end dates when creating a new FY */
  private generateFinYearId(): void {
    if (this.selectedYearNo()) return; // don't overwrite existing FY

    const startDateStr = this.form.get('start_date')?.value;
    const endDateStr   = this.form.get('end_date')?.value;
    if (!startDateStr || !endDateStr) return;

    const startParts = startDateStr.split('-');
    const endParts   = endDateStr.split('-');
    const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
    const end   = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));

    const mon = (d: Date) => d.toLocaleString('default', { month: 'short' }).toUpperCase();
    const yr  = (d: Date) => String(d.getFullYear()).slice(-2);

    const idPart = `${mon(start)}${yr(start)}-${mon(end)}${yr(end)}`;
    this.form.patchValue({
      fin_year_id:   `FY-${idPart}`,
      fin_year_name: idPart,
    });
  }

  autoGeneratePeriods(): void {
    const startDateStr = this.form.get('start_date')?.value;
    const endDateStr   = this.form.get('end_date')?.value;

    this.generateFinYearId();

    if (!startDateStr || !endDateStr) {
      this.toastr.warning('Please select start and end dates first.');
      return;
    }

    // Parse dates cleanly in local time to avoid timezone shifts
    const startParts = startDateStr.split('-');
    const endParts   = endDateStr.split('-');
    const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
    const end   = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
    
    this.periodsFormArray.clear();

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dateVal}`;
    };

    let current = new Date(start);

    while (current <= end) {
      const pStart = new Date(current);
      // Find the last day of the current month
      const pEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const finalPEnd = pEnd > end ? new Date(end) : pEnd;

      const monthName = pStart.toLocaleString('default', { month: 'long' });
      const year      = pStart.getFullYear();

      this.addPeriodRow({
        fin_period_id:   `${monthName.substring(0, 3).toUpperCase()}-${year}`,
        fin_period_name: `${monthName} ${year}`,
        start_date:      formatDate(pStart),
        end_date:        formatDate(finalPEnd),
        period_status:   1,  // Open
        period_type:     1,  // Monthly
      });

      // Move to the first day of the next month
      current = new Date(pEnd.getFullYear(), pEnd.getMonth() + 1, 1);
    }
    this.toastr.info('Accounting periods generated.');
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.branches.set(res.data);
      },
    });
  }

  loadFinancialYears(reselectIndex?: number): void {
    this.data.loadFinancialYears().subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.financialYears.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectYear(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load financial years'),
      });
  }

  selectYear(year: FinancialYear, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedYearNo.set(year.fin_year_no);
    this.setClosedState(false);

    this.data.loadFinancialYearDetail(year.fin_year_no).subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data;
            this.periodsFormArray.clear();

            this.form.patchValue({
              fin_year_no:   d.fin_year_no,
              fin_year_id:   d.fin_year_id,
              fin_year_name: d.fin_year_name,
              branch_nos:    d.branch_no != null ? [d.branch_no] : [],
              start_date:    this.datePipe.transform(d.start_date, 'yyyy-MM-dd'),
              end_date:      this.datePipe.transform(d.end_date, 'yyyy-MM-dd'),
              is_closed:     d.is_closed ?? 0,
              remarks:       d.remarks ?? '',
            });

            const periods = d.periods || [];
            if (periods.length) {
              periods.forEach((p) =>
                this.addPeriodRow({
                  fin_period_no:   p.fin_period_no,
                  fin_period_id:   p.fin_period_id,
                  fin_period_name: p.fin_period_name,
                  start_date:      this.datePipe.transform(p.start_date, 'yyyy-MM-dd') ?? '',
                  end_date:        this.datePipe.transform(p.end_date, 'yyyy-MM-dd') ?? '',
                  period_status:   p.period_status ?? 1,
                  period_type:     p.period_type ?? 1,
                  remarks:         p.remarks,
                }),
              );
            }
            this.setClosedState(Number(d.is_closed ?? 0) === 1);
          }
        },
        error: () => this.toastr.error('Failed to get financial year details'),
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    this.isSaving.set(true);
    const val      = this.form.getRawValue();
    const yearNo   = this.selectedYearNo();
    const isUpdate = !!yearNo;
    const payload  = {
      fin_year_no:   yearNo,
      fin_year_id:   val.fin_year_id || null,  // null → backend auto-generates
      fin_year_name: val.fin_year_name,
      branch_nos:    val.branch_nos ?? [],   // empty = all branches (one NULL record)
      start_date:    val.start_date,
      end_date:      val.end_date,
      is_closed:     val.is_closed ?? 0,
      remarks:       val.remarks || null,
      is_active:     1,
      periods: (val.periods as Record<string, unknown>[]).map((p) => ({
        fin_period_no:   p['fin_period_no'] || null,
        fin_period_id:   p['fin_period_id'],
        fin_period_name: p['fin_period_name'],
        start_date:      p['start_date'],
        end_date:        p['end_date'],
        period_status:   p['period_status'] ?? 1,
        period_type:     p['period_type'] ?? 1,
        remarks:         p['remarks'] || null,
      })),
    };

    // Backend uses POST for upsert (insert if fin_year_no is null, update otherwise)
    this.data
      .saveFinancialYear(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Financial Year updated' : 'Financial Year created');
            this.loadFinancialYears(isUpdate ? this.lastSelectedIndex : 0);
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: () => this.toastr.error('API error during save'),
      });
  }

  onDelete(callback?: () => void): void {
    const yearNo = this.selectedYearNo();
    if (!yearNo) return;

    this.data.deleteFinancialYear(yearNo).subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Financial Year deleted');
            this.loadFinancialYears();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: () => this.toastr.error('API error during delete'),
      });
  }

  onNew(): void {
    this.selectedYearNo.set(null);
    this.setClosedState(false);
    this.periodsFormArray?.clear();
    this.form?.reset({
      is_closed:  0,
      branch_nos: this.currentBranchNo != null ? [this.currentBranchNo] : [],
    });
  }

  /** Called by component for the Close FY action */
  closeFiscalYear(): void {
    this.form.patchValue({ is_closed: 1 });
    this.onSave();
  }
}

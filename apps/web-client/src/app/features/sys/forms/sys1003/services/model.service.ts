import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Sys1003DataService } from './data.service';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface FinancialYearPeriod {
  period_no?: number;
  period_code: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
}

export interface FinancialYear {
  fin_year_no: number;
  fin_year_code: string;
  fin_year_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
  is_current: boolean;
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

  // ─── State ─────────────────────────────────────────────────────────────────
  financialYears    = signal<FinancialYear[]>([]);
  branches          = signal<any[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedYearNo    = signal<number | null>(null);
  lastSelectedIndex = 0;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredYears = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.financialYears().filter(
      (y) =>
        y.fin_year_name.toLowerCase().includes(term) ||
        y.fin_year_code.toLowerCase().includes(term),
    );
  });

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  get periodsFormArray(): FormArray {
    return this.form.get('periods') as FormArray;
  }

  initForm(): void {
    this.form = this.fb.group({
      fin_year_no:  [null],
      fin_year_code: ['', [Validators.required, Validators.maxLength(20)]],
      fin_year_name: ['', [Validators.required]],
      branch_nos:   [[], [Validators.required]],
      start_date:   ['', [Validators.required]],
      end_date:     ['', [Validators.required]],
      status:       ['Open', [Validators.required]],
      is_current:   [false],
      periods:      this.fb.array([]),
    });
  }

  addPeriodRow(period?: FinancialYearPeriod): void {
    const group = this.fb.group({
      period_no:   [period?.period_no ?? null],
      period_code: [period?.period_code ?? '', Validators.required],
      period_name: [period?.period_name ?? '', Validators.required],
      start_date:  [period?.start_date ?? '', Validators.required],
      end_date:    [period?.end_date ?? '', Validators.required],
      status:      [period?.status ?? 'Open', Validators.required],
    });
    this.periodsFormArray.push(group);
  }

  autoGeneratePeriods(): void {
    const startDateStr = this.form.get('start_date')?.value;
    const endDateStr   = this.form.get('end_date')?.value;

    if (!startDateStr || !endDateStr) {
      this.toastr.warning('Please select start and end dates first.');
      return;
    }

    const start = new Date(startDateStr);
    const end   = new Date(endDateStr);
    this.periodsFormArray.clear();

    for (let i = 0; i < 12; i++) {
      const pStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const pEnd   = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);
      if (pStart > end) break;

      const monthName = pStart.toLocaleString('default', { month: 'long' });
      const year      = pStart.getFullYear();

      this.addPeriodRow({
        period_code: `${monthName.substring(0, 3).toUpperCase()}-${year}`,
        period_name: `${monthName} ${year}`,
        start_date:  pStart.toISOString().split('T')[0],
        end_date:    (pEnd > end ? end : pEnd).toISOString().split('T')[0],
        status:      'Open',
      });
    }
    this.toastr.info('Accounting periods generated.');
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (res.success && res.data) this.branches.set(res.data);
      },
    });
  }

  loadFinancialYears(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadFinancialYears()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
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
    this.isLoading.set(true);

    this.data
      .loadFinancialYearDetail(year.fin_year_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data as any;
            this.periodsFormArray.clear();

            this.form.patchValue({
              fin_year_no:   d.finYearNo,
              fin_year_code: d.finYearCode,
              fin_year_name: d.finYearName,
              branch_nos:    d.branchNos || [],
              start_date:    this.datePipe.transform(d.startDate, 'yyyy-MM-dd'),
              end_date:      this.datePipe.transform(d.endDate, 'yyyy-MM-dd'),
              status:        d.status,
              is_current:    d.isCurrent === 1 || d.isCurrent === true,
            });

            if (d.periods?.length) {
              d.periods.forEach((p: any) =>
                this.addPeriodRow({
                  period_no:   p.periodNo,
                  period_code: p.periodCode,
                  period_name: p.periodName,
                  start_date:  this.datePipe.transform(p.startDate, 'yyyy-MM-dd')!,
                  end_date:    this.datePipe.transform(p.endDate, 'yyyy-MM-dd')!,
                  status:      p.status,
                }),
              );
            }
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
    const val      = this.form.value;
    const isUpdate = !!this.selectedYearNo();

    const payload = {
      fin_year_no:   this.selectedYearNo(),
      fin_year_code: val.fin_year_code,
      fin_year_name: val.fin_year_name,
      branch_nos:    val.branch_nos,
      start_date:    val.start_date,
      end_date:      val.end_date,
      status:        val.status,
      is_current:    val.is_current ? 1 : 0,
      periods:       val.periods.map((p: any) => ({
        period_no:   p.period_no,
        period_code: p.period_code,
        period_name: p.period_name,
        start_date:  p.start_date,
        end_date:    p.end_date,
        status:      p.status,
      })),
    };

    const obs = isUpdate
      ? this.data.updateFinancialYear(payload)
      : this.data.saveFinancialYear(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (res.success) {
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

    this.isLoading.set(true);
    this.data
      .deleteFinancialYear(yearNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
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
    this.periodsFormArray?.clear();
    this.form?.reset({ status: 'Open', is_current: false });
  }

  /** Called by component for the Close FY action */
  closeFiscalYear(): void {
    this.form.patchValue({ status: 'Closed' });
    this.onSave();
  }
}

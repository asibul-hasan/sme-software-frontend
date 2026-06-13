import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Sys1005DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface TaxRule extends BaseEntity {
  vat_tax_no: number;
  tax_code: string;
  tax_name: string;
  tax_type: number;
  rate_percentage: number;
  effective_from: string;
  effective_to?: string;
  gl_account_no?: number;
  authority_name: string;
  branch_no: number;
  remarks: string;
  is_active: number;
  row_version: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * State + form + orchestration service for SYS1005 – VAT / Tax Setup.
 *
 * Responsibilities:
 *  - Reactive signals (tax list, loading flags, selection)
 *  - FormGroup + components FormArray construction and patching
 *  - Orchestration of Sys1005DataService calls (load, save, delete)
 *  - UI helpers: composite rate calculation, drag-drop resequencing
 *
 * HTTP endpoint paths live in Sys1005DataService.
 */
@Injectable()
export class Sys1005ModelService {
  private fb       = inject(FormBuilder);
  private data     = inject(Sys1005DataService);
  private toastr   = inject(ToastrService);
  private datePipe = inject(DatePipe);
  private authCtx  = inject(AuthContextService);

  /** Current logged-in branch — the default branch assignment on New. */
  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  // ─── State ─────────────────────────────────────────────────────────────────
  taxRules          = signal<TaxRule[]>([]);
  branches          = signal<IBranch[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedTaxNo     = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection     = signal<SortDirection>('');

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredTaxRules = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.taxRules()
      .filter(
        (t) =>
          t.tax_name.toLowerCase().includes(term) ||
          t.tax_code.toLowerCase().includes(term),
      );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.tax_code || '').localeCompare(b.tax_code || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator(this.filteredTaxRules);

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      vat_tax_no:      [null],
      tax_code:        ['', [Validators.required, Validators.maxLength(20)]],
      tax_name:        ['', [Validators.required]],
      tax_type:        [1, [Validators.required]],
      rate_percentage: [0, [Validators.required, Validators.min(0)]],
      effective_from:  [new Date().toISOString().split('T')[0], [Validators.required]],
      effective_to:    [null],
      gl_account_no:   [null],
      authority_name:  [''],
      branch_nos:      [[] as number[]],   // multi-branch; empty = all branches
      remarks:         [''],
      is_active:       [1],
    }, {
      validators: [CustomValidators.minMax('effective_from', 'effective_to')]
    });
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.branches.set(res.data);
      },
    });
  }

  loadTaxRules(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data
      .loadTaxRules()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.taxRules.set(res.data);
            if (res.data.length > 0) {
              const index =
                reselectIndex !== undefined && reselectIndex < res.data.length
                  ? reselectIndex
                  : 0;
              this.selectTax(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: () => this.toastr.error('Failed to load tax rules'),
      });
  }

  selectTax(tax: TaxRule, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedTaxNo.set(tax.vat_tax_no);
    this.isLoading.set(true);

    this.data
      .loadTaxDetail(tax.vat_tax_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;

            this.form.patchValue({
              vat_tax_no:     d['vat_tax_no'],
              tax_code:       d['tax_code'],
              tax_name:       d['tax_name'],
              tax_type:       d['tax_type'],
              rate_percentage:d['rate_percentage'],
              effective_from: this.datePipe.transform(d['effective_from'] as string | number | Date, 'yyyy-MM-dd'),
              effective_to:   this.datePipe.transform(d['effective_to'] as string | number | Date, 'yyyy-MM-dd'),
              gl_account_no:  d['gl_account_no'],
              authority_name: d['authority_name'],
              branch_nos:     d['branch_no'] != null ? [d['branch_no']] : [],
              remarks:        d['remarks'],
              is_active:      d['is_active'],
            });
          }
        },
        error: () => this.toastr.error('Failed to load tax rule details'),
      });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }

    this.isSaving.set(true);
    const val      = this.form.getRawValue();
    const isUpdate = !!this.selectedTaxNo();

    const payload = {
      vat_tax_no:     val.vat_tax_no,
      tax_code:       val.tax_code,
      tax_name:       val.tax_name,
      tax_type:       val.tax_type,
      rate_percentage: val.rate_percentage,
      effective_from: val.effective_from,
      effective_to:   val.effective_to,
      gl_account_no:  val.gl_account_no,
      authority_name: val.authority_name,
      branch_nos:     val.branch_nos ?? [],   // empty = all branches (one NULL record)
      remarks:        val.remarks,
      is_active:      val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateTaxRule(this.selectedTaxNo()!, payload)
      : this.data.saveTaxRule(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Tax updated' : 'Tax created');
          this.loadTaxRules(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const taxNo = this.selectedTaxNo();
    if (!taxNo) return;

    this.isLoading.set(true);
    this.data
      .deleteTaxRule(taxNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Tax rule deleted');
            this.loadTaxRules();
            if (callback) callback();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: () => this.toastr.error('Server error during delete'),
      });
  }

  onNew(): void {
    this.selectedTaxNo.set(null);
    this.form?.reset({
      tax_type:        1,
      rate_percentage: 0,
      is_active:       1,
      effective_from:  new Date().toISOString().split('T')[0],
      branch_nos:      this.currentBranchNo != null ? [this.currentBranchNo] : [],
    });
  }
}

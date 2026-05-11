import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { Sys1005DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { CustomValidators } from '../../../../../core/validators/custom-validators';
import { makePaginator } from '../../../../../core/utils/paginator';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface TaxComponent extends BaseEntity {
  child_tax_no: number;
  child_tax_code: string;
  child_tax_name: string;
  tax_rate: number;
  sequence: number;
}

export interface TaxRule extends BaseEntity {
  tax_no: number;
  tax_code: string;
  tax_name: string;
  tax_type: string;
  tax_rate: number;
  is_compound: boolean;
  applies_to_sales: boolean;
  applies_to_purchase: boolean;
  is_inclusive: boolean;
  is_default: boolean;
  tax_authority: string;
  reporting_code: string;
  effective_from: string;
  effective_to?: string;
  status: string;
  branch_nos: number[];
  components: TaxComponent[];
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

  // ─── State ─────────────────────────────────────────────────────────────────
  taxRules          = signal<TaxRule[]>([]);
  branches          = signal<IBranch[]>([]);
  accounts          = signal<Record<string, unknown>[]>([]); // GL Accounts — reserved for future mapping
  allTaxes          = signal<TaxRule[]>([]); // For composite child selection
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedTaxNo     = signal<number | null>(null);
  lastSelectedIndex = 0;

  // ─── Derived State ──────────────────────────────────────────────────────────
  filteredTaxRules = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.taxRules().filter(
      (t) =>
        t.tax_name.toLowerCase().includes(term) ||
        t.tax_code.toLowerCase().includes(term),
    );
  });

  // Pagination over the filtered list (see core/utils/paginator).
  pager = makePaginator(this.filteredTaxRules);

  // ─── Form ───────────────────────────────────────────────────────────────────
  form!: FormGroup;

  get componentsFormArray(): FormArray {
    return this.form.get('components') as FormArray;
  }

  initForm(): void {
    this.form = this.fb.group({
      tax_no:              [null],
      tax_code:            ['', [Validators.required, Validators.maxLength(20)]],
      tax_name:            ['', [Validators.required]],
      tax_type:            ['VAT', [Validators.required]],
      tax_rate:            [0, [Validators.required, Validators.min(0)]],
      is_compound:         [false],
      applies_to_sales:    [true],
      applies_to_purchase: [false],
      is_inclusive:        [false],
      is_default:          [false],
      tax_authority:       [''],
      reporting_code:      [''],
      effective_from:      [new Date().toISOString().split('T')[0], [Validators.required]],
      effective_to:        [null],
      status:              ['Active', [Validators.required]],
      branch_nos:          [[], [Validators.required]],
      components:          this.fb.array([]),
    }, {
      validators: [CustomValidators.minMax('effective_from', 'effective_to')]
    });
  }

  // ─── FormArray Helpers ───────────────────────────────────────────────────────
  addComponentRow(comp?: Partial<TaxComponent> | Partial<TaxRule>): void {
    const c = comp as Record<string, unknown>;
    const group = this.fb.group({
      child_tax_no:   [c['childTaxNo'] ?? c['tax_no'] ?? null, Validators.required],
      child_tax_code: [{ value: c['childTaxCode'] ?? c['tax_code'] ?? '', disabled: true }],
      child_tax_name: [{ value: c['childTaxName'] ?? c['tax_name'] ?? '', disabled: true }],
      tax_rate:       [{ value: c['taxRate'] ?? c['tax_rate'] ?? 0, disabled: true }],
      sequence:       [c['sequence'] ?? this.componentsFormArray.length + 1],
    });
    this.componentsFormArray.push(group);
    this.updateCompositeRate();
  }

  removeComponent(index: number): void {
    this.componentsFormArray.removeAt(index);
    this.updateSequences();
    this.updateCompositeRate();
  }

  dropComponent(event: CdkDragDrop<FormGroup[]>): void {
    moveItemInArray(this.componentsFormArray.controls, event.previousIndex, event.currentIndex);
    this.updateSequences();
  }

  onChildTaxSelect(tax: TaxRule): void {
    const exists = this.componentsFormArray.value.some(
      (c: TaxComponent) => c.child_tax_no === tax.tax_no,
    );
    if (exists) {
      this.toastr.warning('This tax is already added as a component.');
      return;
    }
    this.addComponentRow(tax);
  }

  private updateSequences(): void {
    this.componentsFormArray.controls.forEach((ctrl, i) =>
      ctrl.get('sequence')?.setValue(i + 1),
    );
  }

  updateCompositeRate(): void {
    if (this.form.get('tax_type')?.value === 'COMPOSITE') {
      const total = this.componentsFormArray.controls.reduce(
        (sum, ctrl) => sum + (ctrl.get('tax_rate')?.value || 0),
        0,
      );
      this.form.get('tax_rate')?.setValue(total, { emitEvent: false });
    }
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  loadBranches(): void {
    this.data.loadBranches().subscribe({
      next: (res) => {
        if (isSuccess(res)) this.branches.set(res.data);
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
            this.allTaxes.set(res.data);
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
    this.selectedTaxNo.set(tax.tax_no);
    this.isLoading.set(true);

    this.data
      .loadTaxDetail(tax.tax_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const d = res.data as unknown as Record<string, unknown>;
            this.componentsFormArray.clear();

            this.form.patchValue({
              tax_no:              d['taxNo'] ?? d['tax_no'],
              tax_code:            d['taxCode'] ?? d['tax_code'],
              tax_name:            d['taxName'] ?? d['tax_name'],
              tax_type:            d['taxType'] ?? d['tax_type'],
              tax_rate:            d['taxRate'] ?? d['tax_rate'],
              is_compound:         d['isCompound'] === 1 || d['isCompound'] === true,
              applies_to_sales:    d['appliesToSales'] === 1 || d['appliesToSales'] === true,
              applies_to_purchase: d['appliesToPurchase'] === 1 || d['appliesToPurchase'] === true,
              is_inclusive:        d['isInclusive'] === 1 || d['isInclusive'] === true,
              is_default:          d['isDefault'] === 1 || d['isDefault'] === true,
              tax_authority:       d['taxAuthority'] ?? d['tax_authority'],
              reporting_code:      d['reportingCode'] ?? d['reporting_code'],
              effective_from:      this.datePipe.transform((d['effectiveFrom'] ?? d['effective_from']) as string | number | Date, 'yyyy-MM-dd'),
              effective_to:        this.datePipe.transform((d['effectiveTo'] ?? d['effective_to']) as string | number | Date, 'yyyy-MM-dd'),
              status:              d['status'],
              branch_nos:          (d['branchNos'] ?? d['branch_nos'] ?? []) as number[],
            });

            const components = d['components'] as TaxComponent[];
            if (components) {
              components.forEach((c: TaxComponent) => this.addComponentRow(c));
            }
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
      ...val,
      is_compound:         val.is_compound ? 1 : 0,
      applies_to_sales:    val.applies_to_sales ? 1 : 0,
      applies_to_purchase: val.applies_to_purchase ? 1 : 0,
      is_inclusive:        val.is_inclusive ? 1 : 0,
      is_default:          val.is_default ? 1 : 0,
      components:          val.tax_type === 'COMPOSITE' ? val.components : [],
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
    this.componentsFormArray?.clear();
    this.form?.reset({
      tax_type:            'VAT',
      tax_rate:            0,
      is_compound:         false,
      applies_to_sales:    true,
      applies_to_purchase: false,
      is_inclusive:        false,
      is_default:          false,
      status:              'Active',
      effective_from:      new Date().toISOString().split('T')[0],
      branch_nos:          [],
    });
  }
}

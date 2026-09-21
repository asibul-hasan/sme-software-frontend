import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { Hrm1009DataService } from './data.service';

export interface TaxSlabLine {
  tax_slab_no?: number;
  slab_order: number;
  from_amount: number | null;
  to_amount?: number | null;
  rate_percent: number | null;
  fixed_amount?: number | null;
  is_active?: number | null;
  row_version?: number | null;
}

export interface TaxSlabProfile extends BaseEntity {
  tax_slab_no: number;
  country_code: string;
  fiscal_year: string;
  taxpayer_class: string;
  slab_count?: number | null;
  slabs?: TaxSlabLine[];
  is_active: number;
  row_version: number;
}

@Injectable()
export class Hrm1009ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Hrm1009DataService);
  private toastr = inject(ToastrService);

  profiles = signal<TaxSlabProfile[]>([]);
  slabs = signal<TaxSlabLine[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedTaxSlabNo = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  filteredProfiles = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.profiles().filter((profile) =>
      profile.fiscal_year.toLowerCase().includes(term) ||
      profile.taxpayer_class.toLowerCase().includes(term) ||
      profile.country_code.toLowerCase().includes(term),
    );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => a.fiscal_year.localeCompare(b.fiscal_year));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filteredProfiles);
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      tax_slab_no: [null],
      country_code: ['', [Validators.maxLength(2)]],
      fiscal_year: [this.defaultFiscalYear(), [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)]],
      taxpayer_class: ['GENERAL', [Validators.required, Validators.maxLength(30)]],
      is_active: [1],
    });
  }

  loadProfiles(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data.loadProfiles().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.profiles.set(res.data);
          if (res.data.length > 0) {
            const index = reselectIndex !== undefined && reselectIndex < res.data.length ? reselectIndex : 0;
            this.selectProfile(res.data[index], index);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load tax slab profiles'),
    });
  }

  selectProfile(profile: TaxSlabProfile, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedTaxSlabNo.set(profile.tax_slab_no);
    this.isLoading.set(true);
    this.data.loadProfileDetail(profile.tax_slab_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            tax_slab_no: d['tax_slab_no'],
            country_code: d['country_code'] ?? '',
            fiscal_year: d['fiscal_year'] ?? this.defaultFiscalYear(),
            taxpayer_class: d['taxpayer_class'] ?? 'GENERAL',
            is_active: d['is_active'] ?? 1,
          });
          this.slabs.set(((d['slabs'] as TaxSlabLine[] | undefined) ?? []).map((row) => ({
            ...row,
            fixed_amount: row.fixed_amount ?? 0,
          })));
        }
      },
      error: () => this.toastr.error('Failed to load tax slab profile'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    if (!this.validateSlabs()) return;

    this.isSaving.set(true);
    const value = this.form.getRawValue();
    const isUpdate = !!this.selectedTaxSlabNo();

    const payload = {
      tax_slab_no: value.tax_slab_no,
      country_code: String(value.country_code || '').toUpperCase().trim(),
      fiscal_year: String(value.fiscal_year || '').trim(),
      taxpayer_class: String(value.taxpayer_class || '').toUpperCase().trim(),
      is_active: value.is_active ? 1 : 0,
      slabs: this.normalizedSlabs(),
    };

    const obs = isUpdate
      ? this.data.updateProfile(this.selectedTaxSlabNo()!, payload)
      : this.data.saveProfile(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Tax slab profile updated' : 'Tax slab profile created');
          this.loadProfiles(isUpdate ? this.lastSelectedIndex : 0);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const taxSlabNo = this.selectedTaxSlabNo();
    if (!taxSlabNo) return;

    this.isLoading.set(true);
    this.data.deleteProfile(taxSlabNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Tax slab profile deleted');
          this.loadProfiles();
          callback?.();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedTaxSlabNo.set(null);
    this.form?.reset({
      country_code: '',
      fiscal_year: this.defaultFiscalYear(),
      taxpayer_class: 'GENERAL',
      is_active: 1,
    });
    this.slabs.set([this.createSlabRow(1, 0)]);
  }

  addSlab(): void {
    this.slabs.update((rows) => {
      const nextOrder = rows.length + 1;
      const previousTo = rows[rows.length - 1]?.to_amount;
      return [...rows, this.createSlabRow(nextOrder, previousTo ?? 0)];
    });
  }

  removeSlab(index: number): void {
    this.slabs.update((rows) => rows
      .filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({ ...row, slab_order: rowIndex + 1 })));
  }

  updateSlab(index: number, field: keyof TaxSlabLine, value: string | number | null): void {
    this.slabs.update((rows) =>
      rows.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        return {
          ...row,
          [field]: field === 'from_amount' || field === 'to_amount' || field === 'rate_percent' || field === 'fixed_amount' || field === 'slab_order'
            ? this.toNumberOrNull(value)
            : value,
        };
      }),
    );
  }

  private normalizedSlabs(): TaxSlabLine[] {
    return this.slabs()
      .map((row, index) => ({
        tax_slab_no: row.tax_slab_no,
        slab_order: Number(row.slab_order || index + 1),
        from_amount: this.toNumberOrNull(row.from_amount),
        to_amount: this.toNumberOrNull(row.to_amount),
        rate_percent: this.toNumberOrNull(row.rate_percent),
        fixed_amount: this.toNumberOrNull(row.fixed_amount) ?? 0,
        is_active: row.is_active ?? 1,
        row_version: row.row_version ?? null,
      }));
  }

  private validateSlabs(): boolean {
    const slabs = [...this.normalizedSlabs()].sort((a, b) => a.slab_order - b.slab_order);
    if (slabs.length === 0) {
      this.toastr.warning('At least one tax slab row is required.');
      return false;
    }

    for (let index = 0; index < slabs.length; index++) {
      const slab = slabs[index];
      if (slab.from_amount == null || slab.rate_percent == null) {
        this.toastr.warning(`Slab ${slab.slab_order} needs from amount and rate percent.`);
        return false;
      }
      if (slab.from_amount < 0) {
        this.toastr.warning(`Slab ${slab.slab_order} from amount cannot be negative.`);
        return false;
      }
      if (slab.to_amount != null && slab.to_amount < slab.from_amount) {
        this.toastr.warning(`Slab ${slab.slab_order} to amount cannot be lower than from amount.`);
        return false;
      }
      if (slab.rate_percent < 0 || slab.rate_percent > 100) {
        this.toastr.warning(`Slab ${slab.slab_order} rate percent must be between 0 and 100.`);
        return false;
      }
      if ((slab.fixed_amount ?? 0) < 0) {
        this.toastr.warning(`Slab ${slab.slab_order} fixed amount cannot be negative.`);
        return false;
      }
      if (index === 0 && slab.from_amount !== 0) {
        this.toastr.warning('The first slab must start from 0.');
        return false;
      }
      if (index > 0) {
        const previous = slabs[index - 1];
        if (previous.to_amount == null) {
          this.toastr.warning('Only the last slab can be open ended.');
          return false;
        }
        if (slab.from_amount < previous.to_amount) {
          this.toastr.warning(`Slab ${slab.slab_order} overlaps with the previous slab.`);
          return false;
        }
      }
      if (index < slabs.length - 1 && slab.to_amount == null) {
        this.toastr.warning('Only the last slab can be open ended.');
        return false;
      }
    }
    return true;
  }

  private createSlabRow(order: number, fromAmount: number): TaxSlabLine {
    return {
      slab_order: order,
      from_amount: fromAmount,
      to_amount: null,
      rate_percent: 0,
      fixed_amount: 0,
      is_active: 1,
    };
  }

  private defaultFiscalYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    return `${year}-${year + 1}`;
  }

  private toNumberOrNull(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

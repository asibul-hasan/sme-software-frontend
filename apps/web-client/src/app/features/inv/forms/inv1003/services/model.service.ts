import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1003DataService } from './data.service';

export interface Option {
  value: number;
  label: string;
}

export interface ICategory {
  category_no: number;
  category_id: string;
  category_name: string;
  category_name_nls?: string | null;
  parent_category_no?: number | null;
  parent_category_name?: string | null;
  default_vat_tax_no?: number | null;
  default_vat_tax_label?: string | null;
  depth?: number | null;
  tree_path?: string | null;
  image_path?: string | null;
  order_sl?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Inv1003ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1003DataService);
  private toastr = inject(ToastrService);

  items = signal<ICategory[]>([]);
  parentOptions = signal<Option[]>([]);
  taxOptions = signal<Option[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  /** Parents excluding the currently-edited category (server still guards cycles). */
  availableParents = computed(() =>
    this.parentOptions().filter((p) => p.value !== this.selectedNo()),
  );

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (c) =>
            (c.category_name || '').toLowerCase().includes(term) ||
            (c.category_id || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.category_no ?? 0) - (a.category_no ?? 0));
  });

  pager = makePaginator<ICategory>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      category_no: [null],
      category_id: ['', [Validators.required, Validators.maxLength(30)]],
      category_name: ['', [Validators.required, Validators.maxLength(150)]],
      category_name_nls: [''],
      parent_category_no: [null],
      default_vat_tax_no: [null],
      order_sl: [0],
      is_active: [1, [Validators.required]],
    });
  }

  loadOptions(): void {
    this.data.getParentOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.parentOptions.set(res.data);
    });
    this.data.getTaxOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.taxOptions.set(res.data);
    });
  }

  loadList(reselectNo: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .getList()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.items.set(res.data);
          const resolved = resolvePostReloadSelection(res.data, (c: ICategory) => c.category_no, reselectNo);
          if (resolved) {
            this.select(resolved.item as ICategory);
          } else {
            this.onNew();
          }
        }
      });
  }

  select(item: ICategory): void {
    this.selectedNo.set(item.category_no);
    this.form.patchValue({
      category_no: item.category_no,
      category_id: item.category_id,
      category_name: item.category_name,
      category_name_nls: item.category_name_nls ?? '',
      parent_category_no: item.parent_category_no ?? null,
      default_vat_tax_no: item.default_vat_tax_no ?? null,
      order_sl: item.order_sl ?? 0,
      is_active: item.is_active ?? 1,
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, category_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Category updated' : 'Category created');
            this.loadOptions();
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.category_no ?? null));
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .delete(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Category deleted');
            this.loadOptions();
            this.loadList();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form.reset({ order_sl: 0, is_active: 1 });
  }
}

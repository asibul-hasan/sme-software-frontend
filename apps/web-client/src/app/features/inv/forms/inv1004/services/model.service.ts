import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1004DataService } from './data.service';

export interface IBrand {
  brand_no: number;
  brand_id: string;
  brand_name: string;
  brand_name_nls?: string | null;
  manufacturer?: string | null;
  image_path?: string | null;
  remarks?: string | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Inv1004ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1004DataService);
  private toastr = inject(ToastrService);

  items = signal<IBrand[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (b) =>
            (b.brand_name || '').toLowerCase().includes(term) ||
            (b.brand_id || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.brand_no ?? 0) - (a.brand_no ?? 0));
  });

  pager = makePaginator<IBrand>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      brand_no: [null],
      brand_id: ['', [Validators.required, Validators.maxLength(30)]],
      brand_name: ['', [Validators.required, Validators.maxLength(150)]],
      brand_name_nls: [''],
      manufacturer: [''],
      is_active: [1, [Validators.required]],
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
          const resolved = resolvePostReloadSelection(res.data, (b: IBrand) => b.brand_no, reselectNo);
          if (resolved) {
            this.select(resolved.item as IBrand);
          } else {
            this.onNew();
          }
        }
      });
  }

  select(item: IBrand): void {
    this.selectedNo.set(item.brand_no);
    this.form.patchValue({
      brand_no: item.brand_no,
      brand_id: item.brand_id,
      brand_name: item.brand_name,
      brand_name_nls: item.brand_name_nls ?? '',
      manufacturer: item.manufacturer ?? '',
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
      .save({ ...val, brand_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Brand updated' : 'Brand created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.brand_no ?? null));
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
            this.toastr.success('Brand deleted');
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
    this.form.reset({ is_active: 1 });
  }
}

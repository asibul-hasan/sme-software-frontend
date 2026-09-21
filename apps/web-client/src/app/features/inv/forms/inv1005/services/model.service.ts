import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1005DataService } from './data.service';

export interface IUom {
  uom_no: number;
  uom_id: string;
  uom_name: string;
  uom_name_nls?: string | null;
  uom_type: number;
  decimal_places?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Inv1005ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1005DataService);
  private toastr = inject(ToastrService);

  items = signal<IUom[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  readonly uomTypes = [
    { value: 1, label: 'Count (whole units)' },
    { value: 2, label: 'Weight' },
    { value: 3, label: 'Volume' },
    { value: 4, label: 'Length' },
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (u) =>
            (u.uom_name || '').toLowerCase().includes(term) ||
            (u.uom_id || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.uom_no ?? 0) - (a.uom_no ?? 0));
  });

  pager = makePaginator<IUom>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      uom_no: [null],
      uom_id: ['', [Validators.required, Validators.maxLength(20)]],
      uom_name: ['', [Validators.required, Validators.maxLength(50)]],
      uom_name_nls: [''],
      uom_type: [1, [Validators.required]],
      decimal_places: [0, [Validators.required, Validators.min(0), Validators.max(4)]],
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
          const resolved = resolvePostReloadSelection(res.data, (u: IUom) => u.uom_no, reselectNo);
          if (resolved) {
            this.select(resolved.item as IUom);
          } else {
            this.onNew();
          }
        }
      });
  }

  select(item: IUom): void {
    this.selectedNo.set(item.uom_no);
    this.form.patchValue({
      uom_no: item.uom_no,
      uom_id: item.uom_id,
      uom_name: item.uom_name,
      uom_name_nls: item.uom_name_nls ?? '',
      uom_type: item.uom_type ?? 1,
      decimal_places: item.decimal_places ?? 0,
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
      .save({ ...val, uom_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'UOM updated' : 'UOM created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.uom_no ?? null));
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
            this.toastr.success('UOM deleted');
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
    this.form.reset({ uom_type: 1, decimal_places: 0, is_active: 1 });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1006DataService } from './data.service';

export interface IAttributeValue {
  attribute_value_no?: number | null;
  value_code: string;
  value_name: string;
  order_sl?: number | null;
  is_active?: number | null;
  row_version?: number;
}

export interface IAttribute {
  attribute_no: number;
  attribute_id: string;
  attribute_name: string;
  order_sl?: number | null;
  is_active: number;
  row_version?: number;
  values: IAttributeValue[];
}

@Injectable()
export class Inv1006ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1006DataService);
  private toastr = inject(ToastrService);

  items = signal<IAttribute[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter(
      (a) =>
        (a.attribute_name || '').toLowerCase().includes(term) ||
        (a.attribute_id || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<IAttribute>(this.filtered);

  get values(): FormArray {
    return this.form.get('values') as FormArray;
  }

  initForm(): void {
    this.form = this.fb.group({
      attribute_no: [null],
      attribute_id: ['', [Validators.required, Validators.maxLength(30)]],
      attribute_name: ['', [Validators.required, Validators.maxLength(60)]],
      order_sl: [0],
      is_active: [1, [Validators.required]],
      values: this.fb.array([]),
    });
  }

  private valueGroup(v?: IAttributeValue): FormGroup {
    return this.fb.group({
      attribute_value_no: [v?.attribute_value_no ?? null],
      value_code: [v?.value_code ?? '', [Validators.required, Validators.maxLength(30)]],
      value_name: [v?.value_name ?? '', [Validators.required, Validators.maxLength(60)]],
      order_sl: [v?.order_sl ?? 0],
      is_active: [v?.is_active ?? 1],
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
          const resolved = resolvePostReloadSelection(res.data, (a: IAttribute) => a.attribute_no, reselectNo);
          resolved ? this.select(resolved.item as IAttribute) : this.onNew();
        }
      });
  }

  select(item: IAttribute): void {
    this.selectedNo.set(item.attribute_no);
    this.values.clear();
    (item.values || []).forEach((v) => this.values.push(this.valueGroup(v)));
    this.form.patchValue({
      attribute_no: item.attribute_no,
      attribute_id: item.attribute_id,
      attribute_name: item.attribute_name,
      order_sl: item.order_sl ?? 0,
      is_active: item.is_active ?? 1,
    });
  }

  addValue(): void {
    this.values.push(this.valueGroup());
  }

  removeValue(index: number): void {
    this.values.removeAt(index);
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
      .save({ ...val, attribute_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Attribute updated' : 'Attribute created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.attribute_no ?? null));
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
            this.toastr.success('Attribute deleted');
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
    this.values.clear();
    this.form.reset({ order_sl: 0, is_active: 1 });
  }
}

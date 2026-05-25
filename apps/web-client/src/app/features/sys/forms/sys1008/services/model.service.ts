import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Sys1008DataService } from './data.service';

export interface ISetting {
  setting_no: number;
  setting_key: string;
  setting_value: string;
  value_type?: number | null;   // 1=String,2=Number,3=Boolean,4=JSON,5=Date
  setting_group?: string | null;
  description?: string | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Sys1008ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1008DataService);
  private toastr = inject(ToastrService);

  items = signal<ISetting[]>([]);
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
      (s) =>
        (s.setting_key || '').toLowerCase().includes(term) ||
        (s.setting_group || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<ISetting>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      setting_no: [null],
      setting_key: ['', [Validators.required, Validators.maxLength(80)]],
      setting_value: ['', [Validators.required, Validators.maxLength(500)]],
      value_type: [1],
      setting_group: [''],
      description: [''],
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
          const resolved = resolvePostReloadSelection(res.data, (s: ISetting) => s.setting_no, reselectNo);
          resolved ? this.select(resolved.item as ISetting) : this.onNew();
        }
      });
  }

  select(item: ISetting): void {
    this.selectedNo.set(item.setting_no);
    this.form.patchValue({
      setting_no: item.setting_no,
      setting_key: item.setting_key,
      setting_value: item.setting_value,
      value_type: item.value_type ?? 1,
      setting_group: item.setting_group ?? '',
      description: item.description ?? '',
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
      .save({ ...val, setting_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Setting updated' : 'Setting created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.setting_no ?? null));
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
            this.toastr.success('Setting deleted');
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
    this.form.reset({ is_active: 1, value_type: 1 });
  }
}

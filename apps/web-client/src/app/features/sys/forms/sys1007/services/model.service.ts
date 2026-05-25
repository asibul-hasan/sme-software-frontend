import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Sys1007DataService } from './data.service';

export interface ICostCenter {
  cost_center_no: number;
  cost_center_id: string;
  cost_center_name: string;
  branch_no?: number | null;
  parent_cost_center_no?: number | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Sys1007ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Sys1007DataService);
  private toastr = inject(ToastrService);

  items = signal<ICostCenter[]>([]);
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
      (c) =>
        (c.cost_center_name || '').toLowerCase().includes(term) ||
        (c.cost_center_id || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<ICostCenter>(this.filtered);

  parentOptions = computed(() =>
    this.items().filter((c) => c.cost_center_no !== this.selectedNo()),
  );

  initForm(): void {
    this.form = this.fb.group({
      cost_center_no: [null],
      cost_center_id: ['', [Validators.required, Validators.maxLength(20)]],
      cost_center_name: ['', [Validators.required, Validators.maxLength(150)]],
      parent_cost_center_no: [null],
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
          const resolved = resolvePostReloadSelection(res.data, (c: ICostCenter) => c.cost_center_no, reselectNo);
          resolved ? this.select(resolved.item as ICostCenter) : this.onNew();
        }
      });
  }

  select(item: ICostCenter): void {
    this.selectedNo.set(item.cost_center_no);
    this.form.patchValue({
      cost_center_no: item.cost_center_no,
      cost_center_id: item.cost_center_id,
      cost_center_name: item.cost_center_name,
      parent_cost_center_no: item.parent_cost_center_no ?? null,
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
      .save({ ...val, cost_center_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Cost center updated' : 'Cost center created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.cost_center_no ?? null));
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
            this.toastr.success('Cost center deleted');
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

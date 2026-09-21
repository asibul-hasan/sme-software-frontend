import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv2001DataService } from './data.service';

export interface IWarehouse {
  warehouse_no: number;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_name_nls?: string | null;
  warehouse_type: number;
  address?: string | null;
  manager_employee_no?: number | null;
  is_default: number;
  allow_negative_stock: number;
  is_sale_point: number;
  remarks?: string | null;
  is_active: number;
  row_version?: number;
}

@Injectable()
export class Inv2001ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv2001DataService);
  private toastr = inject(ToastrService);

  items = signal<IWarehouse[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  form!: FormGroup;

  readonly warehouseTypes = [
    { value: 1, label: 'Main Store' },
    { value: 2, label: 'Sales Floor / Outlet' },
    { value: 3, label: 'Transit (virtual)' },
    { value: 4, label: 'Damage / Quarantine' },
    { value: 5, label: 'Returns' },
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (w) =>
            (w.warehouse_name || '').toLowerCase().includes(term) ||
            (w.warehouse_id || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.warehouse_no ?? 0) - (a.warehouse_no ?? 0));
  });

  pager = makePaginator<IWarehouse>(this.filtered);

  initForm(): void {
    this.form = this.fb.group({
      warehouse_no: [null],
      warehouse_id: ['', [Validators.required, Validators.maxLength(30)]],
      warehouse_name: ['', [Validators.required, Validators.maxLength(150)]],
      warehouse_name_nls: [''],
      warehouse_type: [1, [Validators.required]],
      address: [''],
      manager_employee_no: [null],
      is_default: [0, [Validators.required]],
      allow_negative_stock: [0, [Validators.required]],
      is_sale_point: [1, [Validators.required]],
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
          const resolved = resolvePostReloadSelection(res.data, (w: IWarehouse) => w.warehouse_no, reselectNo);
          if (resolved) {
            this.select(resolved.item as IWarehouse);
          } else {
            this.onNew();
          }
        }
      });
  }

  select(item: IWarehouse): void {
    this.selectedNo.set(item.warehouse_no);
    this.form.patchValue({
      warehouse_no: item.warehouse_no,
      warehouse_id: item.warehouse_id,
      warehouse_name: item.warehouse_name,
      warehouse_name_nls: item.warehouse_name_nls ?? '',
      warehouse_type: item.warehouse_type ?? 1,
      address: item.address ?? '',
      manager_employee_no: item.manager_employee_no ?? null,
      is_default: item.is_default ?? 0,
      allow_negative_stock: item.allow_negative_stock ?? 0,
      is_sale_point: item.is_sale_point ?? 1,
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
      .save({ ...val, warehouse_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Warehouse updated' : 'Warehouse created');
            this.loadList(isUpdate ? this.selectedNo() : (res.data?.warehouse_no ?? null));
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
            this.toastr.success('Warehouse deleted');
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
    this.form.reset({ warehouse_type: 1, is_default: 0, allow_negative_stock: 0, is_sale_point: 1, is_active: 1 });
  }
}

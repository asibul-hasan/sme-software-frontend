import { Injectable, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Inv2005DataService } from './data.service';

export interface Option { value: number; label: string; }

export interface IReorder {
  reorder_no?: number | null;
  product_no: number | null;
  product_name?: string | null;
  variant_no?: number | null;
  reorder_level?: number | null;
  reorder_qty?: number | null;
  min_stock?: number | null;
  max_stock?: number | null;
  preferred_supplier_no?: number | null;
  lead_time_days?: number | null;
  is_active?: number | null;
  row_version?: number;
}

/** View-model for INV_2005 Reorder Level — per-warehouse editable reorder grid. */
@Injectable()
export class Inv2005ModelService {
  private data = inject(Inv2005DataService);
  private toastr = inject(ToastrService);

  warehouses = signal<Option[]>([]);
  products = signal<Option[]>([]);
  rows = signal<IReorder[]>([]);
  selectedWarehouseNo = signal<number | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);

  loadOptions(): void {
    this.data.getWarehouseOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.warehouses.set(res.data);
        const first = res.data[0];
        if (first) this.selectWarehouse(first.value);
      }
    });
    this.data.getProductOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.products.set(res.data);
    });
  }

  selectWarehouse(warehouseNo: number): void {
    this.selectedWarehouseNo.set(warehouseNo);
    this.loadRows();
  }

  loadRows(): void {
    const wh = this.selectedWarehouseNo();
    if (!wh) return;
    this.isLoading.set(true);
    this.data
      .getList(wh)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.rows.set(res.data.map((r) => ({ ...r })));
        else this.rows.set([]);
      });
  }

  addRow(): void {
    this.rows.update((rows) => [
      ...rows,
      { product_no: null, reorder_level: 0, reorder_qty: 0, min_stock: 0, is_active: 1 },
    ]);
  }

  removeRow(index: number): void {
    const row = this.rows()[index];
    if (row?.reorder_no) {
      this.data.delete(row.reorder_no).subscribe({
        next: (res) => {
          if (isSuccess(res)) { this.toastr.success('Reorder rule deleted'); this.loadRows(); }
          else this.toastr.error(res.message || 'Delete failed');
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
    } else {
      this.rows.update((rows) => rows.filter((_, i) => i !== index));
    }
  }

  onSave(): void {
    const wh = this.selectedWarehouseNo();
    if (!wh) { this.toastr.warning('Select a warehouse first.'); return; }
    const rows = this.rows();
    if (rows.some((r) => r.product_no == null)) {
      this.toastr.warning('Every row needs a product.');
      return;
    }
    const keys = rows.map((r) => `${r.product_no}:${r.variant_no ?? 0}`);
    if (new Set(keys).size !== keys.length) {
      this.toastr.warning('A product is listed more than once.');
      return;
    }
    this.isSaving.set(true);
    this.data
      .saveBulk(wh, rows)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            this.toastr.success('Reorder policy saved');
            this.rows.set(res.data.map((r) => ({ ...r })));
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }
}

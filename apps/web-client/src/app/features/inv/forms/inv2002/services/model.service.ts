import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Inv2002DataService } from './data.service';

export interface Option {
  value: number;
  label: string;
}

export interface IRack {
  rack_no: number;
  warehouse_no: number;
  warehouse_name?: string | null;
  rack_id: string;
  rack_name?: string | null;
  aisle?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bin?: string | null;
  is_active: number;
  row_version?: number;
}

/** View-model for INV_2002 Rack/Shelf Setup — bins under a selected warehouse. */
@Injectable()
export class Inv2002ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv2002DataService);
  private toastr = inject(ToastrService);

  warehouses = signal<Option[]>([]);
  racks = signal<IRack[]>([]);
  selectedWarehouseNo = signal<number | null>(null);
  selectedRackNo = signal<number | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      rack_no: [null],
      warehouse_no: [null, [Validators.required]],
      rack_id: ['', [Validators.required, Validators.maxLength(30)]],
      rack_name: [''],
      aisle: [''],
      rack: [''],
      shelf: [''],
      bin: [''],
      is_active: [1, [Validators.required]],
    });
  }

  loadWarehouses(): void {
    this.isLoading.set(true);
    this.data
      .getWarehouseOptions()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) {
          this.warehouses.set(res.data);
          const first = res.data[0];
          if (first) this.selectWarehouse(first.value);
        }
      });
  }

  selectWarehouse(warehouseNo: number): void {
    this.selectedWarehouseNo.set(warehouseNo);
    this.newRack();
    this.loadRacks();
  }

  loadRacks(): void {
    const wh = this.selectedWarehouseNo();
    if (!wh) return;
    this.isLoading.set(true);
    this.data
      .getList(wh)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.racks.set(res.data);
        else this.racks.set([]);
      });
  }

  selectRack(item: IRack): void {
    this.selectedRackNo.set(item.rack_no);
    this.form.patchValue({
      rack_no: item.rack_no,
      warehouse_no: item.warehouse_no,
      rack_id: item.rack_id,
      rack_name: item.rack_name ?? '',
      aisle: item.aisle ?? '',
      rack: item.rack ?? '',
      shelf: item.shelf ?? '',
      bin: item.bin ?? '',
      is_active: item.is_active ?? 1,
    });
  }

  newRack(): void {
    this.selectedRackNo.set(null);
    this.form.reset({ warehouse_no: this.selectedWarehouseNo(), is_active: 1 });
  }

  onSave(): void {
    this.form.patchValue({ warehouse_no: this.selectedWarehouseNo() });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedRackNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, rack_no: this.selectedRackNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Rack updated' : 'Rack created');
            this.newRack();
            this.loadRacks();
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }

  onDelete(): void {
    const no = this.selectedRackNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data
      .delete(no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Rack deleted');
            this.newRack();
            this.loadRacks();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }
}

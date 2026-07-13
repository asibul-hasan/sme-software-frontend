import { Injectable, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { Inv1002DataService } from './data.service';
import { invConstants } from '../../../constants/inv.constants';

export interface Lookup { value: number; label: string; }
export interface Lookups { products: Lookup[]; uoms: Lookup[]; }

export interface IBarcode {
  barcode_no: number;
  product_no: number;
  product_name?: string | null;
  variant_no?: number | null;
  barcode: string;
  uom_no: number;
  uom_name?: string | null;
  pack_qty?: number | null;
  barcode_type?: number | null;
  is_primary?: number | null;
  is_active?: number | null;
  row_version?: number;
}

@Injectable()
export class Inv1002ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1002DataService);
  private toastr = inject(ToastrService);

  products = signal<Lookup[]>([]);
  uoms = signal<Lookup[]>([]);
  barcodes = signal<IBarcode[]>([]);
  selectedProductNo = signal<number | null>(null);
  selectedBarcodeNo = signal<number | null>(null);
  isLoading = signal(false);
  isSaving = signal(false);
  form!: FormGroup;

  readonly barcodeTypes = invConstants.barcodeTypes;

  initForm(): void {
    this.form = this.fb.group({
      barcode_no: [null],
      barcode: ['', [Validators.required, Validators.maxLength(64)]],
      uom_no: [null, [Validators.required]],
      pack_qty: [1, [Validators.required, Validators.min(0.0001)]],
      barcode_type: [1, [Validators.required]],
      is_primary: [0, [Validators.required]],
      is_active: [1, [Validators.required]],
    });
  }

  loadLookups(): void {
    this.data.getLookups().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.products.set(res.data.products);
        this.uoms.set(res.data.uoms);
      }
    });
  }

  selectProduct(productNo: number): void {
    this.selectedProductNo.set(productNo);
    this.newBarcode();
    this.loadBarcodes();
  }

  loadBarcodes(): void {
    const p = this.selectedProductNo();
    if (!p) return;
    this.isLoading.set(true);
    this.data
      .getBarcodes(p)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.barcodes.set(res.data);
        else this.barcodes.set([]);
      });
  }

  selectBarcode(item: IBarcode): void {
    this.selectedBarcodeNo.set(item.barcode_no);
    this.form.patchValue({
      barcode_no: item.barcode_no,
      barcode: item.barcode,
      uom_no: item.uom_no,
      pack_qty: item.pack_qty ?? 1,
      barcode_type: item.barcode_type ?? 1,
      is_primary: item.is_primary ?? 0,
      is_active: item.is_active ?? 1,
    });
  }

  newBarcode(): void {
    this.selectedBarcodeNo.set(null);
    this.form.reset({ pack_qty: 1, barcode_type: 1, is_primary: 0, is_active: 1 });
  }

  generateCode(): void {
    this.data.nextCode().subscribe((res) => {
      if (isSuccess(res) && res.data) {
        this.form.patchValue({ barcode: res.data.code, barcode_type: 1 });
      }
    });
  }

  onSave(): void {
    const productNo = this.selectedProductNo();
    if (!productNo) { this.toastr.warning('Select a product first.'); return; }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors.');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedBarcodeNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, barcode_no: this.selectedBarcodeNo(), product_no: productNo })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Barcode updated' : 'Barcode created');
            this.newBarcode();
            this.loadBarcodes();
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during save'),
      });
  }

  onDelete(barcodeNo: number): void {
    this.isLoading.set(true);
    this.data
      .delete(barcodeNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success('Barcode deleted');
            this.newBarcode();
            this.loadBarcodes();
          } else {
            this.toastr.error(res.message || 'Delete failed');
          }
        },
        error: (err) => this.toastr.error(err?.error?.message || 'API error during delete'),
      });
  }

  printLabels(): void {
    window.print();
  }
}

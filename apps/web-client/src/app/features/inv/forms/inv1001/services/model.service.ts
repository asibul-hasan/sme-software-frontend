import { Injectable, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1001DataService } from './data.service';

export interface Lookup { value: number; label: string; }
export interface AttributeOption { attribute_no: number; attribute_name: string; values: Lookup[]; }
export interface Lookups {
  categories: Lookup[];
  brands: Lookup[];
  uoms: Lookup[];
  taxes: Lookup[];
  attributes: AttributeOption[];
}

export interface IProduct {
  product_no: number;
  product_id: string;
  product_name: string;
  product_type: number;
  category_no: number;
  category_name?: string | null;
  brand_no?: number | null;
  brand_name?: string | null;
  base_uom_no: number;
  has_variants?: number | null;
  is_active: number;
  has_movements?: boolean;
  variants?: unknown[];
  barcodes?: unknown[];
  uom_conversions?: unknown[];
  [k: string]: unknown;
}

type Tab = 'general' | 'pricing' | 'inventory' | 'variants' | 'barcodes' | 'uom';

@Injectable()
export class Inv1001ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1001DataService);
  private toastr = inject(ToastrService);

  items = signal<IProduct[]>([]);
  lookups = signal<Lookups>({ categories: [], brands: [], uoms: [], taxes: [], attributes: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  hasMovements = signal(false);
  activeTab = signal<Tab>('general');

  // variant-matrix builder selections (up to 3 attributes)
  genAttr1 = signal<number | null>(null);
  genAttr2 = signal<number | null>(null);
  genAttr3 = signal<number | null>(null);

  form!: FormGroup;

  readonly productTypes = [
    { value: 1, label: 'Standard' },
    { value: 2, label: 'Variant Parent' },
    { value: 3, label: 'Service' },
    { value: 4, label: 'Bundle / Kit' },
  ];
  readonly barcodeTypes = [
    { value: 1, label: 'EAN-13' },
    { value: 2, label: 'UPC' },
    { value: 3, label: 'CODE-128' },
    { value: 4, label: 'QR' },
    { value: 5, label: 'Internal' },
  ];

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    if (!term) return data;
    return data.filter(
      (p) =>
        (p.product_name || '').toLowerCase().includes(term) ||
        (p.product_id || '').toLowerCase().includes(term),
    );
  });

  pager = makePaginator<IProduct>(this.filtered);

  get variants(): FormArray { return this.form.get('variants') as FormArray; }
  get barcodes(): FormArray { return this.form.get('barcodes') as FormArray; }
  get uomConversions(): FormArray { return this.form.get('uom_conversions') as FormArray; }

  initForm(): void {
    this.form = this.fb.group({
      product_no: [null],
      product_id: ['', [Validators.required, Validators.maxLength(40)]],
      product_name: ['', [Validators.required, Validators.maxLength(200)]],
      product_name_nls: [''],
      short_name: [''],
      product_type: [1, [Validators.required]],
      category_no: [null, [Validators.required]],
      brand_no: [null],
      base_uom_no: [null, [Validators.required]],
      purchase_uom_no: [null],
      sales_uom_no: [null],
      vat_tax_no: [null],
      is_tax_inclusive: [0],
      hsn_sac_code: [''],
      is_stock_tracked: [1],
      is_batch_tracked: [0],
      is_expiry_tracked: [0],
      is_serial_tracked: [0],
      has_variants: [0],
      shelf_life_days: [null],
      cost_price: [0],
      purchase_price: [0],
      sale_price: [0],
      mrp: [0],
      min_sale_price: [null],
      default_margin_pct: [null],
      reorder_level: [0],
      reorder_qty: [0],
      min_stock: [0],
      max_stock: [null],
      weight_gm: [null],
      barcode: [''],
      is_sellable: [1],
      is_purchasable: [1],
      allow_discount: [1],
      remarks: [''],
      is_active: [1, [Validators.required]],
      variants: this.fb.array([]),
      barcodes: this.fb.array([]),
      uom_conversions: this.fb.array([]),
    });
  }

  loadLookups(): void {
    this.data.getLookups().subscribe((res) => {
      if (isSuccess(res) && res.data) this.lookups.set(res.data);
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
          const resolved = resolvePostReloadSelection(res.data, (p: IProduct) => p.product_no, reselectNo);
          resolved ? this.select(resolved.item as IProduct) : this.onNew();
        }
      });
  }

  select(item: IProduct): void {
    this.selectedNo.set(item.product_no);
    this.activeTab.set('general');
    this.isLoading.set(true);
    this.data
      .getDetail(item.product_no)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.patchProduct(res.data);
      });
  }

  private patchProduct(p: any): void {
    this.hasMovements.set(!!p.has_movements);
    this.variants.clear();
    this.barcodes.clear();
    this.uomConversions.clear();
    (p.variants || []).forEach((v: any) => this.variants.push(this.variantGroup(v)));
    (p.barcodes || []).forEach((b: any) => this.barcodes.push(this.barcodeGroup(b)));
    (p.uom_conversions || []).forEach((c: any) => this.uomConversions.push(this.uomConvGroup(c)));
    this.form.patchValue({
      product_no: p.product_no, product_id: p.product_id, product_name: p.product_name,
      product_name_nls: p.product_name_nls ?? '', short_name: p.short_name ?? '',
      product_type: p.product_type ?? 1, category_no: p.category_no ?? null, brand_no: p.brand_no ?? null,
      base_uom_no: p.base_uom_no ?? null, purchase_uom_no: p.purchase_uom_no ?? null, sales_uom_no: p.sales_uom_no ?? null,
      vat_tax_no: p.vat_tax_no ?? null, is_tax_inclusive: p.is_tax_inclusive ?? 0, hsn_sac_code: p.hsn_sac_code ?? '',
      is_stock_tracked: p.is_stock_tracked ?? 1, is_batch_tracked: p.is_batch_tracked ?? 0,
      is_expiry_tracked: p.is_expiry_tracked ?? 0, is_serial_tracked: p.is_serial_tracked ?? 0,
      has_variants: p.has_variants ?? 0, shelf_life_days: p.shelf_life_days ?? null,
      cost_price: p.cost_price ?? 0, purchase_price: p.purchase_price ?? 0, sale_price: p.sale_price ?? 0,
      mrp: p.mrp ?? 0, min_sale_price: p.min_sale_price ?? null, default_margin_pct: p.default_margin_pct ?? null,
      reorder_level: p.reorder_level ?? 0, reorder_qty: p.reorder_qty ?? 0, min_stock: p.min_stock ?? 0,
      max_stock: p.max_stock ?? null, weight_gm: p.weight_gm ?? null, barcode: p.barcode ?? '',
      is_sellable: p.is_sellable ?? 1, is_purchasable: p.is_purchasable ?? 1, allow_discount: p.allow_discount ?? 1,
      remarks: p.remarks ?? '', is_active: p.is_active ?? 1,
    });
  }

  private variantGroup(v?: any): FormGroup {
    return this.fb.group({
      variant_no: [v?.variant_no ?? null],
      variant_sku: [v?.variant_sku ?? '', [Validators.required, Validators.maxLength(48)]],
      variant_name: [v?.variant_name ?? '', [Validators.required, Validators.maxLength(200)]],
      barcode: [v?.barcode ?? ''],
      attr1_value_no: [v?.attr1_value_no ?? null],
      attr2_value_no: [v?.attr2_value_no ?? null],
      attr3_value_no: [v?.attr3_value_no ?? null],
      sale_price: [v?.sale_price ?? null],
      mrp: [v?.mrp ?? null],
      is_active: [v?.is_active ?? 1],
    });
  }
  private barcodeGroup(b?: any): FormGroup {
    return this.fb.group({
      barcode_no: [b?.barcode_no ?? null],
      barcode: [b?.barcode ?? '', [Validators.required, Validators.maxLength(64)]],
      uom_no: [b?.uom_no ?? null, [Validators.required]],
      pack_qty: [b?.pack_qty ?? 1],
      barcode_type: [b?.barcode_type ?? 1],
      is_primary: [b?.is_primary ?? 0],
      is_active: [b?.is_active ?? 1],
    });
  }
  private uomConvGroup(c?: any): FormGroup {
    return this.fb.group({
      uom_conversion_no: [c?.uom_conversion_no ?? null],
      from_uom_no: [c?.from_uom_no ?? null, [Validators.required]],
      to_base_factor: [c?.to_base_factor ?? null, [Validators.required, Validators.min(0.000001)]],
      is_active: [c?.is_active ?? 1],
    });
  }

  addVariant(): void { this.variants.push(this.variantGroup()); }
  removeVariant(i: number): void { this.variants.removeAt(i); }
  addBarcode(): void { this.barcodes.push(this.barcodeGroup()); }
  removeBarcode(i: number): void { this.barcodes.removeAt(i); }
  addUomConv(): void { this.uomConversions.push(this.uomConvGroup()); }
  removeUomConv(i: number): void { this.uomConversions.removeAt(i); }

  /** Cartesian product of the chosen attributes' values → fill the variants grid. */
  generateVariants(): void {
    const ids = [this.genAttr1(), this.genAttr2(), this.genAttr3()].filter((x): x is number => x != null);
    const chosen = ids
      .map((id) => this.lookups().attributes.find((a) => a.attribute_no === id))
      .filter((a): a is AttributeOption => !!a && a.values.length > 0);
    if (chosen.length === 0) {
      this.toastr.warning('Pick at least one attribute (with values) to generate.');
      return;
    }
    const baseId = (this.form.get('product_id')?.value || 'SKU').toString();
    const baseName = (this.form.get('product_name')?.value || 'Variant').toString();

    let combos: { value: number; label: string }[][] = [[]];
    for (const attr of chosen) {
      const next: { value: number; label: string }[][] = [];
      for (const combo of combos) {
        for (const v of attr.values) next.push([...combo, v]);
      }
      combos = next;
    }

    this.variants.clear();
    for (const combo of combos) {
      const skuSuffix = combo.map((c) => c.label.replace(/\s+/g, '').toUpperCase()).join('-');
      const nameSuffix = combo.map((c) => c.label).join(' / ');
      this.variants.push(this.variantGroup({
        variant_sku: `${baseId}-${skuSuffix}`,
        variant_name: `${baseName} / ${nameSuffix}`,
        attr1_value_no: combo[0]?.value ?? null,
        attr2_value_no: combo[1]?.value ?? null,
        attr3_value_no: combo[2]?.value ?? null,
        is_active: 1,
      }));
    }
    this.form.patchValue({ has_variants: 1, product_type: 2 });
    this.toastr.success(`${combos.length} variant(s) generated`);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the validation errors (check all tabs).');
      return;
    }
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    this.isSaving.set(true);
    this.data
      .save({ ...val, product_no: this.selectedNo() })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (isSuccess(res)) {
            this.toastr.success(isUpdate ? 'Product updated' : 'Product created');
            this.loadList(isUpdate ? this.selectedNo() : ((res.data as IProduct)?.product_no ?? null));
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
            this.toastr.success('Product deleted');
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
    this.hasMovements.set(false);
    this.activeTab.set('general');
    this.variants.clear();
    this.barcodes.clear();
    this.uomConversions.clear();
    this.form.reset({
      product_type: 1, is_tax_inclusive: 0, is_stock_tracked: 1, is_batch_tracked: 0,
      is_expiry_tracked: 0, is_serial_tracked: 0, has_variants: 0,
      cost_price: 0, purchase_price: 0, sale_price: 0, mrp: 0, reorder_level: 0, reorder_qty: 0, min_stock: 0,
      is_sellable: 1, is_purchasable: 1, allow_discount: 1, is_active: 1,
    });
  }
}

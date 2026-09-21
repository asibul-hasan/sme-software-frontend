import { Injectable, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { Inv1001DataService } from './data.service';
import { invConstants } from '../../../constants/inv.constants';

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

export interface IVariantRow {
  __uid: number;
  variant_no?: number | null;
  variant_sku: string;
  variant_name: string;
  barcode?: string | null;
  attr1_value_no?: number | null;
  attr2_value_no?: number | null;
  attr3_value_no?: number | null;
  sale_price?: number | null;
  mrp?: number | null;
  is_active?: number | null;
}

export interface IBarcodeRow {
  __uid: number;
  barcode_no?: number | null;
  barcode: string;
  uom_no: number | null;
  pack_qty: number;
  barcode_type: number;
  is_primary: number;
  is_active?: number | null;
}

export interface IUomConvRow {
  __uid: number;
  uom_conversion_no?: number | null;
  from_uom_no: number | null;
  to_base_factor: number;
  is_active?: number | null;
}

type Tab = 'general' | 'pricing' | 'inventory' | 'variants' | 'barcodes' | 'uom';

@Injectable()
export class Inv1001ModelService {
  private fb = inject(FormBuilder);
  private data = inject(Inv1001DataService);
  private toastr = inject(ToastrService);
  private uid = 0;

  items = signal<IProduct[]>([]);
  lookups = signal<Lookups>({ categories: [], brands: [], uoms: [], taxes: [], attributes: [] });
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedNo = signal<number | null>(null);
  hasMovements = signal(false);
  activeTab = signal<Tab>('general');

  variantRows = signal<IVariantRow[]>([]);
  barcodeRows = signal<IBarcodeRow[]>([]);
  uomConvRows = signal<IUomConvRow[]>([]);

  genAttr1 = signal<number | null>(null);
  genAttr2 = signal<number | null>(null);
  genAttr3 = signal<number | null>(null);

  form!: FormGroup;

  readonly productTypes = invConstants.productTypes;
  readonly barcodeTypes = invConstants.barcodeTypes;

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.items();
    const list = term
      ? data.filter(
          (p) =>
            (p.product_name || '').toLowerCase().includes(term) ||
            (p.product_id || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.product_no ?? 0) - (a.product_no ?? 0));
  });

  pager = makePaginator<IProduct>(this.filtered);

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
          if (resolved) {
            this.select(resolved.item as IProduct);
          } else {
            this.onNew();
          }
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
    const variants: IVariantRow[] = (p.variants || []).map((v: any) => ({ ...v, __uid: ++this.uid }));
    const barcodes: IBarcodeRow[] = (p.barcodes || []).map((b: any) => ({ ...b, __uid: ++this.uid }));
    const uomConvs: IUomConvRow[] = (p.uom_conversions || []).map((c: any) => ({ ...c, __uid: ++this.uid }));
    this.variantRows.set(variants);
    this.barcodeRows.set(barcodes);
    this.uomConvRows.set(uomConvs);

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

  addVariant(): void {
    this.variantRows.update((v) => [
      ...v,
      { __uid: ++this.uid, variant_sku: '', variant_name: '', is_active: 1 },
    ]);
  }
  removeVariant(row: IVariantRow): void {
    this.variantRows.update((v) => v.filter((x) => x.__uid !== row.__uid));
  }
  onVariantChange(row: IVariantRow): void {
    this.variantRows.update((v) => v.map((x) => (x.__uid === row.__uid ? { ...x, ...row } : x)));
  }

  addBarcode(): void {
    this.barcodeRows.update((b) => [
      ...b,
      { __uid: ++this.uid, barcode: '', uom_no: this.form.get('base_uom_no')?.value ?? null, pack_qty: 1, barcode_type: 1, is_primary: 0, is_active: 1 },
    ]);
  }
  removeBarcode(row: IBarcodeRow): void {
    this.barcodeRows.update((b) => b.filter((x) => x.__uid !== row.__uid));
  }
  onBarcodeChange(row: IBarcodeRow): void {
    this.barcodeRows.update((b) => b.map((x) => (x.__uid === row.__uid ? { ...x, ...row } : x)));
  }

  addUomConv(): void {
    this.uomConvRows.update((c) => [
      ...c,
      { __uid: ++this.uid, from_uom_no: null, to_base_factor: 1, is_active: 1 },
    ]);
  }
  removeUomConv(row: IUomConvRow): void {
    this.uomConvRows.update((c) => c.filter((x) => x.__uid !== row.__uid));
  }
  onUomConvChange(row: IUomConvRow): void {
    this.uomConvRows.update((c) => c.map((x) => (x.__uid === row.__uid ? { ...x, ...row } : x)));
  }

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

    const newVariants: IVariantRow[] = [];
    for (const combo of combos) {
      const skuSuffix = combo.map((c) => c.label.replace(/\s+/g, '').toUpperCase()).join('-');
      const nameSuffix = combo.map((c) => c.label).join(' / ');
      newVariants.push({
        __uid: ++this.uid,
        variant_sku: `${baseId}-${skuSuffix}`,
        variant_name: `${baseName} / ${nameSuffix}`,
        attr1_value_no: combo[0]?.value ?? null,
        attr2_value_no: combo[1]?.value ?? null,
        attr3_value_no: combo[2]?.value ?? null,
        is_active: 1,
      });
    }
    this.variantRows.set(newVariants);
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
    const payload = {
      ...val,
      product_no: this.selectedNo(),
      variants: this.variantRows().map(({ __uid, ...rest }) => rest),
      barcodes: this.barcodeRows().map(({ __uid, ...rest }) => rest),
      uom_conversions: this.uomConvRows().map(({ __uid, ...rest }) => rest),
    };
    this.data
      .save(payload)
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
    this.variantRows.set([]);
    this.barcodeRows.set([]);
    this.uomConvRows.set([]);
    this.form.reset({
      product_type: 1, is_tax_inclusive: 0, is_stock_tracked: 1, is_batch_tracked: 0,
      is_expiry_tracked: 0, is_serial_tracked: 0, has_variants: 0,
      cost_price: 0, purchase_price: 0, sale_price: 0, mrp: 0, reorder_level: 0, reorder_qty: 0, min_stock: 0,
      is_sellable: 1, is_purchasable: 1, allow_discount: 1, is_active: 1,
    });
  }
}

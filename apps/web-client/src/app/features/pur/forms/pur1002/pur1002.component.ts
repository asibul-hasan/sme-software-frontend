import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { GridApiService } from '../../../../shared/ag-grid/services/grid-api.service';
import { toGridOptions } from '../../utils/grid-options';
import { CommonLookupService, LookupOption } from '../../../../core/services/common-lookup.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { makePaginator } from '../../../../core/utils/paginator';
import { ToastrService } from 'ngx-toastr';
import { Pur1002DataService, SupplierPriceRow } from './services/data.service';

interface WorkRow extends SupplierPriceRow { __uid: number; }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1002',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Pur1002DataService],
  templateUrl: './pur1002.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class Pur1002Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data = inject(Pur1002DataService);
  private lookup = inject(CommonLookupService);
  private toastr = inject(ToastrService);
  private alert = inject(AlertService);

  suppliers = signal<LookupOption[]>([]);
  products = signal<LookupOption[]>([]);
  uoms = signal<LookupOption[]>([]);
  rows = signal<WorkRow[]>([]);
  selectedSupplierNo = signal<number | null>(null);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);
  private uid = 0;

  filteredSuppliers = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.suppliers()
      .filter((s) => (s.code || '').toLowerCase().includes(t) || (s.name || '').toLowerCase().includes(t))
      .sort((a, b) => b.no - a.no);
  });
  pager = makePaginator(this.filteredSuppliers, { sortKey: (x: LookupOption) => x.no });

  readonly tableData = computed<WorkRow[]>(() => this.rows());

  readonly priceGrid: GridConfig<WorkRow> = {
    gridKey: 'PUR_1002_SUPPLIER_PRICE_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    // Adding a price without a supplier selected would create an orphan row.
    canAdd: () => this.canEdit() && this.selectedSupplierNo() !== null,
    canEdit: () => this.canEdit(),
    canDeleteRow: () => this.canEdit(),
    newRowDefaults: () => ({
      __uid: ++this.uid, last_price: 0, discount_pct: 0, moq: 0, is_preferred: 0, is_active: 1,
    }) as Partial<WorkRow>,
    toolbar: {
      title: 'Price List', showAdd: true, showDelete: false, showSearch: true,
      showExport: true, showColumnChooser: true, searchPlaceholder: 'Search products...',
    },
    columns: [
      GridColumns.lookup<WorkRow>('product_no', 'Product', () => toGridOptions(this.products()))
        .flex(1).minWidth(220).pinned('left').required('Product is required').build(),
      GridColumns.text<WorkRow>('supplier_sku', 'Supplier SKU').width(150).build(),
      GridColumns.lookup<WorkRow>('uom_no', 'UOM', () => toGridOptions(this.uoms()))
        .width(110).required('UOM is required').build(),
      GridColumns.decimal<WorkRow>('last_price', 'Last Price').width(130).min(0).sum().footer('Total').build(),
      GridColumns.decimal<WorkRow>('discount_pct', 'Disc %').width(100).min(0).build(),
      GridColumns.decimal<WorkRow>('moq', 'MOQ').width(100).min(0).build(),
      GridColumns.number<WorkRow>('lead_time_days', 'Lead Days').width(110).min(0).build(),
      GridColumns.checkbox<WorkRow>('is_preferred', 'Preferred').width(120).build(),
      GridColumns.action<WorkRow>().build(),
    ],
  };

  /** Kept only to flush an in-progress row edit before building a payload. */
  private gridApi?: GridApiService<any>;
  onGridReady(api: GridApiService<any>): void { this.gridApi = api; }

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('PUR_1002');
    this.loadLookups();
  }

  canEdit(): boolean {
    return this.permissionService.canInsert() || this.permissionService.canUpdate();
  }

  selectSupplier(supplier: LookupOption): void {
    this.selectedSupplierNo.set(supplier.no);
    this.loadRows(supplier.no);
  }

  loadLookups(): void {
    this.isLoading.set(true);
    this.lookup.getSuppliers().subscribe({
      next: (list) => {
        this.suppliers.set(list);
        if (list.length > 0) this.selectSupplier(list[0]);
        else this.rows.set([]);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load suppliers');
      },
    });
    this.lookup.getProducts().subscribe((list) => this.products.set(list));
    this.lookup.getUoms().subscribe((list) => this.uoms.set(list));
  }

  loadRows(supplierNo: number): void {
    this.isLoading.set(true);
    this.data.rows(supplierNo).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) this.rows.set(res.data.map((r) => ({ ...r, __uid: ++this.uid })));
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to load price list'),
    });
  }

  productName(no: number | null): string {
    return this.products().find((p) => p.no === no)?.name ?? '';
  }

  uomName(no: number | null): string {
    return this.uoms().find((u) => u.no === no)?.name ?? '';
  }

  // ── Grid row state — the form owns the rows (externalRowState) ─────────────
  addRow(): void {
    const supplierNo = this.selectedSupplierNo();
    if (!supplierNo) { this.toastr.warning('Select a supplier first'); return; }
    this.rows.update((rows) => [...rows, {
      __uid: ++this.uid,
      supplier_no: supplierNo,
      product_no: null,
      uom_no: null,
      supplier_sku: null,
      last_price: 0,
      discount_pct: 0,
      moq: 0,
      lead_time_days: null,
      is_preferred: 0,
      is_active: 1,
    } as unknown as WorkRow]);
  }

  onRowChange(row: WorkRow): void {
    // The backend keys a price on product + variant + UOM, so two rows sharing that triple would
    // collapse into one on save. Refuse the edit rather than silently lose a price.
    const clash = this.rows().some((r) => r.__uid !== row.__uid
      && r.product_no === row.product_no
      && (r.variant_no ?? null) === (row.variant_no ?? null)
      && r.uom_no === row.uom_no);
    if (clash) { this.toastr.warning('This product/UOM is already in the price list'); return; }

    this.rows.update((rows) => rows.map((r) => (r.__uid === row.__uid
      ? { ...r, ...row, product_name: this.productName(row.product_no), uom_name: this.uomName(row.uom_no) }
      : r)));
  }

  onRowRemove(row: WorkRow): void {
    this.rows.update((rows) => rows.filter((r) => r.__uid !== row.__uid));
  }

  save(): void {
    this.gridApi?.stopEditing();   // commit the open row before reading it
    const supplierNo = this.selectedSupplierNo();
    if (!supplierNo) { this.toastr.warning('Select a supplier first'); return; }
    this.isSaving.set(true);
    const payload = this.rows().map((r) => ({
      supplier_product_no: r.supplier_product_no ?? null,
      supplier_no: supplierNo,
      product_no: r.product_no,
      variant_no: r.variant_no ?? null,
      uom_no: r.uom_no,
      supplier_sku: r.supplier_sku ?? null,
      last_price: Number(r.last_price) || 0,
      discount_pct: Number(r.discount_pct) || 0,
      moq: Number(r.moq) || 0,
      lead_time_days: r.lead_time_days ?? null,
      is_preferred: Number(r.is_preferred) === 1 ? 1 : 0,
      remarks: r.remarks ?? null,
      is_active: r.is_active ?? 1,
    }));
    this.data.saveRows(supplierNo, payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.rows.set(res.data.map((r) => ({ ...r, __uid: ++this.uid })));
          this.toastr.success('Supplier price list saved');
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  clearAll(): void {
    if (!this.canEdit() || this.rows().length === 0) return;
    this.alert.confirm('Clear all price-list rows for this supplier? Save afterwards to apply.', 'Clear Price List', 'warn')
      .subscribe((ok) => { if (ok) this.rows.set([]); });
  }

}

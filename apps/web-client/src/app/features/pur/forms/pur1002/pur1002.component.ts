import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
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
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
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

  newProductNo: number | null = null;
  newUomNo: number | null = null;
  newSku = '';
  newPrice: number | null = null;
  newDiscountPct: number | null = null;
  newMoq: number | null = null;
  newLeadTimeDays: number | null = null;
  newPreferred = false;

  filteredSuppliers = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.suppliers()
      .filter((s) => (s.code || '').toLowerCase().includes(t) || (s.name || '').toLowerCase().includes(t))
      .sort((a, b) => b.no - a.no);
  });
  pager = makePaginator(this.filteredSuppliers, { sortKey: (x: LookupOption) => x.no });

  readonly tableColumns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text', width: '220px', pin: 'left' },
    { title: 'Supplier SKU', field: 'supplier_sku', cellType: 'text', width: '140px' },
    { title: 'UOM', field: 'uom_name', cellType: 'text', width: '90px' },
    { title: 'Last Price', field: 'last_price', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Disc %', field: 'discount_pct', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'MOQ', field: 'moq', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Lead Days', field: 'lead_time_days', cellType: 'number', align: 'right' },
    {
      title: 'Preferred',
      field: 'is_preferred',
      cellType: 'badge',
      width: '110px',
      badgeConfig: (v) => Number(v) === 1 ? { label: 'Preferred', variant: 'success' } : { label: 'Standard', variant: 'neutral' },
    },
  ];

  readonly tableConfig: Partial<TableConfig> = {
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    dense: true,
    striped: true,
    showColumnToggle: true,
    showExport: true,
    showTitle: false,
    showActions: true,
    actions: [
      { type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', visible: () => this.canEdit(), onClick: (r) => this.removeRow(r['__uid'] as number) },
    ],
  };

  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

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

  addRow(): void {
    if (!this.canEdit()) return;
    const supplierNo = this.selectedSupplierNo();
    if (!supplierNo) { this.toastr.warning('Select a supplier first'); return; }
    if (!this.newProductNo || !this.newUomNo) { this.toastr.warning('Select product and UOM'); return; }
    if (this.newPrice == null || this.newPrice < 0) { this.toastr.warning('Enter a valid last price'); return; }
    const duplicate = this.rows().some((r) => r.product_no === this.newProductNo && (r.variant_no ?? null) === null && r.uom_no === this.newUomNo);
    if (duplicate) { this.toastr.warning('This product/UOM is already in the price list'); return; }
    this.rows.update((rows) => [...rows, {
      __uid: ++this.uid,
      supplier_no: supplierNo,
      product_no: this.newProductNo,
      product_name: this.productName(this.newProductNo),
      uom_no: this.newUomNo,
      uom_name: this.uomName(this.newUomNo),
      supplier_sku: this.newSku || null,
      last_price: Number(this.newPrice),
      discount_pct: Number(this.newDiscountPct) || 0,
      moq: Number(this.newMoq) || 0,
      lead_time_days: this.newLeadTimeDays,
      is_preferred: this.newPreferred ? 1 : 0,
      is_active: 1,
    }]);
    this.resetEntry();
  }

  removeRow(uid: number): void {
    this.rows.update((rows) => rows.filter((r) => r.__uid !== uid));
  }

  save(): void {
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

  private resetEntry(): void {
    this.newProductNo = null;
    this.newUomNo = null;
    this.newSku = '';
    this.newPrice = null;
    this.newDiscountPct = null;
    this.newMoq = null;
    this.newLeadTimeDays = null;
    this.newPreferred = false;
  }
}

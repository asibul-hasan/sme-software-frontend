import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Pur1101DataService, PurchaseOrder, OrderLine } from './services/data.service';
import { CommonLookupService, LookupOption } from '../../../../core/services/common-lookup.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { purConstants } from '../../constants/pur.constants';
import { ToastrService } from 'ngx-toastr';

interface WorkLine extends OrderLine { __uid: number; }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1101',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Pur1101DataService],
  templateUrl: './pur1101.component.html',
  styles: [`:host { display: block; height: 100%; } /* trigger rebuild */`],
})
export class Pur1101Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Pur1101DataService);
  private lookup = inject(CommonLookupService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly statusOptions = purConstants.orderStatuses;

  orders     = signal<PurchaseOrder[]>([]);
  suppliers  = signal<LookupOption[]>([]);
  warehouses = signal<LookupOption[]>([]);
  products   = signal<LookupOption[]>([]);
  uoms       = signal<LookupOption[]>([]);
  lines      = signal<WorkLine[]>([]);
  selectedNo = signal<number | null>(null);
  status     = signal<number>(1);
  searchTerm = signal('');
  isLoading  = signal(false);
  isSaving   = signal(false);
  private uid = 0;

  supplierNo: number | null = null;
  warehouseNo: number | null = null;
  orderDate = new Date().toISOString().split('T')[0];
  expectedDate: string | null = null;
  shippingEstimate: number | null = null;
  termsNote = '';
  remarks = '';

  newProduct: number | null = null;
  newUom: number | null = null;
  newQty: number | null = null;
  newPrice: number | null = null;
  newDiscPct: number | null = null;
  newTaxPct: number | null = null;

  editable = computed(() => this.selectedNo() === null || this.status() === 1);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.orders()
      .filter((i) => (i.order_id || '').toLowerCase().includes(t) || (i.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.order_no ?? 0) - (a.order_no ?? 0));
  });

  subTotal = computed(() => this.lines().reduce((s, l) => s + this.lineTaxable(l), 0));
  taxTotal = computed(() => this.lines().reduce((s, l) => s + this.lineTax(l), 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal() + (Number(this.shippingEstimate) || 0));

  readonly lineColumns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text' },
    { title: 'Order Qty', field: 'order_qty', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Received', field: 'received_qty_base', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Unit Price', field: 'unit_price', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Disc %', field: 'discount_pct', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Tax %', field: 'tax_rate_pct', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Line Total', field: '__total', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true, value: (r) => this.rowTotal(r as unknown as WorkLine) },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true, showColumnToggle: false,
    showExport: false, showTitle: false, maxHeight: '320px', showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', visible: () => this.editable(), onClick: (r) => this.removeLine(r['__uid'] as number) }],
  };
  readonly lineData = computed(() => this.lines().map((l) => ({ ...l, __total: this.rowTotal(l) })) as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('PUR_1101'); this.loadLookups(); this.load(); });
  }

  productName(no: number | null): string { return this.products().find((p) => p.no === no)?.name ?? ''; }
  uomName(no: number | null): string { return this.uoms().find((u) => u.no === no)?.name ?? ''; }
  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  statusClass(v: number | null | undefined): string { return v === 3 ? 'list-item-tag--primary' : (v === 7 ? 'list-item-tag--warning' : ''); }

  private lineTaxable(l: OrderLine): number { const g = (Number(l.order_qty) || 0) * (Number(l.unit_price) || 0); return g - g * (Number(l.discount_pct) || 0) / 100; }
  private lineTax(l: OrderLine): number { return this.lineTaxable(l) * (Number(l.tax_rate_pct) || 0) / 100; }
  rowTotal(l: OrderLine): number { return this.lineTaxable(l) + this.lineTax(l); }

  loadLookups(): void {
    this.lookup.getSuppliers().subscribe((l) => this.suppliers.set(l));
    this.lookup.getWarehouses().subscribe((l) => this.warehouses.set(l));
    this.lookup.getProducts().subscribe((l) => this.products.set(l));
    this.lookup.getUoms().subscribe((l) => this.uoms.set(l));
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.orders.set(res.data); const t = reselectNo != null ? res.data.find((i) => i.order_no === reselectNo) : null; if (t) this.select(t); else this.onNew(); } },
      error: () => this.toastr.error('Failed to load purchase orders'),
    });
  }

  select(inv: PurchaseOrder): void {
    if (!inv.order_no) { this.onNew(); return; }
    this.data.detail(inv.order_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.order_no ?? null); this.status.set(d.status ?? 1);
          this.supplierNo = d.supplier_no; this.warehouseNo = d.warehouse_no; this.orderDate = d.order_date;
          this.expectedDate = d.expected_date ?? null; this.shippingEstimate = d.shipping_estimate ?? null;
          this.termsNote = d.terms_note ?? ''; this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.supplierNo = null; this.warehouseNo = null; this.orderDate = new Date().toISOString().split('T')[0];
    this.expectedDate = null; this.shippingEstimate = null; this.termsNote = ''; this.remarks = '';
    this.lines.set([]); this.resetLine();
  }

  addLine(): void {
    if (!this.editable()) return;
    if (!this.newProduct || !this.newUom) { this.toastr.warning('Select product and UOM'); return; }
    if (!this.newQty || this.newQty <= 0) { this.toastr.warning('Enter a quantity'); return; }
    this.lines.update((ls) => [...ls, { __uid: ++this.uid, product_no: this.newProduct, product_name: this.productName(this.newProduct), uom_no: this.newUom, uom_name: this.uomName(this.newUom), order_qty: Number(this.newQty), unit_price: Number(this.newPrice) || 0, discount_pct: Number(this.newDiscPct) || 0, tax_rate_pct: Number(this.newTaxPct) || 0 }]);
    this.resetLine();
  }
  private resetLine(): void { this.newProduct = null; this.newUom = null; this.newQty = null; this.newPrice = null; this.newDiscPct = null; this.newTaxPct = null; }
  removeLine(uid: number): void { this.lines.update((ls) => ls.filter((l) => l.__uid !== uid)); }

  private buildPayload(): PurchaseOrder {
    return {
      order_no: this.selectedNo() ?? undefined, order_date: this.orderDate,
      supplier_no: this.supplierNo, warehouse_no: this.warehouseNo, expected_date: this.expectedDate,
      shipping_estimate: Number(this.shippingEstimate) || 0, terms_note: this.termsNote, remarks: this.remarks,
      lines: this.lines().map((l) => ({ product_no: l.product_no, uom_no: l.uom_no, order_qty: Number(l.order_qty), unit_price: Number(l.unit_price) || 0, discount_pct: Number(l.discount_pct) || 0, tax_rate_pct: Number(l.tax_rate_pct) || 0, remarks: l.remarks })),
    };
  }

  onSave(): void {
    if (!this.supplierNo || !this.warehouseNo) { this.toastr.warning('Supplier and warehouse are required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    this.isSaving.set(true);
    const isUpdate = !!this.selectedNo();
    const payload = this.buildPayload();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success('PO saved'); this.load(res.data.order_no ?? this.selectedNo()); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  submit(): void {
    const no = this.selectedNo(); if (!no) { this.toastr.warning('Save the PO first'); return; }
    this.alert.confirm('Submit this PO for approval? Once approved it can be received against.', 'Submit PO', 'primary')
      .subscribe((ok) => { if (ok) this.data.submit(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('PO submitted'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Submit failed') }); });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this purchase order?', 'Cancel PO', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from PUR_1101').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('PO cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }

  onDelete(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.deleteConfirm().subscribe((ok) => { if (ok) this.data.remove(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('PO deleted'); this.load(null); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Delete failed') }); });
  }
}

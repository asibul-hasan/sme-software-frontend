import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { Sal1001DataService, Sale, SaleLine, SalOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';

import { salConstants } from '../../constants/sal.constants';
import { ToastrService } from 'ngx-toastr';

interface WorkLine extends SaleLine { __uid: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sal1001',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Sal1001DataService],
  templateUrl: './sal1001.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sal1001Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Sal1001DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly statusOptions = salConstants.invoiceStatuses;
  readonly saleTypes = salConstants.saleTypes;

  sales     = signal<Sale[]>([]);
  customers = signal<SalOption[]>([]);
  warehouses = signal<SalOption[]>([]);
  products  = signal<SalOption[]>([]);
  uoms      = signal<SalOption[]>([]);
  lines     = signal<WorkLine[]>([]);
  selectedNo = signal<number | null>(null);
  status     = signal<number>(1);
  searchTerm = signal('');
  isLoading  = signal(false);
  isSaving   = signal(false);
  private uid = 0;

  // header
  customerNo: number | null = null;
  warehouseNo: number | null = null;
  saleType: number | null = 1;
  invoiceDate = new Date().toISOString().split('T')[0];
  shippingCharge: number | null = null;
  roundOff: number | null = null;
  paidAmount: number | null = null;
  dueDate: string | null = null;
  remarks = '';

  // new line
  newProduct: number | null = null;
  newUom: number | null = null;
  newQty: number | null = null;
  newPrice: number | null = null;
  newDiscPct: number | null = null;
  newTaxPct: number | null = null;
  newBatch = '';

  editable = computed(() => this.selectedNo() === null || this.status() === 1);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.sales()
      .filter((i) => (i.invoice_id || '').toLowerCase().includes(t) || (i.customer_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.invoice_no ?? 0) - (a.invoice_no ?? 0));
  });

  subTotal  = computed(() => this.lines().reduce((s, l) => s + this.lineTaxable(l), 0));
  taxTotal  = computed(() => this.lines().reduce((s, l) => s + this.lineTax(l), 0));
  charges   = computed(() => (Number(this.shippingCharge) || 0) + (Number(this.roundOff) || 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal() + this.charges());
  dueAmount  = computed(() => Math.max(0, this.grandTotal() - (Number(this.paidAmount) || 0)));

  readonly lineColumns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text' },
    { title: 'Qty', field: 'qty', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Unit Price', field: 'unit_price', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Disc %', field: 'line_discount_pct', cellType: 'decimal', align: 'right', precision: 2 },
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
    setTimeout(() => { this.permissionService.useLocalPermissions('SAL_1001'); this.loadLookups(); this.load(); });
  }

  productName(no: number | null): string { return this.products().find((p) => p.no === no)?.name ?? ''; }
  uomName(no: number | null): string { return this.uoms().find((u) => u.no === no)?.name ?? ''; }
  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }

  private lineTaxable(l: SaleLine): number {
    const gross = (Number(l.qty) || 0) * (Number(l.unit_price) || 0);
    return gross - gross * (Number(l.line_discount_pct) || 0) / 100;
  }
  private lineTax(l: SaleLine): number { return this.lineTaxable(l) * (Number(l.tax_rate_pct) || 0) / 100; }
  rowTotal(l: SaleLine): number { return this.lineTaxable(l) + this.lineTax(l); }

  loadLookups(): void {
    this.data.lookups().subscribe({ next: (r) => { if (isSuccess(r) && r.data) { this.customers.set(r.data.customers); this.warehouses.set(r.data.warehouses); this.products.set(r.data.products); this.uoms.set(r.data.uoms); } } });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.sales.set(res.data);
          const target = reselectNo != null ? res.data.find((i) => i.invoice_no === reselectNo) : null;
          if (target) this.select(target); else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load sales'),
    });
  }

  select(inv: Sale): void {
    if (!inv.invoice_no) { this.onNew(); return; }
    this.data.detail(inv.invoice_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.invoice_no ?? null);
          this.status.set(d.status ?? 1);
          this.customerNo = d.customer_no; this.warehouseNo = d.warehouse_no; this.saleType = d.sale_type;
          this.invoiceDate = d.invoice_date; this.shippingCharge = d.shipping_charge ?? null;
          this.roundOff = d.round_off ?? null; this.paidAmount = d.paid_amount ?? null;
          this.dueDate = d.due_date ?? null; this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.customerNo = null; this.warehouseNo = null; this.saleType = 1;
    this.invoiceDate = new Date().toISOString().split('T')[0];
    this.shippingCharge = null; this.roundOff = null; this.paidAmount = null; this.dueDate = null; this.remarks = '';
    this.lines.set([]); this.resetLine();
  }

  addLine(): void {
    if (!this.editable()) return;
    if (!this.newProduct || !this.newUom) { this.toastr.warning('Select product and UOM'); return; }
    if (!this.newQty || this.newQty <= 0) { this.toastr.warning('Enter a quantity'); return; }
    this.lines.update((ls) => [...ls, {
      __uid: ++this.uid, product_no: this.newProduct, product_name: this.productName(this.newProduct),
      uom_no: this.newUom, uom_name: this.uomName(this.newUom), qty: Number(this.newQty),
      unit_price: Number(this.newPrice) || 0, line_discount_pct: Number(this.newDiscPct) || 0,
      tax_rate_pct: Number(this.newTaxPct) || 0, batch_code: this.newBatch || null,
    }]);
    this.resetLine();
  }
  private resetLine(): void { this.newProduct = null; this.newUom = null; this.newQty = null; this.newPrice = null; this.newDiscPct = null; this.newTaxPct = null; this.newBatch = ''; }
  removeLine(uid: number): void { this.lines.update((ls) => ls.filter((l) => l.__uid !== uid)); }

  private buildPayload(): Sale {
    return {
      invoice_no: this.selectedNo() ?? undefined,
      invoice_date: this.invoiceDate, sale_type: this.saleType,
      customer_no: this.customerNo, warehouse_no: this.warehouseNo,
      shipping_charge: Number(this.shippingCharge) || 0, round_off: Number(this.roundOff) || 0,
      paid_amount: Number(this.paidAmount) || 0, due_date: this.dueDate, remarks: this.remarks,
      lines: this.lines().map((l) => ({ product_no: l.product_no, uom_no: l.uom_no, qty: Number(l.qty), unit_price: Number(l.unit_price) || 0, line_discount_pct: Number(l.line_discount_pct) || 0, tax_rate_pct: Number(l.tax_rate_pct) || 0, batch_code: l.batch_code, remarks: l.remarks })),
    };
  }

  onSave(): void {
    if (!this.customerNo || !this.warehouseNo) { this.toastr.warning('Customer and warehouse are required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    this.isSaving.set(true);
    const isUpdate = !!this.selectedNo();
    const payload = this.buildPayload();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success('Sale saved'); this.load(res.data.invoice_no ?? this.selectedNo()); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  submit(): void {
    const no = this.selectedNo(); if (!no) { this.toastr.warning('Save the sale first'); return; }
    this.alert.confirm('Submit this sale? It relieves stock and posts revenue, COGS and AR to the GL.', 'Submit Sale', 'primary')
      .subscribe((ok) => { if (ok) this.data.submit(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Sale posted'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Submit failed') }); });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this posted sale? Stock, revenue/COGS and AR will be reversed.', 'Cancel Sale', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from SAL_1001').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Sale cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }

  onDelete(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.deleteConfirm().subscribe((ok) => { if (ok) this.data.remove(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Sale deleted'); this.load(null); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Delete failed') }); });
  }
}

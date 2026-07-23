import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { Pur1102DataService, Invoice, InvoiceLine, PurOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';

import { purConstants } from '../../constants/pur.constants';
import { ToastrService } from 'ngx-toastr';

interface WorkLine extends InvoiceLine { __uid: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1102',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Pur1102DataService],
  templateUrl: './pur1102.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Pur1102Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Pur1102DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly statusOptions = purConstants.invoiceStatuses;

  invoices  = signal<Invoice[]>([]);
  suppliers = signal<PurOption[]>([]);
  warehouses = signal<PurOption[]>([]);
  products  = signal<PurOption[]>([]);
  uoms      = signal<PurOption[]>([]);
  lines     = signal<WorkLine[]>([]);
  selectedNo = signal<number | null>(null);
  status     = signal<number>(1);
  searchTerm = signal('');
  isLoading  = signal(false);
  isSaving   = signal(false);
  private uid = 0;

  // header
  supplierNo: number | null = null;
  warehouseNo: number | null = null;
  supplierInvoiceNo = '';
  invoiceDate = new Date().toISOString().split('T')[0];
  shippingCharge: number | null = null;
  otherCharges: number | null = null;
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
    return this.invoices()
      .filter((i) => (i.invoice_id || '').toLowerCase().includes(t) || (i.supplier_invoice_no || '').toLowerCase().includes(t) || (i.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.invoice_no ?? 0) - (a.invoice_no ?? 0));
  });

  subTotal  = computed(() => this.lines().reduce((s, l) => s + this.lineTaxable(l), 0));
  taxTotal  = computed(() => this.lines().reduce((s, l) => s + this.lineTax(l), 0));
  charges   = computed(() => (Number(this.shippingCharge) || 0) + (Number(this.otherCharges) || 0) + (Number(this.roundOff) || 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal() + this.charges());

  readonly lineColumns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text' },
    { title: 'Qty', field: 'qty', cellType: 'decimal', align: 'right', precision: 2 },
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
    setTimeout(() => { this.permissionService.useLocalPermissions('PUR_1102'); this.loadLookups(); this.load(); });
  }

  productName(no: number | null): string { return this.products().find((p) => p.no === no)?.name ?? ''; }
  uomName(no: number | null): string { return this.uoms().find((u) => u.no === no)?.name ?? ''; }
  statusLabel(v: number | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }

  private lineTaxable(l: InvoiceLine): number {
    const gross = (Number(l.qty) || 0) * (Number(l.unit_price) || 0);
    const disc = l.discount_amount != null ? Number(l.discount_amount) : gross * (Number(l.discount_pct) || 0) / 100;
    return gross - disc;
  }
  private lineTax(l: InvoiceLine): number { return this.lineTaxable(l) * (Number(l.tax_rate_pct) || 0) / 100; }
  rowTotal(l: InvoiceLine): number { return this.lineTaxable(l) + this.lineTax(l); }

  loadLookups(): void {
    this.data.lookups().subscribe({ next: (r) => { if (isSuccess(r) && r.data) { this.suppliers.set(r.data.suppliers); this.warehouses.set(r.data.warehouses); this.products.set(r.data.products); this.uoms.set(r.data.uoms); } } });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.invoices.set(res.data);
          const target = reselectNo != null ? res.data.find((i) => i.invoice_no === reselectNo) : null;
          if (target) this.select(target); else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load invoices'),
    });
  }

  select(inv: Invoice): void {
    if (!inv.invoice_no) { this.onNew(); return; }
    this.data.detail(inv.invoice_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.invoice_no ?? null);
          this.status.set(d.status ?? 1);
          this.supplierNo = d.supplier_no; this.warehouseNo = d.warehouse_no;
          this.supplierInvoiceNo = d.supplier_invoice_no; this.invoiceDate = d.invoice_date;
          this.shippingCharge = d.shipping_charge ?? null; this.otherCharges = d.other_charges ?? null;
          this.roundOff = d.round_off ?? null; this.paidAmount = d.paid_amount ?? null;
          this.dueDate = d.due_date ?? null; this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.supplierNo = null; this.warehouseNo = null; this.supplierInvoiceNo = '';
    this.invoiceDate = new Date().toISOString().split('T')[0];
    this.shippingCharge = null; this.otherCharges = null; this.roundOff = null; this.paidAmount = null; this.dueDate = null; this.remarks = '';
    this.lines.set([]); this.resetLine();
  }

  addLine(): void {
    if (!this.editable()) return;
    if (!this.newProduct || !this.newUom) { this.toastr.warning('Select product and UOM'); return; }
    if (!this.newQty || this.newQty <= 0) { this.toastr.warning('Enter a quantity'); return; }
    this.lines.update((ls) => [...ls, {
      __uid: ++this.uid, product_no: this.newProduct, product_name: this.productName(this.newProduct),
      uom_no: this.newUom, uom_name: this.uomName(this.newUom), qty: Number(this.newQty),
      unit_price: Number(this.newPrice) || 0, discount_pct: Number(this.newDiscPct) || 0,
      tax_rate_pct: Number(this.newTaxPct) || 0, batch_code: this.newBatch || null,
    }]);
    this.resetLine();
  }
  private resetLine(): void { this.newProduct = null; this.newUom = null; this.newQty = null; this.newPrice = null; this.newDiscPct = null; this.newTaxPct = null; this.newBatch = ''; }
  removeLine(uid: number): void { this.lines.update((ls) => ls.filter((l) => l.__uid !== uid)); }

  private buildPayload(): Invoice {
    return {
      invoice_no: this.selectedNo() ?? undefined,
      supplier_invoice_no: this.supplierInvoiceNo, invoice_date: this.invoiceDate,
      supplier_no: this.supplierNo, warehouse_no: this.warehouseNo,
      shipping_charge: Number(this.shippingCharge) || 0, other_charges: Number(this.otherCharges) || 0,
      round_off: Number(this.roundOff) || 0, paid_amount: Number(this.paidAmount) || 0,
      due_date: this.dueDate, remarks: this.remarks,
      lines: this.lines().map((l) => ({ product_no: l.product_no, uom_no: l.uom_no, qty: Number(l.qty), unit_price: Number(l.unit_price) || 0, discount_pct: Number(l.discount_pct) || 0, tax_rate_pct: Number(l.tax_rate_pct) || 0, batch_code: l.batch_code, remarks: l.remarks })),
    };
  }

  onSave(): void {
    if (!this.supplierNo || !this.warehouseNo) { this.toastr.warning('Supplier and warehouse are required'); return; }
    if (!this.supplierInvoiceNo.trim()) { this.toastr.warning('Supplier bill number is required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    this.isSaving.set(true);
    const isUpdate = !!this.selectedNo();
    const payload = this.buildPayload();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success('Invoice saved'); this.load(res.data.invoice_no ?? this.selectedNo()); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  submit(): void {
    const no = this.selectedNo(); if (!no) { this.toastr.warning('Save the invoice first'); return; }
    this.alert.confirm('Submit this invoice? It posts stock, the payable and the GL when no approval workflow is configured.', 'Submit Invoice', 'primary')
      .subscribe((ok) => { if (ok) this.data.submit(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Invoice submitted'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Submit failed') }); });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this posted invoice? Stock, payable and GL will be reversed.', 'Cancel Invoice', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from PUR_1102').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Invoice cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }

  onDelete(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.deleteConfirm().subscribe((ok) => { if (ok) this.data.remove(no).subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Invoice deleted'); this.load(null); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Delete failed') }); });
  }
}

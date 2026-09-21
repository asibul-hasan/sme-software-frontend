import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { Sal1103DataService, SalReturn, ReturnLine, SalOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';

import { salConstants } from '../../constants/sal.constants';
import { ToastrService } from 'ngx-toastr';

interface WorkLine extends ReturnLine { __uid: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sal1103',
  standalone: true,
  imports: [DecimalInputDirective, CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Sal1103DataService],
  templateUrl: './sal1103.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sal1103Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Sal1103DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly statusOptions = salConstants.returnStatuses;
  readonly reasons = salConstants.returnReasons;
  readonly refundMethods = salConstants.refundMethods;

  returns   = signal<SalReturn[]>([]);
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

  customerNo: number | null = null;
  warehouseNo: number | null = null;
  returnDate = new Date().toISOString().split('T')[0];
  reason: number | null = 1;
  refundMethod: number | null = 1;
  remarks = '';

  newProduct: number | null = null;
  newUom: number | null = null;
  newQty: number | null = null;
  newPrice: number | null = null;
  newCost: number | null = null;
  newTaxPct: number | null = null;
  newBatch = '';

  editable = computed(() => this.selectedNo() === null);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.returns()
      .filter((i) => (i.return_id || '').toLowerCase().includes(t) || (i.customer_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.return_no ?? 0) - (a.return_no ?? 0));
  });

  subTotal = computed(() => this.lines().reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.net_unit_price) || 0), 0));
  taxTotal = computed(() => this.lines().reduce((s, l) => { const t = (Number(l.qty) || 0) * (Number(l.net_unit_price) || 0); return s + t * (Number(l.tax_rate_pct) || 0) / 100; }, 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal());

  readonly lineColumns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text' },
    { title: 'Qty', field: 'qty', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Net Price', field: 'net_unit_price', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Unit Cost', field: 'unit_cost', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Tax %', field: 'tax_rate_pct', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Refund', field: '__total', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true, value: (r) => this.rowTotal(r as unknown as WorkLine) },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true, showColumnToggle: false,
    showExport: false, showTitle: false, maxHeight: '300px', showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', visible: () => this.editable(), onClick: (r) => this.removeLine(r['__uid'] as number) }],
  };
  readonly lineData = computed(() => this.lines().map((l) => ({ ...l, __total: this.rowTotal(l) })) as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('SAL_1103'); this.loadLookups(); this.load(); });
  }

  productName(no: number | null): string { return this.products().find((p) => p.no === no)?.name ?? ''; }
  uomName(no: number | null): string { return this.uoms().find((u) => u.no === no)?.name ?? ''; }
  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  rowTotal(l: ReturnLine): number { const t = (Number(l.qty) || 0) * (Number(l.net_unit_price) || 0); return t + t * (Number(l.tax_rate_pct) || 0) / 100; }

  loadLookups(): void { this.data.lookups().subscribe({ next: (r) => { if (isSuccess(r) && r.data) { this.customers.set(r.data.customers); this.warehouses.set(r.data.warehouses); this.products.set(r.data.products); this.uoms.set(r.data.uoms); } } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.returns.set(res.data); const t = reselectNo != null ? res.data.find((i) => i.return_no === reselectNo) : null; if (t) this.select(t); else this.onNew(); } },
      error: () => this.toastr.error('Failed to load returns'),
    });
  }

  select(inv: SalReturn): void {
    if (!inv.return_no) { this.onNew(); return; }
    this.data.detail(inv.return_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.return_no ?? null); this.status.set(d.status ?? 2);
          this.customerNo = d.customer_no; this.warehouseNo = d.warehouse_no; this.returnDate = d.return_date;
          this.reason = d.return_reason ?? null; this.refundMethod = d.refund_method ?? 1; this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.customerNo = null; this.warehouseNo = null; this.returnDate = new Date().toISOString().split('T')[0];
    this.reason = 1; this.refundMethod = 1; this.remarks = '';
    this.lines.set([]); this.resetLine();
  }

  addLine(): void {
    if (!this.editable()) return;
    if (!this.newProduct || !this.newUom) { this.toastr.warning('Select product and UOM'); return; }
    if (!this.newQty || this.newQty <= 0) { this.toastr.warning('Enter a quantity'); return; }
    this.lines.update((ls) => [...ls, { __uid: ++this.uid, product_no: this.newProduct, product_name: this.productName(this.newProduct), uom_no: this.newUom, uom_name: this.uomName(this.newUom), qty: Number(this.newQty), net_unit_price: Number(this.newPrice) || 0, unit_cost: Number(this.newCost) || 0, tax_rate_pct: Number(this.newTaxPct) || 0, restock_flag: 1, batch_code: this.newBatch || null }]);
    this.resetLine();
  }
  private resetLine(): void { this.newProduct = null; this.newUom = null; this.newQty = null; this.newPrice = null; this.newCost = null; this.newTaxPct = null; this.newBatch = ''; }
  removeLine(uid: number): void { this.lines.update((ls) => ls.filter((l) => l.__uid !== uid)); }

  post(): void {
    if (!this.customerNo || !this.warehouseNo) { this.toastr.warning('Customer and warehouse are required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    this.alert.confirm('Post this sales return? It restocks goods, reverses revenue/COGS and refunds or credits AR.', 'Post Return', 'primary')
      .subscribe((ok) => { if (ok) this.doPost(); });
  }
  private doPost(): void {
    this.isSaving.set(true);
    const payload: SalReturn = {
      return_date: this.returnDate, customer_no: this.customerNo, warehouse_no: this.warehouseNo,
      return_reason: this.reason, refund_method: this.refundMethod, remarks: this.remarks,
      lines: this.lines().map((l) => ({ product_no: l.product_no, uom_no: l.uom_no, qty: Number(l.qty), net_unit_price: Number(l.net_unit_price) || 0, unit_cost: Number(l.unit_cost) || 0, tax_rate_pct: Number(l.tax_rate_pct) || 0, restock_flag: l.restock_flag ?? 1, batch_code: l.batch_code, remarks: l.remarks })),
    };
    this.data.create(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success(`Return ${res.data.return_id} posted`); this.load(res.data.return_no ?? null); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Return failed'),
    });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this return? Stock, revenue/COGS and AR will be restored.', 'Cancel Return', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from SAL_1103').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Return cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }
}

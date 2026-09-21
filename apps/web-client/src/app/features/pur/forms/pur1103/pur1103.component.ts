import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

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

import { Pur1103DataService, PurReturn, ReturnLine, PurOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { makePaginator } from '../../../../core/utils/paginator';

import { purConstants } from '../../constants/pur.constants';
import { ToastrService } from 'ngx-toastr';

interface WorkLine extends ReturnLine { __uid: number; __total?: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1103',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Pur1103DataService],
  templateUrl: './pur1103.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Pur1103Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Pur1103DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly statusOptions = purConstants.returnStatuses;
  readonly reasons = purConstants.returnReasons;
  readonly settlementModes = purConstants.settlementModes;

  returns   = signal<PurReturn[]>([]);
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

  supplierNo: number | null = null;
  warehouseNo: number | null = null;
  returnDate = new Date().toISOString().split('T')[0];
  reason: number | null = 1;
  settlementMode: number | null = 1;
  remarks = '';


  editable = computed(() => this.selectedNo() === null);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.returns()
      .filter((i) => (i.return_id || '').toLowerCase().includes(t) || (i.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.return_no ?? 0) - (a.return_no ?? 0));
  });

  pager = makePaginator(this.filtered, { sortKey: (x: PurReturn) => x.return_no ?? 0 });

  subTotal = computed(() => this.lines().reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0));
  taxTotal = computed(() => this.lines().reduce((s, l) => { const c = (Number(l.qty) || 0) * (Number(l.unit_cost) || 0); return s + c * (Number(l.tax_rate_pct) || 0) / 100; }, 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal());

  /**
   * `__total` is derived, so it is injected here rather than stored on the line — the grid sums
   * and exports the field, and a stored copy would go stale the moment qty or cost changed.
   */
  readonly lineData = computed<WorkLine[]>(() =>
    this.lines().map((l) => ({ ...l, __total: this.rowTotal(l) })),
  );

  readonly lineGrid: GridConfig<WorkLine> = {
    gridKey: 'PUR_1103_RETURN_LINE_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    // A posted return is history — editable() is false once it leaves draft, which turns the
    // whole grid read-only without a second set of flags to keep in step.
    canAdd: () => this.editable() && this.permissionService.canInsert(),
    canEdit: () => this.editable() && this.permissionService.canUpdate(),
    canDeleteRow: () => this.editable() && this.permissionService.canDelete(),
    newRowDefaults: () => ({ __uid: ++this.uid, qty: 1, unit_cost: 0, tax_rate_pct: 0 }) as Partial<WorkLine>,
    toolbar: {
      title: 'Return Lines', showAdd: true, showDelete: false, showSearch: true,
      showExport: true, showColumnChooser: true, searchPlaceholder: 'Search lines...',
    },
    columns: [
      GridColumns.lookup<WorkLine>('product_no', 'Product', () => toGridOptions(this.products()))
        .flex(1).minWidth(200).required('Product is required').build(),
      GridColumns.lookup<WorkLine>('uom_no', 'UOM', () => toGridOptions(this.uoms()))
        .width(110).required('UOM is required').build(),
      GridColumns.decimal<WorkLine>('qty', 'Qty').width(100).min(0).required().build(),
      GridColumns.decimal<WorkLine>('unit_cost', 'Unit Cost').width(120).min(0).build(),
      GridColumns.decimal<WorkLine>('tax_rate_pct', 'Tax %').width(90).min(0).build(),
      GridColumns.text<WorkLine>('batch_code', 'Batch').width(120).build(),
      GridColumns.decimal<WorkLine>('__total', 'Line Total')
        .width(130).readOnly().sum().footer('Total').build(),
      GridColumns.action<WorkLine>().build(),
    ],
  };

  /** Kept only to flush an in-progress row edit before building a payload. */
  private gridApi?: GridApiService<any>;
  onGridReady(api: GridApiService<any>): void { this.gridApi = api; }

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('PUR_1103'); this.loadLookups(); this.load(); });
  }

  productName(no: number | null): string { return this.products().find((p) => p.no === no)?.name ?? ''; }
  uomName(no: number | null): string { return this.uoms().find((u) => u.no === no)?.name ?? ''; }
  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  rowTotal(l: ReturnLine): number { const c = (Number(l.qty) || 0) * (Number(l.unit_cost) || 0); return c + c * (Number(l.tax_rate_pct) || 0) / 100; }

  loadLookups(): void { this.data.lookups().subscribe({ next: (r) => { if (isSuccess(r) && r.data) { this.suppliers.set(r.data.suppliers); this.warehouses.set(r.data.warehouses); this.products.set(r.data.products); this.uoms.set(r.data.uoms); } } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.returns.set(res.data); const t = reselectNo != null ? res.data.find((i) => i.return_no === reselectNo) : null; if (t) this.select(t); else this.onNew(); } },
      error: () => this.toastr.error('Failed to load returns'),
    });
  }

  select(inv: PurReturn): void {
    if (!inv.return_no) { this.onNew(); return; }
    this.data.detail(inv.return_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.return_no ?? null); this.status.set(d.status ?? 2);
          this.supplierNo = d.supplier_no; this.warehouseNo = d.warehouse_no; this.returnDate = d.return_date;
          this.reason = d.return_reason ?? null; this.settlementMode = d.settlement_mode ?? 1; this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.supplierNo = null; this.warehouseNo = null; this.returnDate = new Date().toISOString().split('T')[0];
    this.reason = 1; this.settlementMode = 1; this.remarks = '';
    this.lines.set([]);
  }

  // ── Grid row state — the form owns the rows (externalRowState) ─────────────
  addLine(): void {
    this.lines.update((ls) => [...ls, {
      __uid: ++this.uid, product_no: null, uom_no: null,
      qty: 1, unit_cost: 0, tax_rate_pct: 0,
    } as WorkLine]);
  }

  onLineChange(row: WorkLine): void {
    // Names ride along for the payload and the sidebar; the grid edits the *_no codes.
    this.lines.update((ls) => ls.map((l) => (l.__uid === row.__uid
      ? { ...l, ...row, product_name: this.productName(row.product_no), uom_name: this.uomName(row.uom_no) }
      : l)));
  }

  onLineRemove(row: WorkLine): void {
    this.lines.update((ls) => ls.filter((l) => l.__uid !== row.__uid));
  }

  /**
   * The backend keeps only lines with a product and a positive qty and silently DROPS the rest,
   * so an unfinished row would vanish on save and the document would come back with fewer lines
   * than the operator entered — no error, no explanation. Refuse the save instead.
   */
  private linesAreComplete(): boolean {
    const bad = this.lines().findIndex((l) => !l.product_no || !l.uom_no || !(Number(l.qty) > 0));
    if (bad >= 0) {
      this.toastr.warning(`Line ${bad + 1} needs a product, a UOM and a quantity`);
      return false;
    }
    return true;
  }

  post(): void {
    this.gridApi?.stopEditing();   // commit the open row before reading it
    if (!this.supplierNo || !this.warehouseNo) { this.toastr.warning('Supplier and warehouse are required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    if (!this.linesAreComplete()) return;
    this.alert.confirm('Post this purchase return? It relieves stock and debits the payable.', 'Post Return', 'primary')
      .subscribe((ok) => { if (ok) this.doPost(); });
  }
  private doPost(): void {
    this.isSaving.set(true);
    const payload: PurReturn = {
      return_date: this.returnDate, supplier_no: this.supplierNo, warehouse_no: this.warehouseNo,
      return_reason: this.reason, settlement_mode: this.settlementMode, remarks: this.remarks,
      lines: this.lines().map((l) => ({ product_no: l.product_no, uom_no: l.uom_no, qty: Number(l.qty), unit_cost: Number(l.unit_cost) || 0, tax_rate_pct: Number(l.tax_rate_pct) || 0, batch_code: l.batch_code, remarks: l.remarks })),
    };
    this.data.create(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success(`Return ${res.data.return_id} posted`); this.load(res.data.return_no ?? null); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Return failed'),
    });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this return? Stock and the payable will be restored.', 'Cancel Return', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from PUR_1103').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Return cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }
}

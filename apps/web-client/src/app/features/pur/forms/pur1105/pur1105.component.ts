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
import { purConstants } from '../../constants/pur.constants';

import { ToastrService } from 'ngx-toastr';
import { Pur1105DataService, Receipt, ReceiptLine } from './services/data.service';

interface WorkLine extends ReceiptLine { __uid: number; __total?: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1105',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Pur1105DataService],
  templateUrl: './pur1105.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class Pur1105Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data = inject(Pur1105DataService);
  private lookup = inject(CommonLookupService);
  private toastr = inject(ToastrService);
  private alert = inject(AlertService);

  readonly statusOptions = purConstants.receiptStatuses;

  receipts = signal<Receipt[]>([]);
  suppliers = signal<LookupOption[]>([]);
  warehouses = signal<LookupOption[]>([]);
  products = signal<LookupOption[]>([]);
  uoms = signal<LookupOption[]>([]);
  lines = signal<WorkLine[]>([]);
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);
  private uid = 0;

  supplierNo: number | null = null;
  warehouseNo: number | null = null;
  orderNo: number | null = null;
  receiptDate = new Date().toISOString().split('T')[0];
  remarks = '';

  editable = computed(() => this.selectedNo() === null || this.status() === 1);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.receipts()
      .filter((r) => (r.receipt_id || '').toLowerCase().includes(t) || (r.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.receipt_no ?? 0) - (a.receipt_no ?? 0));
  });
  pager = makePaginator(this.filtered, { sortKey: (x: Receipt) => x.receipt_no ?? 0 });

  subTotal = computed(() => this.lines().reduce((s, l) => s + this.lineTaxable(l), 0));
  taxTotal = computed(() => this.lines().reduce((s, l) => s + this.lineTax(l), 0));
  grandTotal = computed(() => this.subTotal() + this.taxTotal());

  /**
   * `__total` is derived, so it is injected here rather than stored on the line — the grid sums
   * and exports the field, and a stored copy would go stale the moment qty or cost changed.
   */
  readonly lineData = computed<WorkLine[]>(() =>
    this.lines().map((l) => ({ ...l, __total: this.rowTotal(l) })),
  );

  readonly lineGrid: GridConfig<WorkLine> = {
    gridKey: 'PUR_1105_RECEIPT_LINE_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    // A posted GRN is history — editable() is false once it leaves draft, which turns the whole
    // grid read-only without a second set of flags to keep in step.
    canAdd: () => this.editable() && this.permissionService.canInsert(),
    canEdit: () => this.editable() && this.permissionService.canUpdate(),
    canDeleteRow: () => this.editable() && this.permissionService.canDelete(),
    newRowDefaults: () => ({ __uid: ++this.uid, qty: 1, unit_cost: 0, tax_rate_pct: 0 }) as Partial<WorkLine>,
    toolbar: {
      title: 'Received Lines', showAdd: true, showDelete: false, showSearch: true,
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
      GridColumns.date<WorkLine>('expiry_date', 'Expiry').width(130).build(),
      GridColumns.decimal<WorkLine>('__total', 'Line Total')
        .width(130).readOnly().sum().footer('Total').build(),
      GridColumns.action<WorkLine>().build(),
    ],
  };

  /** Kept only to flush an in-progress row edit before building a payload. */
  private gridApi?: GridApiService<any>;
  onGridReady(api: GridApiService<any>): void { this.gridApi = api; }

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('PUR_1105');
    this.loadLookups();
    this.load();
  }

  statusLabel(v: number | undefined): string {
    return this.statusOptions.find((s) => s.value === v)?.label ?? '';
  }

  productName(no: number | null): string {
    return this.products().find((p) => p.no === no)?.name ?? '';
  }

  uomName(no: number | null): string {
    return this.uoms().find((u) => u.no === no)?.name ?? '';
  }

  private lineTaxable(l: ReceiptLine): number {
    return (Number(l.qty) || 0) * (Number(l.unit_cost) || 0);
  }

  private lineTax(l: ReceiptLine): number {
    return this.lineTaxable(l) * (Number(l.tax_rate_pct) || 0) / 100;
  }

  rowTotal(l: ReceiptLine): number {
    return this.lineTaxable(l) + this.lineTax(l);
  }

  loadLookups(): void {
    this.lookup.getSuppliers().subscribe((list) => this.suppliers.set(list));
    this.lookup.getWarehouses().subscribe((list) => this.warehouses.set(list));
    this.lookup.getProducts().subscribe((list) => this.products.set(list));
    this.lookup.getUoms().subscribe((list) => this.uoms.set(list));
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.receipts.set(res.data);
          const target = reselectNo != null ? res.data.find((r) => r.receipt_no === reselectNo) : null;
          if (target) this.select(target);
          else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load GRNs'),
    });
  }

  select(row: Receipt): void {
    if (!row.receipt_no) { this.onNew(); return; }
    this.data.detail(row.receipt_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.receipt_no ?? null);
          this.status.set(d.status ?? 1);
          this.supplierNo = d.supplier_no;
          this.warehouseNo = d.warehouse_no;
          this.orderNo = d.order_no ?? null;
          this.receiptDate = d.receipt_date;
          this.remarks = d.remarks ?? '';
          this.lines.set((d.lines ?? []).map((l) => ({ ...l, __uid: ++this.uid })));
        }
      },
      error: () => this.toastr.error('Failed to load GRN'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.supplierNo = null;
    this.warehouseNo = null;
    this.orderNo = null;
    this.receiptDate = new Date().toISOString().split('T')[0];
    this.remarks = '';
    this.lines.set([]);
  }

  // ── Grid row state — the form owns the rows (externalRowState) ─────────────
  addLine(): void {
    this.lines.update((ls) => [...ls, {
      __uid: ++this.uid,
      product_no: null,
      uom_no: null,
      qty: 1,
      unit_cost: 0,
      tax_rate_pct: 0,
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
   * so an unfinished row would vanish on save and the GRN would come back with fewer lines than
   * the operator entered — no error, no explanation. Refuse the save instead.
   */
  private linesAreComplete(): boolean {
    const bad = this.lines().findIndex((l) => !l.product_no || !l.uom_no || !(Number(l.qty) > 0));
    if (bad >= 0) {
      this.toastr.warning(`Line ${bad + 1} needs a product, a UOM and a quantity`);
      return false;
    }
    return true;
  }

  private buildPayload(): Receipt {
    return {
      receipt_no: this.selectedNo() ?? undefined,
      receipt_date: this.receiptDate,
      supplier_no: this.supplierNo,
      warehouse_no: this.warehouseNo,
      order_no: this.orderNo,
      remarks: this.remarks,
      lines: this.lines().map((l) => ({
        order_dtl_no: l.order_dtl_no ?? null,
        product_no: l.product_no,
        variant_no: l.variant_no ?? null,
        uom_no: l.uom_no,
        qty: Number(l.qty),
        unit_cost: Number(l.unit_cost) || 0,
        tax_rate_pct: Number(l.tax_rate_pct) || 0,
        batch_no: l.batch_no ?? null,
        batch_code: l.batch_code ?? null,
        mfg_date: l.mfg_date ?? null,
        expiry_date: l.expiry_date ?? null,
        remarks: l.remarks ?? null,
      })),
    };
  }

  onSave(): void {
    this.gridApi?.stopEditing();   // commit the open row before reading it
    if (!this.supplierNo || !this.warehouseNo) { this.toastr.warning('Supplier and warehouse are required'); return; }
    if (this.lines().length === 0) { this.toastr.warning('Add at least one line'); return; }
    if (!this.linesAreComplete()) return;
    this.isSaving.set(true);
    const isUpdate = !!this.selectedNo();
    const payload = this.buildPayload();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success('GRN saved');
          this.load(res.data.receipt_no ?? this.selectedNo());
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  post(): void {
    this.gridApi?.stopEditing();   // commit the open row before reading it
    const no = this.selectedNo();
    if (!no) { this.toastr.warning('Save the GRN first'); return; }
    this.alert.confirm('Post this GRN? Stock will increase and GRN clearing will be credited.', 'Post GRN', 'primary')
      .subscribe((ok) => {
        if (ok) this.data.post(no).subscribe({
          next: (r) => { if (isSuccess(r)) { this.toastr.success('GRN posted'); this.load(no); } },
          error: (e) => this.toastr.error(e?.error?.message ?? 'Post failed'),
        });
      });
  }

  cancel(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.alert.confirm('Cancel this posted GRN? Stock and GRN clearing will be reversed.', 'Cancel GRN', 'warn')
      .subscribe((ok) => {
        if (ok) this.data.cancel(no, 'Cancelled from PUR_1105').subscribe({
          next: (r) => { if (isSuccess(r)) { this.toastr.success('GRN cancelled'); this.load(no); } },
          error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed'),
        });
      });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.alert.deleteConfirm().subscribe((ok) => {
      if (ok) this.data.remove(no).subscribe({
        next: (r) => { if (isSuccess(r)) { this.toastr.success('GRN deleted'); this.load(null); } },
        error: (e) => this.toastr.error(e?.error?.message ?? 'Delete failed'),
      });
    });
  }
}

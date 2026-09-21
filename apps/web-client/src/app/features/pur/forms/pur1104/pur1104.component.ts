import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';

import { Pur1104DataService, Payment, OpenInvoice, PurOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { makePaginator } from '../../../../core/utils/paginator';

import { purConstants } from '../../constants/pur.constants';
import { ToastrService } from 'ngx-toastr';

interface AllocRow extends OpenInvoice { alloc: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1104',
  standalone: true,
  imports: [DecimalInputDirective, CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Pur1104DataService],
  templateUrl: './pur1104.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Pur1104Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Pur1104DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly methods = purConstants.paymentMethods;
  readonly statusOptions = purConstants.paymentStatuses;

  payments  = signal<Payment[]>([]);
  suppliers = signal<PurOption[]>([]);
  openRows  = signal<AllocRow[]>([]);
  selectedNo = signal<number | null>(null);
  status     = signal<number>(1);
  searchTerm = signal('');
  isLoading  = signal(false);
  isSaving   = signal(false);

  // header
  supplierNo: number | null = null;
  paymentMethod: number | null = 1;
  paymentDate = new Date().toISOString().split('T')[0];
  amount: number | null = null;
  chequeNo = '';
  txnRef = '';
  remarks = '';

  editable = computed(() => this.selectedNo() === null);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.payments()
      .filter((p) => (p.payment_id || '').toLowerCase().includes(t) || (p.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.payment_no ?? 0) - (a.payment_no ?? 0));
  });

  pager = makePaginator(this.filtered, { sortKey: (x: Payment) => x.payment_no ?? 0 });

  allocatedTotal = computed(() => this.openRows().reduce((s, r) => s + (Number(r.alloc) || 0), 0));
  unallocated    = computed(() => (Number(this.amount) || 0) - this.allocatedTotal());

  readonly allocData = computed<AllocRow[]>(() => this.openRows());

  readonly allocGrid: GridConfig<AllocRow> = {
    gridKey: 'PUR_1104_PAYMENT_ALLOC_GRID',
    rowIdField: 'invoice_no',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    // Open bills come from the server — the operator allocates against them, never adds or
    // removes a row. Only the Allocate column is editable, and only while the payment is a draft.
    canAdd: () => false,
    canEdit: () => this.status() === 1 && this.permissionService.canInsert(),
    canDeleteRow: () => false,
    toolbar: {
      title: 'Open Bills', showAdd: false, showDelete: false, showSearch: true,
      showExport: true, showColumnChooser: true, searchPlaceholder: 'Search bills...',
    },
    columns: [
      GridColumns.text<AllocRow>('invoice_id', 'Invoice').width(160).readOnly().build(),
      GridColumns.text<AllocRow>('supplier_invoice_no', 'Supplier Bill').width(160).readOnly().build(),
      GridColumns.date<AllocRow>('invoice_date', 'Date').width(130).readOnly().build(),
      GridColumns.decimal<AllocRow>('grand_total', 'Grand Total').width(140).readOnly().build(),
      GridColumns.decimal<AllocRow>('due_amount', 'Due').width(130).readOnly().sum().footer('Total').build(),
      // Editable so a bill can be settled by hand; Auto-allocate just fills the same column.
      GridColumns.decimal<AllocRow>('alloc', 'Allocate').width(140).min(0).sum().build(),
    ],
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('PUR_1104'); this.loadSuppliers(); this.load(); });
  }

  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  methodLabel(v: number | null | undefined): string { return this.methods.find((m) => m.value === v)?.label ?? ''; }

  loadSuppliers(): void { this.data.suppliers().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.suppliers.set(r.data); } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.payments.set(res.data);
          const target = reselectNo != null ? res.data.find((p) => p.payment_no === reselectNo) : null;
          if (target) this.select(target); else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load payments'),
    });
  }

  onSupplierChange(): void {
    this.openRows.set([]);
    if (!this.supplierNo) return;
    this.data.openInvoices(this.supplierNo).subscribe({
      next: (r) => { if (isSuccess(r) && r.data) this.openRows.set(r.data.map((i) => ({ ...i, alloc: 0 }))); },
    });
  }

  /** Manual allocation typed into the grid — the form owns the rows (externalRowState). */
  onAllocChange(row: AllocRow): void {
    this.openRows.update((rows) => rows.map((r) => (r.invoice_no === row.invoice_no ? { ...r, ...row } : r)));
  }

  autoAllocate(): void {
    let remaining = Number(this.amount) || 0;
    this.openRows.update((rows) => rows.map((r) => {
      const give = Math.min(remaining, Number(r.due_amount) || 0);
      remaining -= give;
      return { ...r, alloc: Math.round(give * 10000) / 10000 };
    }));
  }

  select(p: Payment): void {
    if (!p.payment_no) { this.onNew(); return; }
    this.data.detail(p.payment_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.payment_no ?? null);
          this.status.set(d.status ?? 2);
          this.supplierNo = d.supplier_no; this.paymentMethod = d.payment_method;
          this.paymentDate = d.payment_date; this.amount = d.amount;
          this.chequeNo = d.cheque_no ?? ''; this.txnRef = d.txn_ref ?? ''; this.remarks = d.remarks ?? '';
          this.openRows.set((d.allocations ?? []).map((a) => ({
            invoice_no: a.invoice_no as number, invoice_id: a.invoice_id ?? '', supplier_invoice_no: '',
            invoice_date: a.invoice_date ?? '', grand_total: 0, due_amount: Number(a.invoice_due) || 0, alloc: Number(a.allocated_amount) || 0,
          })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.supplierNo = null; this.paymentMethod = 1; this.paymentDate = new Date().toISOString().split('T')[0];
    this.amount = null; this.chequeNo = ''; this.txnRef = ''; this.remarks = '';
    this.openRows.set([]);
  }

  onSave(): void {
    if (!this.supplierNo) { this.toastr.warning('Select a supplier'); return; }
    if (!this.amount || this.amount <= 0) { this.toastr.warning('Enter a positive amount'); return; }
    if (this.allocatedTotal() - (Number(this.amount) || 0) > 0.005) { this.toastr.warning('Allocations exceed the payment amount'); return; }
    this.alert.confirm('Post this supplier payment? It debits the payable and posts the GL.', 'Post Payment', 'primary')
      .subscribe((ok) => { if (ok) this.doSave(); });
  }

  private doSave(): void {
    this.isSaving.set(true);
    const payload: Payment = {
      payment_date: this.paymentDate, supplier_no: this.supplierNo, payment_method: this.paymentMethod,
      amount: Number(this.amount), cheque_no: this.chequeNo || null, txn_ref: this.txnRef || null, remarks: this.remarks || null,
      allocations: this.openRows().filter((r) => (Number(r.alloc) || 0) > 0).map((r) => ({ invoice_no: r.invoice_no, allocated_amount: Number(r.alloc) })),
    };
    this.data.create(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success(`Payment ${res.data.payment_id} posted`); this.load(res.data.payment_no ?? null); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Payment failed'),
    });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this payment? The payable and GL will be restored.', 'Cancel Payment', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from PUR_1104').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Payment cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }
}

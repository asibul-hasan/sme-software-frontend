import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { Sal1102DataService, Receipt, OpenInvoice, SalOption } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';

import { salConstants } from '../../constants/sal.constants';
import { ToastrService } from 'ngx-toastr';

interface AllocRow extends OpenInvoice { alloc: number; }

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sal1102',
  standalone: true,
  imports: [DecimalInputDirective, CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Sal1102DataService],
  templateUrl: './sal1102.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sal1102Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Sal1102DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly methods = salConstants.paymentMethods;
  readonly statusOptions = salConstants.receiptStatuses;

  receipts  = signal<Receipt[]>([]);
  customers = signal<SalOption[]>([]);
  openRows  = signal<AllocRow[]>([]);
  selectedNo = signal<number | null>(null);
  status     = signal<number>(1);
  searchTerm = signal('');
  isLoading  = signal(false);
  isSaving   = signal(false);

  customerNo: number | null = null;
  paymentMethod: number | null = 1;
  receiptDate = new Date().toISOString().split('T')[0];
  amount: number | null = null;
  txnRef = '';
  remarks = '';

  editable = computed(() => this.selectedNo() === null);

  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.receipts()
      .filter((p) => (p.receipt_id || '').toLowerCase().includes(t) || (p.customer_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.receipt_no ?? 0) - (a.receipt_no ?? 0));
  });

  allocatedTotal = computed(() => this.openRows().reduce((s, r) => s + (Number(r.alloc) || 0), 0));
  unallocated    = computed(() => (Number(this.amount) || 0) - this.allocatedTotal());

  readonly allocColumns: ColumnDef[] = [
    { title: 'Invoice', field: 'invoice_id', cellType: 'text', width: '150px' },
    { title: 'Date', field: 'invoice_date', cellType: 'date', dateFormat: 'dd MMM yyyy', width: '130px' },
    { title: 'Grand Total', field: 'grand_total', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Due', field: 'due_amount', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Allocate', field: 'alloc', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly allocConfig: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true, showColumnToggle: false,
    showExport: false, showTitle: false, maxHeight: '300px', showActions: false,
  };
  readonly allocData = computed(() => this.openRows() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('SAL_1102'); this.loadCustomers(); this.load(); });
  }

  statusLabel(v: number | null | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  methodLabel(v: number | null | undefined): string { return this.methods.find((m) => m.value === v)?.label ?? ''; }

  loadCustomers(): void { this.data.customers().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.customers.set(r.data); } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.receipts.set(res.data);
          const target = reselectNo != null ? res.data.find((p) => p.receipt_no === reselectNo) : null;
          if (target) this.select(target); else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load receipts'),
    });
  }

  onCustomerChange(): void {
    this.openRows.set([]);
    if (!this.customerNo) return;
    this.data.openInvoices(this.customerNo).subscribe({
      next: (r) => { if (isSuccess(r) && r.data) this.openRows.set(r.data.map((i) => ({ ...i, alloc: 0 }))); },
    });
  }

  autoAllocate(): void {
    let remaining = Number(this.amount) || 0;
    this.openRows.update((rows) => rows.map((r) => {
      const give = Math.min(remaining, Number(r.due_amount) || 0);
      remaining -= give;
      return { ...r, alloc: Math.round(give * 10000) / 10000 };
    }));
  }

  select(p: Receipt): void {
    if (!p.receipt_no) { this.onNew(); return; }
    this.data.detail(p.receipt_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.receipt_no ?? null);
          this.status.set(d.status ?? 2);
          this.customerNo = d.customer_no; this.paymentMethod = d.payment_method;
          this.receiptDate = d.receipt_date; this.amount = d.amount;
          this.txnRef = d.txn_ref ?? ''; this.remarks = d.remarks ?? '';
          this.openRows.set((d.allocations ?? []).map((a) => ({
            invoice_no: a.invoice_no as number, invoice_id: a.invoice_id ?? '',
            invoice_date: a.invoice_date ?? '', grand_total: 0, due_amount: Number(a.invoice_due) || 0, alloc: Number(a.allocated_amount) || 0,
          })));
        }
      },
    });
  }

  onNew(): void {
    this.selectedNo.set(null); this.status.set(1);
    this.customerNo = null; this.paymentMethod = 1; this.receiptDate = new Date().toISOString().split('T')[0];
    this.amount = null; this.txnRef = ''; this.remarks = '';
    this.openRows.set([]);
  }

  onSave(): void {
    if (!this.customerNo) { this.toastr.warning('Select a customer'); return; }
    if (!this.amount || this.amount <= 0) { this.toastr.warning('Enter a positive amount'); return; }
    if (this.allocatedTotal() - (Number(this.amount) || 0) > 0.005) { this.toastr.warning('Allocations exceed the receipt amount'); return; }
    this.alert.confirm('Post this receipt? It credits AR (reduces due) and posts the GL.', 'Post Receipt', 'primary')
      .subscribe((ok) => { if (ok) this.doSave(); });
  }

  private doSave(): void {
    this.isSaving.set(true);
    const payload: Receipt = {
      receipt_date: this.receiptDate, customer_no: this.customerNo, payment_method: this.paymentMethod,
      amount: Number(this.amount), txn_ref: this.txnRef || null, remarks: this.remarks || null,
      allocations: this.openRows().filter((r) => (Number(r.alloc) || 0) > 0).map((r) => ({ invoice_no: r.invoice_no, allocated_amount: Number(r.alloc) })),
    };
    this.data.create(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) { this.toastr.success(`Receipt ${res.data.receipt_id} posted`); this.load(res.data.receipt_no ?? null); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Receipt failed'),
    });
  }

  cancel(): void {
    const no = this.selectedNo(); if (!no) return;
    this.alert.confirm('Cancel this receipt? AR and the GL will be restored.', 'Cancel Receipt', 'warn')
      .subscribe((ok) => { if (ok) this.data.cancel(no, 'Cancelled from SAL_1102').subscribe({ next: (r) => { if (isSuccess(r)) { this.toastr.success('Receipt cancelled'); this.load(no); } }, error: (e) => this.toastr.error(e?.error?.message ?? 'Cancel failed') }); });
  }
}

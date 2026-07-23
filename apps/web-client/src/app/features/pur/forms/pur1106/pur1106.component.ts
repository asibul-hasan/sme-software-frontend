import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { isSuccess } from '../../../../core/models/response.model';
import { makePaginator } from '../../../../core/utils/paginator';

import { purConstants } from '../../constants/pur.constants';
import { ToastrService } from 'ngx-toastr';

import { LandedCost, LandedCostAlloc, Pur1106DataService } from './services/data.service';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1106',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Pur1106DataService],
  templateUrl: './pur1106.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class Pur1106Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data = inject(Pur1106DataService);
  private toastr = inject(ToastrService);
  private alert = inject(AlertService);

  readonly costTypes = purConstants.landedCostTypes;
  readonly allocBases = purConstants.landedAllocBases;
  readonly statusOptions = purConstants.landedStatuses;

  landedCosts = signal<LandedCost[]>([]);
  postedInvoices = signal<LandedCost[]>([]);
  allocations = signal<LandedCostAlloc[]>([]);
  selectedNo = signal<number | null>(null);
  status = signal<number>(1);
  searchTerm = signal('');
  isLoading = signal(false);
  isSaving = signal(false);

  costDate = new Date().toISOString().split('T')[0];
  invoiceNo: number | null = null;
  costType = 1;
  amount: number | null = null;
  allocBasis = 1;
  remarks = '';

  editable = computed(() => this.selectedNo() === null || this.status() === 1);
  filtered = computed(() => {
    const t = this.searchTerm().toLowerCase().trim();
    return this.landedCosts()
      .filter((x) => (x.landed_cost_id || '').toLowerCase().includes(t) || (x.invoice_id || '').toLowerCase().includes(t) || (x.supplier_name || '').toLowerCase().includes(t))
      .sort((a, b) => (b.landed_cost_no ?? 0) - (a.landed_cost_no ?? 0));
  });
  pager = makePaginator(this.filtered, { sortKey: (x: LandedCost) => x.landed_cost_no ?? 0 });

  selectedInvoice = computed(() => this.postedInvoices().find((i) => i.invoice_no === this.invoiceNo) ?? null);
  totalAllocated = computed(() => this.allocations().reduce((s, r) => s + (Number(r.allocated_amount) || 0), 0));
  readonly allocTableData = computed(() => this.allocations() as unknown as Record<string, unknown>[]);

  readonly allocColumns: ColumnDef[] = [
    { title: 'Line', field: 'line_no', cellType: 'number', width: '70px' },
    { title: 'Product', field: 'product_name', cellType: 'text', width: '240px', pin: 'left' },
    { title: 'Qty Base', field: 'qty_base', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Value', field: 'taxable_amount', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Prev Landed', field: 'previous_alloc', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'This Cost', field: 'allocated_amount', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Final Unit Cost', field: 'final_unit_cost', cellType: 'decimal', align: 'right', precision: 4 },
  ];
  readonly allocConfig: Partial<TableConfig> = {
    showSearch: false,
    pagination: false,
    dense: true,
    striped: true,
    showColumnToggle: false,
    showExport: false,
    showTitle: false,
    maxHeight: '380px',
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('PUR_1106');
    this.loadInvoices();
    this.load();
  }

  statusLabel(v: number | undefined): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
  costTypeLabel(v: number | undefined): string { return this.costTypes.find((s) => s.value === v)?.label ?? ''; }

  loadInvoices(): void {
    this.data.postedInvoices().subscribe({ next: (res) => { if (isSuccess(res) && res.data) this.postedInvoices.set(res.data); } });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.list().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.landedCosts.set(res.data);
          const target = reselectNo != null ? res.data.find((x) => x.landed_cost_no === reselectNo) : null;
          if (target) this.select(target);
          else this.onNew();
        }
      },
      error: () => this.toastr.error('Failed to load landed costs'),
    });
  }

  select(row: LandedCost): void {
    if (!row.landed_cost_no) { this.onNew(); return; }
    this.data.detail(row.landed_cost_no).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.selectedNo.set(d.landed_cost_no ?? null);
          this.status.set(d.status ?? 1);
          this.costDate = d.cost_date;
          this.invoiceNo = d.invoice_no;
          this.costType = d.cost_type ?? 1;
          this.amount = Number(d.amount) || 0;
          this.allocBasis = d.alloc_basis ?? 1;
          this.remarks = d.remarks ?? '';
          this.allocations.set(d.allocations ?? []);
        }
      },
      error: () => this.toastr.error('Failed to load landed cost'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.status.set(1);
    this.costDate = new Date().toISOString().split('T')[0];
    this.invoiceNo = null;
    this.costType = 1;
    this.amount = null;
    this.allocBasis = 1;
    this.remarks = '';
    this.allocations.set([]);
  }

  preview(): void {
    if (!this.invoiceNo || !this.amount || this.amount <= 0) { this.toastr.warning('Select invoice and amount first'); return; }
    this.data.preview(this.invoiceNo, Number(this.amount), this.allocBasis).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.allocations.set(res.data); },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Preview failed'),
    });
  }

  private buildPayload(): LandedCost {
    return {
      landed_cost_no: this.selectedNo() ?? undefined,
      cost_date: this.costDate,
      invoice_no: this.invoiceNo,
      cost_type: this.costType,
      amount: Number(this.amount) || 0,
      alloc_basis: this.allocBasis,
      remarks: this.remarks || null,
      allocations: this.allocations(),
    };
  }

  onSave(): void {
    if (!this.invoiceNo) { this.toastr.warning('Select a posted invoice'); return; }
    if (!this.amount || this.amount <= 0) { this.toastr.warning('Enter landed cost amount'); return; }
    this.isSaving.set(true);
    const payload = this.buildPayload();
    const obs = this.selectedNo() ? this.data.update(this.selectedNo()!, payload) : this.data.save(payload);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success('Landed cost saved');
          this.load(res.data.landed_cost_no ?? this.selectedNo());
        }
      },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Save failed'),
    });
  }

  apply(): void {
    const no = this.selectedNo();
    if (!no) { this.toastr.warning('Save the landed cost first'); return; }
    this.alert.confirm('Apply this landed cost? Invoice line costs and GL will be updated.', 'Apply Landed Cost', 'primary')
      .subscribe((ok) => {
        if (ok) this.data.apply(no).subscribe({
          next: (res) => { if (isSuccess(res)) { this.toastr.success('Landed cost applied'); this.load(no); this.loadInvoices(); } },
          error: (e) => this.toastr.error(e?.error?.message ?? 'Apply failed'),
        });
      });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.alert.deleteConfirm().subscribe((ok) => {
      if (ok) this.data.remove(no).subscribe({
        next: (res) => { if (isSuccess(res)) { this.toastr.success('Landed cost deleted'); this.load(null); } },
        error: (e) => this.toastr.error(e?.error?.message ?? 'Delete failed'),
      });
    });
  }
}

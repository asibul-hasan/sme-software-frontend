import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { CommonLookupService, LookupOption } from '../../../../core/services/common-lookup.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { BatchExpiryRow, Inv2004DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2004',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, CommonTableComponent],
  providers: [Inv2004DataService],
  templateUrl: './inv2004.component.html',
})
export class Inv2004Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data = inject(Inv2004DataService);
  private lookup = inject(CommonLookupService);
  private toastr = inject(ToastrService);

  warehouses = signal<LookupOption[]>([]);
  products = signal<LookupOption[]>([]);
  rows = signal<BatchExpiryRow[]>([]);
  isLoading = signal(false);

  warehouseNo: number | null = null;
  productNo: number | null = null;
  status: string | null = null;
  nearDays = 30;

  statusOptions = [
    { value: null, label: 'All' },
    { value: 'expired', label: 'Expired' },
    { value: 'near_expiry', label: 'Near Expiry' },
    { value: 'ok', label: 'OK' },
    { value: 'no_expiry', label: 'No Expiry' },
  ];

  expiredCount = computed(() => this.rows().filter((r) => r.expiry_status === 'expired').length);
  nearCount = computed(() => this.rows().filter((r) => r.expiry_status === 'near_expiry').length);
  onHand = computed(() => this.rows().reduce((s, r) => s + (Number(r.qty_on_hand) || 0), 0));
  value = computed(() => this.rows().reduce((s, r) => s + (Number(r.stock_value) || 0), 0));
  tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

  readonly columns: ColumnDef[] = [
    { title: 'Product', field: 'product_name', cellType: 'text', width: '240px', pin: 'left' },
    { title: 'Batch', field: 'batch_code', cellType: 'text', width: '140px' },
    { title: 'Warehouse', field: 'warehouse_name', cellType: 'text', width: '160px' },
    { title: 'Expiry', field: 'expiry_date', cellType: 'date', width: '120px' },
    { title: 'Days', field: 'days_to_expiry', cellType: 'number', align: 'right', width: '80px' },
    { title: 'Status', field: 'expiry_status', cellType: 'badge', width: '120px', badgeConfig: (v) => this.badge(String(v)) },
    { title: 'On Hand', field: 'qty_on_hand', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Available', field: 'qty_available', cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Avg Cost', field: 'received_cost', cellType: 'decimal', align: 'right', precision: 4 },
    { title: 'Value', field: 'stock_value', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];

  readonly config: Partial<TableConfig> = {
    showSearch: true,
    pagination: true,
    defaultPageSize: 25,
    dense: true,
    striped: true,
    showColumnToggle: true,
    showExport: true,
    showTitle: false,
    maxHeight: 'calc(100vh - 310px)',
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('INV_2004');
    this.lookup.getWarehouses().subscribe((list) => this.warehouses.set(list));
    this.lookup.getProducts().subscribe((list) => this.products.set(list));
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.data.batches({ warehouseNo: this.warehouseNo, productNo: this.productNo, status: this.status, nearDays: this.nearDays })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => { if (isSuccess(res) && res.data) this.rows.set(res.data); },
        error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to load batches'),
      });
  }

  private badge(v: string): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } {
    if (v === 'expired') return { label: 'Expired', variant: 'danger' };
    if (v === 'near_expiry') return { label: 'Near Expiry', variant: 'warning' };
    if (v === 'ok') return { label: 'OK', variant: 'success' };
    return { label: 'No Expiry', variant: 'neutral' };
  }
}

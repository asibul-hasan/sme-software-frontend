import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { CommonLookupService, LookupOption } from '../../../../core/services/common-lookup.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';
import { BatchExpiryRow, Inv2004DataService } from './services/data.service';
import { invConstants } from '../../constants/inv.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2004',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv2004DataService],
  templateUrl: './inv2004.component.html',
  styles: [`:host { display: block; height: 100%; }`],
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

  readonly statusOptions = invConstants.batchExpiryStatuses;

  expiredCount = computed(() => this.rows().filter((r) => r.expiry_status === 'expired').length);
  nearCount = computed(() => this.rows().filter((r) => r.expiry_status === 'near_expiry').length);
  onHand = computed(() => this.rows().reduce((s, r) => s + (Number(r.qty_on_hand) || 0), 0));
  value = computed(() => this.rows().reduce((s, r) => s + (Number(r.stock_value) || 0), 0));

  readonly gridConfig: GridConfig<BatchExpiryRow> = {
    gridKey: 'INV_2004_BATCH_EXPIRY_GRID',
    rowIdField: 'batch_no' as any,
    height: '100%',
    selectionMode: 'none',
    externalRowState: false,
    showPagination: true,
    pageSize: 50,
    toolbar: {
      title: 'Batch Stock',
      showAdd: false,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search batches...',
    },
    columns: [
      GridColumns.text<BatchExpiryRow>('product_name', 'Product')
        .pinned('left')
        .minWidth(220)
        .flex(1)
        .build(),
      GridColumns.text<BatchExpiryRow>('batch_code', 'Batch')
        .width(140)
        .build(),
      GridColumns.text<BatchExpiryRow>('warehouse_name', 'Warehouse')
        .width(160)
        .build(),
      GridColumns.date<BatchExpiryRow>('expiry_date', 'Expiry')
        .width(120)
        .build(),
      GridColumns.number<BatchExpiryRow>('days_to_expiry', 'Days')
        .width(90)
        .build(),
      GridColumns.text<BatchExpiryRow>('expiry_status', 'Status')
        .valueFormatter((val) => {
          if (val === 'expired') return 'Expired';
          if (val === 'near_expiry') return 'Near Expiry';
          if (val === 'ok') return 'OK';
          return 'No Expiry';
        })
        .width(130)
        .build(),
      GridColumns.decimal<BatchExpiryRow>('qty_on_hand', 'On Hand')
        .width(120)
        .sum()
        .footer('Total On Hand')
        .build(),
      GridColumns.decimal<BatchExpiryRow>('qty_available', 'Available')
        .width(120)
        .build(),
      GridColumns.decimal<BatchExpiryRow>('received_cost', 'Avg Cost')
        .width(120)
        .build(),
      GridColumns.decimal<BatchExpiryRow>('stock_value', 'Value')
        .width(140)
        .sum()
        .footer('Total Value')
        .build(),
    ],
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
}

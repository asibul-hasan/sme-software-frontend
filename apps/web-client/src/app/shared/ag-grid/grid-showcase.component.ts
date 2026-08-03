import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ErpGridComponent } from './components/erp-grid.component';
import { GridConfig } from './models/grid-config.model';
import { GridColumns } from './utils/column-builder';
import { GridApiService } from './services/grid-api.service';
import { GridCalculationService } from './services/grid-calculation.service';
import { GridBatchPayload } from './models/grid-row-state.enum';

interface SalesOrderLine {
  id?: number;
  item_code: string;
  item_name: string;
  unit_no: number;
  qty: number;
  unit_price: number;
  discount_amount: number;
  net_amount: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-grid-showcase',
  standalone: true,
  imports: [CommonModule, MatIconModule, ErpGridComponent],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 class="fw-bold mb-1 d-flex align-items-center gap-2">
            <mat-icon class="text-primary">grid_on</mat-icon>
            Aidly ERP Enterprise AG Grid Framework Showcase
          </h3>
          <p class="text-muted mb-0">
            Enterprise-grade grid platform featuring fluent column definitions, cell editors, live calculation engine, and transactional SQL_STATE batch payload tracking.
          </p>
        </div>
        <button type="button" class="btn btn-success d-flex align-items-center gap-1" (click)="inspectBatchPayload()">
          <mat-icon style="font-size:18px; width:18px; height:18px">dataset</mat-icon> Inspect Batch Payload
        </button>
      </div>

      <!-- Grid Container -->
      <div class="mb-4" style="height: 450px">
        <app-erp-grid
          [config]="gridConfig"
          [data]="initialData"
          height="100%"
          (ready)="onGridReady($event)"
        ></app-erp-grid>
      </div>

      <!-- Live Batch Payload Inspector -->
      @if (batchPayload()) {
        <div class="card border shadow-sm">
          <div class="card-header bg-dark text-white fw-bold d-flex align-items-center gap-2">
            <mat-icon style="font-size:18px; width:18px; height:18px">code</mat-icon>
            Live SQL_STATE Transaction Payload (gridApiService.getDirtyRows())
          </div>
          <div class="card-body p-0">
            <pre class="bg-light p-3 m-0 text-success fw-bold" style="max-height: 250px; overflow-y: auto; font-size: 13px">{{ batchPayload() | json }}</pre>
          </div>
        </div>
      }
    </div>
  `
})
export class GridShowcaseComponent {
  private calcService = inject(GridCalculationService);
  public apiService?: GridApiService<SalesOrderLine>;
  public batchPayload = signal<GridBatchPayload<SalesOrderLine> | null>(null);

  readonly units = [
    { value: 1, label: 'Pcs (Pieces)' },
    { value: 2, label: 'Box (12 Pcs)' },
    { value: 3, label: 'Kg (Kilogram)' },
  ];

  readonly gridConfig: GridConfig<SalesOrderLine> = {
    gridKey: 'ERP_SALES_ORDER_LINE_GRID',
    showPagination: true,
    pageSize: 10,
    newRowDefaults: () => ({ qty: 1, unit_price: 0, discount_amount: 0, net_amount: 0 }),
    toolbar: {
      title: 'Sales Order Line Items',
      showAdd: true,
      showDelete: true,
      showExport: true,
      showSearch: true,
      showReset: true,
    },
    columns: [
      GridColumns.status().build(),
      GridColumns.text<SalesOrderLine>('item_code', 'Item Code').required().width(130).footer('Total').build(),
      GridColumns.text<SalesOrderLine>('item_name', 'Item Name').flex(1).minWidth(200).build(),
      GridColumns.lookup<SalesOrderLine>('unit_no', 'UOM', this.units).width(160).build(),
      GridColumns.number<SalesOrderLine>('qty', 'Quantity')
        .width(110)
        .sum()
        .onChange((newQty, _, row) => this.recalculateRow(row, 'qty', newQty))
        .build(),
      GridColumns.currency<SalesOrderLine>('unit_price', 'Price')
        .width(130)
        .onChange((newPrice, _, row) => this.recalculateRow(row, 'unit_price', newPrice))
        .build(),
      GridColumns.currency<SalesOrderLine>('discount_amount', 'Discount')
        .width(120)
        .sum()
        .onChange((newDisc, _, row) => this.recalculateRow(row, 'discount_amount', newDisc))
        .build(),
      GridColumns.currency<SalesOrderLine>('net_amount', 'Net Amount').readOnly().width(140).sum().build(),
      GridColumns.action().build(),
    ]
  };

  readonly initialData: SalesOrderLine[] = [
    { id: 101, item_code: 'ITM-001', item_name: 'Dell XPS 15 Laptop', unit_no: 1, qty: 2, unit_price: 1500, discount_amount: 100, net_amount: 2900 },
    { id: 102, item_code: 'ITM-002', item_name: 'Logitech MX Master 3S Mouse', unit_no: 1, qty: 5, unit_price: 99, discount_amount: 0, net_amount: 495 },
    { id: 103, item_code: 'ITM-003', item_name: 'LG 27" 4K Monitor', unit_no: 1, qty: 3, unit_price: 450, discount_amount: 50, net_amount: 1300 },
  ];

  onGridReady(api: GridApiService<SalesOrderLine>): void {
    this.apiService = api;
  }

  private recalculateRow(row: SalesOrderLine, fieldChanged: keyof SalesOrderLine, val: any): void {
    if (!this.apiService) return;
    const temp = { ...row, [fieldChanged]: Number(val || 0) };
    const updated = this.calcService.calculateLineItem(temp, {
      qtyField: 'qty',
      unitPriceField: 'unit_price',
      discountField: 'discount_amount',
      netAmountField: 'net_amount'
    });
    this.apiService.updateCellValue((row as any).__uid, 'net_amount', updated.net_amount);
  }

  inspectBatchPayload(): void {
    if (this.apiService) {
      this.batchPayload.set(this.apiService.getDirtyRows());
    }
  }
}

import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ErpGridComponent } from '../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../shared/ag-grid/utils/column-builder';
import { GridApiService } from '../../shared/ag-grid/services/grid-api.service';
import { GridCalculationService } from '../../shared/ag-grid/services/grid-calculation.service';
import { GridBatchPayload } from '../../shared/ag-grid/models/grid-row-state.enum';

import { ErpInputComponent } from '../../shared/erp-ui/controls/erp-input.component';
import { ErpCurrencyComponent } from '../../shared/erp-ui/controls/erp-currency.component';
import { ErpSelectComponent, ErpSelectOption } from '../../shared/erp-ui/controls/erp-select.component';
import { ErpStatusComponent } from '../../shared/erp-ui/controls/erp-status.component';
import { ErpCalculationPanelComponent } from '../../shared/erp-ui/calculation/erp-calculation-panel.component';
import { ErpDialogService } from '../../shared/erp-ui/services/erp-dialog.service';
import { ErpNotificationService } from '../../shared/erp-ui/services/erp-notification.service';

interface InvoiceLine {
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
  selector: 'app-grid-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ErpGridComponent,
    ErpInputComponent,
    ErpCurrencyComponent,
    ErpSelectComponent,
    ErpStatusComponent,
    ErpCalculationPanelComponent,
  ],
  template: `
    <div class="container-fluid p-4">
      <!-- Page Header -->
      <div class="card border-0 shadow-sm p-3 mb-4 bg-white rounded-3">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h3 class="fw-bold mb-0 text-slate-800">Aidly ERP Complete UI Framework Demo</h3>
              <erp-status [status]="formStatus()"></erp-status>
            </div>
            <p class="text-muted mb-0 small">
              Route: <code>/grid-demo</code> · Universal ERP Component Suite (Grid, Controls, Dialogs, Calculations, Command Palette).
            </p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <kbd class="bg-dark text-white px-3 py-2 rounded shadow-sm fs-6">Press Ctrl+K for Command Palette</kbd>
            <button type="button" class="btn btn-primary d-flex align-items-center gap-1" (click)="onSave()">
              <mat-icon style="font-size:18px; width:18px; height:18px">save</mat-icon> Save Transaction
            </button>
          </div>
        </div>
      </div>

      <!-- Master Form Section (ERP Controls Wrapper) -->
      <div class="card border shadow-sm p-3 mb-4 bg-white">
        <h5 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
          <mat-icon class="text-primary">receipt_long</mat-icon>
          Master Transaction Header
        </h5>
        <div class="row g-3">
          <div class="col-md-3">
            <erp-input label="Document No" [(ngModel)]="docNo" [readOnly]="true"></erp-input>
          </div>
          <div class="col-md-3">
            <erp-input label="Customer Name" [(ngModel)]="customerName" [required]="true"></erp-input>
          </div>
          <div class="col-md-3">
            <erp-select label="Branch Office" [(ngModel)]="branchNo" [options]="branches"></erp-select>
          </div>
          <div class="col-md-3">
            <erp-currency label="Credit Limit" [(ngModel)]="creditLimit" symbol="$"></erp-currency>
          </div>
        </div>
      </div>

      <!-- Grid + Summary Panel Layout -->
      <div class="row g-3 mb-4">
        <!-- AG Grid Enterprise Framework -->
        <div class="col-lg-9">
          <div style="height: 420px">
            <app-erp-grid
              [config]="gridConfig"
              [data]="initialLines"
              height="100%"
              (ready)="onGridReady($event)"
            ></app-erp-grid>
          </div>
        </div>

        <!-- Right Calculation Summary Panel -->
        <div class="col-lg-3">
          <erp-calculation-panel
            symbol="$"
            [subtotal]="subtotal()"
            [discount]="totalDiscount()"
            [taxRate]="10"
            [taxAmount]="taxAmount()"
            [grandTotal]="grandTotal()"
          ></erp-calculation-panel>

          <!-- Interactive Dialog & Notification Service Testers -->
          <div class="card border shadow-sm p-3 mt-3 bg-white">
            <h6 class="fw-bold mb-2 text-dark border-bottom pb-1">Framework Actions</h6>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="testDeleteDialog()">
                Test Confirm Delete Dialog
              </button>
              <button type="button" class="btn btn-sm btn-outline-success" (click)="testApprovalDialog()">
                Test Approve Dialog
              </button>
              <button type="button" class="btn btn-sm btn-outline-info" (click)="testNotification()">
                Test Notification Toast
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Transaction JSON Payload Inspector -->
      @if (batchPayload()) {
        <div class="card border shadow-sm">
          <div class="card-header bg-dark text-white fw-bold d-flex align-items-center gap-2">
            <mat-icon style="font-size:18px; width:18px; height:18px">data_object</mat-icon>
            Live Backend Batch Payload JSON (gridApiService.getDirtyRows())
          </div>
          <div class="card-body p-0">
            <pre class="bg-light p-3 m-0 text-success fw-bold" style="max-height: 250px; overflow-y: auto; font-size: 13px">{{ batchPayload() | json }}</pre>
          </div>
        </div>
      }
    </div>
  `
})
export class GridDemoComponent {
  private calcService = inject(GridCalculationService);
  private dialogService = inject(ErpDialogService);
  private notifyService = inject(ErpNotificationService);

  public apiService?: GridApiService<InvoiceLine>;
  public formStatus = signal<string>('DRAFT');
  public batchPayload = signal<GridBatchPayload<InvoiceLine> | null>(null);

  // Master Form Data
  public docNo = 'INV-2026-0089';
  public customerName = 'Acme Global Logistics Ltd.';
  public branchNo = 1;
  public creditLimit = 50000;

  readonly branches: ErpSelectOption[] = [
    { value: 1, label: 'Main Corporate HQ (Dhaka)' },
    { value: 2, label: 'Chittagong Port Branch' },
    { value: 3, label: 'Sylhet Regional Branch' },
  ];

  readonly units = [
    { value: 1, label: 'Pcs (Pieces)' },
    { value: 2, label: 'Box (12 Pcs)' },
    { value: 3, label: 'Carton (100 Pcs)' },
  ];

  // Grid Configuration
  readonly gridConfig: GridConfig<InvoiceLine> = {
    gridKey: 'DEMO_INVOICE_GRID',
    toolbar: {
      title: 'Invoice Line Items',
      showAdd: true,
      showDelete: true,
      showExport: true,
      showSearch: true,
      showReset: true,
    },
    columns: [
      GridColumns.status().build(),
      GridColumns.text<InvoiceLine>('item_code', 'Item Code').required().width(130).build(),
      GridColumns.text<InvoiceLine>('item_name', 'Item Description').flex(1).minWidth(200).build(),
      GridColumns.lookup<InvoiceLine>('unit_no', 'UOM', this.units).width(150).build(),
      GridColumns.number<InvoiceLine>('qty', 'Qty')
        .width(100)
        .onChange((newQty, _, row) => this.recalculateRow(row, 'qty', newQty))
        .build(),
      GridColumns.currency<InvoiceLine>('unit_price', 'Price ($)')
        .width(120)
        .onChange((newPrice, _, row) => this.recalculateRow(row, 'unit_price', newPrice))
        .build(),
      GridColumns.currency<InvoiceLine>('discount_amount', 'Disc ($)')
        .width(110)
        .onChange((newDisc, _, row) => this.recalculateRow(row, 'discount_amount', newDisc))
        .build(),
      GridColumns.currency<InvoiceLine>('net_amount', 'Net Total ($)').readOnly().width(130).build(),
      GridColumns.action().build(),
    ]
  };

  readonly initialLines: InvoiceLine[] = [
    { id: 1, item_code: 'SRV-001', item_name: 'Enterprise ERP Implementation Service', unit_no: 1, qty: 1, unit_price: 12000, discount_amount: 500, net_amount: 11500 },
    { id: 2, item_code: 'HDW-002', item_name: 'High Performance Database Server', unit_no: 1, qty: 2, unit_price: 3500, discount_amount: 200, net_amount: 6800 },
    { id: 3, item_code: 'LIC-003', item_name: 'Annual ERP User License (50 Users)', unit_no: 1, qty: 1, unit_price: 4500, discount_amount: 0, net_amount: 4500 },
  ];

  // Calculated Signals
  public subtotal = signal<number>(22800);
  public totalDiscount = signal<number>(700);
  public taxAmount = signal<number>(2280);
  public grandTotal = signal<number>(25080);

  onGridReady(api: GridApiService<InvoiceLine>): void {
    this.apiService = api;
    this.updateTotals();
  }

  private recalculateRow(row: InvoiceLine, field: keyof InvoiceLine, val: any): void {
    if (!this.apiService) return;
    const temp = { ...row, [field]: Number(val || 0) };
    const updated = this.calcService.calculateLineItem(temp, {
      qtyField: 'qty',
      unitPriceField: 'unit_price',
      discountField: 'discount_amount',
      netAmountField: 'net_amount'
    });
    this.apiService.updateCellValue((row as any).__uid, 'net_amount', updated.net_amount);
    this.updateTotals();
  }

  private updateTotals(): void {
    if (!this.apiService) return;
    const rows = this.apiService.getAllRows();
    const sub = rows.reduce((sum, r) => sum + (r.qty * r.unit_price), 0);
    const disc = rows.reduce((sum, r) => sum + (r.discount_amount || 0), 0);
    const net = Math.max(0, sub - disc);
    const tax = (net * 10) / 100;

    this.subtotal.set(sub);
    this.totalDiscount.set(disc);
    this.taxAmount.set(tax);
    this.grandTotal.set(net + tax);
    this.batchPayload.set(this.apiService.getDirtyRows());
  }

  async testDeleteDialog(): Promise<void> {
    const ok = await this.dialogService.confirmDelete('Invoice Document');
    if (ok) {
      this.notifyService.error('Invoice record deleted permanently.', 'Deleted');
      this.formStatus.set('REJECTED');
    }
  }

  async testApprovalDialog(): Promise<void> {
    const ok = await this.dialogService.confirmApproval('Invoice Document');
    if (ok) {
      this.formStatus.set('APPROVED');
      this.notifyService.success('Invoice approved successfully!', 'Approved');
    }
  }

  testNotification(): void {
    this.notifyService.info('Press Ctrl+K anytime to trigger global search!', 'Pro Tip');
  }

  onSave(): void {
    if (this.apiService) {
      this.batchPayload.set(this.apiService.getDirtyRows());
      this.formStatus.set('POSTED');
      this.notifyService.success('Transaction saved with SQL_STATE batch payload!', 'Saved');
    }
  }
}

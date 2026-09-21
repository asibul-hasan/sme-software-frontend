import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1102ModelService, IAdjustmentLine } from './services/model.service';
import { Inv1102DataService } from './services/data.service';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1102',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    PageFormLayoutComponent,
    ErpGridComponent,
    AppDatePickerComponent,
    AppDecimalPipe,
  ],
  providers: [Inv1102ModelService, Inv1102DataService],
  templateUrl: './inv1102.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv1102Component implements OnInit {
  public model = inject(Inv1102ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly lineGrid: GridConfig<IAdjustmentLine> = {
    gridKey: 'INV_1102_ADJUSTMENT_LINES_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    canAdd: () => this.model.isDraft() && (this.permissionService.canInsert() || this.permissionService.canUpdate()),
    canEdit: () => this.model.isDraft() && (this.permissionService.canUpdate() || this.permissionService.canInsert()),
    canDeleteRow: () => this.model.isDraft() && (this.permissionService.canDelete() || this.permissionService.canUpdate()),
    toolbar: {
      title: 'Adjustment Lines',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search lines...',
    },
    columns: [
      GridColumns.lookup<IAdjustmentLine>('product_no', 'Product', () => this.model.lookups().products.map(p => ({ value: p.value, label: p.label })))
        .required()
        .flex(1)
        .minWidth(200)
        .build(),
      GridColumns.lookup<IAdjustmentLine>('uom_no', 'UOM', () => this.model.lookups().uoms.map(u => ({ value: u.value, label: u.label })))
        .required()
        .width(130)
        .build(),
      GridColumns.lookup<IAdjustmentLine>('direction', 'Direction', () => this.model.directions.map(d => ({ value: d.value, label: d.label })))
        .required()
        .width(140)
        .build(),
      GridColumns.decimal<IAdjustmentLine>('qty', 'Quantity')
        .required()
        .min(0.0001)
        .width(120)
        .build(),
      GridColumns.decimal<IAdjustmentLine>('unit_cost', 'Unit Cost')
        .width(130)
        .min(0)
        .build(),
      GridColumns.text<IAdjustmentLine>('batch_code', 'Batch Code')
        .width(140)
        .build(),
      GridColumns.date<IAdjustmentLine>('expiry_date', 'Expiry')
        .width(120)
        .build(),
      GridColumns.decimal<IAdjustmentLine>('__total', 'Net Value')
        .width(140)
        .readOnly()
        .sum()
        .footer('Net')
        .build(),
      GridColumns.action<IAdjustmentLine>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1102');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSaveDraft(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.adjustment_no === no);
    if (item) {
      this.model.select(item);
    } else {
      this.model.onNew();
    }
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this draft adjustment?').subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  onSubmit(): void {
    this.alertService.confirm('Submit this stock adjustment for approval?', 'Submit Adjustment', 'primary').subscribe((ok) => {
      if (ok) this.model.onSubmit();
    });
  }
  onApprove(): void {
    this.alertService.confirm('Approve and post this adjustment? Stock will be updated immediately.', 'Approve Adjustment', 'primary').subscribe((ok) => {
      if (ok) this.model.onApprove();
    });
  }
  onCancel(): void {
    this.alertService.confirm('Cancel this adjustment? A reversal transaction will be created.', 'Cancel Adjustment', 'danger').subscribe((ok) => {
      if (ok) this.model.onCancel();
    });
  }
}

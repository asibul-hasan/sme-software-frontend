import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv2003ModelService, ITransferLine } from './services/model.service';
import { Inv2003DataService } from './services/data.service';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2003',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    PageFormLayoutComponent,
    ErpGridComponent,
    AppDatePickerComponent,
    AppDecimalPipe,
  ],
  providers: [Inv2003ModelService, Inv2003DataService],
  templateUrl: './inv2003.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv2003Component implements OnInit {
  public model = inject(Inv2003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly lineGrid: GridConfig<ITransferLine> = {
    gridKey: 'INV_2003_TRANSFER_LINES_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    canAdd: () => this.model.isDraft() && (this.permissionService.canInsert() || this.permissionService.canUpdate()),
    canEdit: () =>
      (this.model.isDraft() || this.model.isDispatched()) &&
      (this.permissionService.canUpdate() || this.permissionService.canInsert()),
    canDeleteRow: () => this.model.isDraft() && (this.permissionService.canDelete() || this.permissionService.canUpdate()),
    toolbar: {
      title: 'Transfer Items',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search items...',
    },
    columns: [
      GridColumns.lookup<ITransferLine>('product_no', 'Product', () => this.model.lookups().products.map(p => ({ value: p.value, label: p.label })))
        .required()
        .flex(1)
        .minWidth(200)
        .build(),
      GridColumns.lookup<ITransferLine>('uom_no', 'UOM', () => this.model.lookups().uoms.map(u => ({ value: u.value, label: u.label })))
        .required()
        .width(130)
        .build(),
      GridColumns.decimal<ITransferLine>('qty_sent', 'Qty Sent')
        .required()
        .min(0.0001)
        .width(130)
        .sum()
        .footer('Total Sent')
        .build(),
      GridColumns.decimal<ITransferLine>('qty_received', 'Qty Received')
        .width(140)
        .min(0)
        .sum()
        .footer('Total Recv')
        .build(),
      GridColumns.text<ITransferLine>('batch_code', 'Batch Code')
        .width(140)
        .build(),
      GridColumns.text<ITransferLine>('remarks', 'Remarks')
        .flex(1)
        .minWidth(150)
        .build(),
      GridColumns.action<ITransferLine>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2003');
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
    const item = this.model.items().find((x) => x.transfer_no === no);
    if (item) {
      this.model.select(item);
    } else {
      this.model.onNew();
    }
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this draft transfer?').subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  onSubmit(): void {
    this.alertService.confirm('Submit this transfer for dispatch approval?', 'Submit Transfer', 'primary').subscribe((ok) => {
      if (ok) this.model.onSubmit();
    });
  }
  onDispatch(): void {
    this.alertService.confirm('Dispatch this transfer to transit? Stock will leave the source warehouse.', 'Dispatch Transfer', 'primary').subscribe((ok) => {
      if (ok) this.model.onDispatch();
    });
  }
  onReceive(): void {
    this.alertService.confirm('Receive this transfer into the destination warehouse? Stock will be added immediately.', 'Receive Transfer', 'primary').subscribe((ok) => {
      if (ok) this.model.onReceive();
    });
  }
  onCancel(): void {
    this.alertService.confirm('Cancel this transfer?', 'Cancel Transfer', 'danger').subscribe((ok) => {
      if (ok) this.model.onCancel();
    });
  }
}

import {
  Component, ChangeDetectionStrategy, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { IReorder, Inv2005ModelService } from './services/model.service';
import { Inv2005DataService } from './services/data.service';

/** INV_2005 Reorder Level — per-warehouse reorder policy grid. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2005',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv2005ModelService, Inv2005DataService],
  templateUrl: './inv2005.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv2005Component implements OnInit {
  public model = inject(Inv2005ModelService);
  public permissionService = inject(FormPermissionService);

  readonly gridConfig: GridConfig<IReorder> = {
    gridKey: 'INV_2005_REORDER_POLICY_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    canAdd: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canEdit: () => this.permissionService.canUpdate() || this.permissionService.canInsert(),
    canDeleteRow: () => this.permissionService.canDelete() || this.permissionService.canUpdate(),
    toolbar: {
      title: 'Reorder Rules',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search rules...',
    },
    columns: [
      GridColumns.lookup<IReorder>('product_no', 'Product', () => this.model.products().map(p => ({ value: p.value, label: p.label })))
        .required()
        .flex(1)
        .minWidth(240)
        .build(),
      GridColumns.decimal<IReorder>('reorder_level', 'Reorder Level')
        .required()
        .min(0)
        .width(140)
        .build(),
      GridColumns.decimal<IReorder>('reorder_qty', 'Reorder Qty')
        .required()
        .min(0)
        .width(140)
        .build(),
      GridColumns.decimal<IReorder>('min_stock', 'Min Stock')
        .min(0)
        .width(130)
        .build(),
      GridColumns.decimal<IReorder>('max_stock', 'Max Stock')
        .min(0)
        .width(130)
        .build(),
      GridColumns.number<IReorder>('lead_time_days', 'Lead Days')
        .min(0)
        .width(120)
        .build(),
      GridColumns.action<IReorder>().build(),
    ],
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('INV_2005');
    this.model.loadOptions();
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.addRow(); }
  onReset(): void { this.model.loadRows(); }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { IRack, Inv2002ModelService } from './services/model.service';
import { Inv2002DataService } from './services/data.service';

/** INV_2002 Rack/Shelf Setup — bins under a selected warehouse. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2002',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv2002ModelService, Inv2002DataService],
  templateUrl: './inv2002.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv2002Component implements OnInit {
  public model = inject(Inv2002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly gridConfig: GridConfig<IRack> = {
    gridKey: 'INV_2002_RACKS_GRID',
    rowIdField: 'rack_no',
    height: '100%',
    selectionMode: 'single',
    externalRowState: false,
    showPagination: true,
    pageSize: 50,
    toolbar: {
      title: 'Racks & Bins',
      showAdd: false,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search racks...',
    },
    columns: [
      GridColumns.text<IRack>('rack_id', 'Code')
        .width(130)
        .pinned('left')
        .build(),
      GridColumns.text<IRack>('rack_name', 'Name')
        .flex(1)
        .minWidth(160)
        .build(),
      GridColumns.text<IRack>('aisle', 'Location')
        .valueFormatter((_, row) =>
          [row.aisle, row.rack, row.shelf, row.bin]
            .filter((part) => part != null && String(part).trim() !== '')
            .join('-'),
        )
        .width(150)
        .build(),
      GridColumns.status<IRack>('is_active', 'Status')
        .width(110)
        .build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2002');
    this.model.loadWarehouses();
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.newRack(); }
  onReset(): void {
    const no = this.model.selectedRackNo();
    const item = this.model.racks().find((x) => x.rack_no === no);
    if (item) {
      this.model.selectRack(item);
    } else {
      this.model.newRack();
    }
  }
  onDelete(): void {
    if (!this.model.selectedRackNo()) return;
    this.alertService.deleteConfirm('Delete this rack?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }

  onRowSelected(row: IRack): void {
    if (row) {
      this.model.selectRack(row);
    }
  }
}

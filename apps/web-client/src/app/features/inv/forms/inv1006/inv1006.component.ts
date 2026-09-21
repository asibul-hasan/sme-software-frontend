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
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1006ModelService, IAttributeValue } from './services/model.service';
import { Inv1006DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1006',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv1006ModelService, Inv1006DataService],
  templateUrl: './inv1006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv1006Component implements OnInit {
  public model = inject(Inv1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly valuesGrid: GridConfig<IAttributeValue> = {
    gridKey: 'INV_1006_VALUES_GRID',
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
      title: 'Attribute Values',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search values...',
    },
    columns: [
      GridColumns.text<IAttributeValue>('value_code', 'Value Code')
        .required()
        .width(180)
        .build(),
      GridColumns.text<IAttributeValue>('value_name', 'Value Name')
        .required()
        .flex(1)
        .minWidth(220)
        .build(),
      GridColumns.number<IAttributeValue>('order_sl', 'Order')
        .width(110)
        .build(),
      GridColumns.action<IAttributeValue>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1006');
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.attribute_no === no);
    if (item) {
      this.model.select(item);
    } else {
      this.model.onNew();
    }
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this attribute and its values?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

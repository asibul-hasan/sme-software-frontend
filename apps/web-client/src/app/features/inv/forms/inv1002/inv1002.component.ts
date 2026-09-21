import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { IBarcode, Inv1002ModelService } from './services/model.service';
import { Inv1002DataService } from './services/data.service';

/** INV_1002 Barcode Generator — manage and print barcodes for a product. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1002',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv1002ModelService, Inv1002DataService],
  templateUrl: './inv1002.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv1002Component implements OnInit {
  public model = inject(Inv1002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly gridConfig: GridConfig<IBarcode> = {
    gridKey: 'INV_1002_BARCODES_GRID',
    rowIdField: 'barcode_no',
    height: '100%',
    selectionMode: 'single',
    externalRowState: false,
    showPagination: true,
    pageSize: 50,
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'Barcodes',
      showAdd: false,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search barcodes...',
    },
    columns: [
      GridColumns.text<IBarcode>('barcode', 'Barcode')
        .pinned('left')
        .width(180)
        .build(),
      GridColumns.text<IBarcode>('uom_name', 'UOM')
        .width(120)
        .build(),
      GridColumns.decimal<IBarcode>('pack_qty', 'Pack Qty')
        .width(110)
        .build(),
      GridColumns.lookup<IBarcode>('barcode_type', 'Type', () => this.model.barcodeTypes.map(t => ({ value: t.value, label: t.label })))
        .width(130)
        .build(),
      GridColumns.text<IBarcode>('is_primary', 'Primary')
        .valueFormatter((val) => (Number(val) === 1 ? 'Primary' : 'Secondary'))
        .width(110)
        .build(),
      GridColumns.action<IBarcode>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1002');
    this.model.loadLookups();
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.newBarcode(); }
  onReset(): void {
    const no = this.model.selectedBarcodeNo();
    const item = this.model.barcodes().find((x) => x.barcode_no === no);
    if (item) {
      this.model.selectBarcode(item);
    } else {
      this.model.newBarcode();
    }
  }
  onDelete(): void {
    const no = this.model.selectedBarcodeNo();
    if (!no) return;
    this.alertService.deleteConfirm('Delete this barcode?').subscribe((ok) => {
      if (ok) this.model.onDelete(no);
    });
  }

  onRowSelected(row: IBarcode): void {
    if (row) {
      this.model.selectBarcode(row);
    }
  }

  onRowRemove(row: IBarcode): void {
    if (row.barcode_no) {
      this.alertService.deleteConfirm('Delete this barcode?').subscribe((ok) => {
        if (ok) this.model.onDelete(row.barcode_no);
      });
    }
  }
}

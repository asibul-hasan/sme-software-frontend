import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import {
  Inv1001ModelService,
  IVariantRow,
  IBarcodeRow,
  IUomConvRow,
} from './services/model.service';
import { Inv1001DataService } from './services/data.service';
import { DecimalInputDirective } from '../../../../shared/directives/decimal-input.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1001',
  standalone: true,
  imports: [DecimalInputDirective, SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Inv1001ModelService, Inv1001DataService],
  templateUrl: './inv1001.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv1001Component implements OnInit {
  public model = inject(Inv1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly variantsGrid: GridConfig<IVariantRow> = {
    gridKey: 'INV_1001_VARIANTS_GRID',
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
      title: 'Variants Matrix',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search variants...',
    },
    columns: [
      GridColumns.text<IVariantRow>('variant_sku', 'Variant SKU')
        .required()
        .width(180)
        .build(),
      GridColumns.text<IVariantRow>('variant_name', 'Variant Name')
        .required()
        .flex(1)
        .minWidth(220)
        .build(),
      GridColumns.text<IVariantRow>('barcode', 'Barcode')
        .width(160)
        .build(),
      GridColumns.decimal<IVariantRow>('sale_price', 'Sale Price')
        .width(130)
        .min(0)
        .build(),
      GridColumns.decimal<IVariantRow>('mrp', 'MRP')
        .width(130)
        .min(0)
        .build(),
      GridColumns.action<IVariantRow>().build(),
    ],
  };

  readonly barcodesGrid: GridConfig<IBarcodeRow> = {
    gridKey: 'INV_1001_BARCODES_GRID',
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
      title: 'Barcodes & Packaging',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search barcodes...',
    },
    columns: [
      GridColumns.text<IBarcodeRow>('barcode', 'Barcode')
        .required()
        .flex(1)
        .minWidth(200)
        .build(),
      GridColumns.lookup<IBarcodeRow>('uom_no', 'UOM', () => this.model.lookups().uoms.map(u => ({ value: u.value, label: u.label })))
        .required()
        .width(160)
        .build(),
      GridColumns.decimal<IBarcodeRow>('pack_qty', 'Pack Qty')
        .required()
        .min(0.001)
        .width(120)
        .build(),
      GridColumns.lookup<IBarcodeRow>('barcode_type', 'Type', () => this.model.barcodeTypes.map(t => ({ value: t.value, label: t.label })))
        .width(150)
        .build(),
      GridColumns.action<IBarcodeRow>().build(),
    ],
  };

  readonly uomConversionsGrid: GridConfig<IUomConvRow> = {
    gridKey: 'INV_1001_UOM_CONVERSIONS_GRID',
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
      title: 'UOM Conversion Rates',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search UOM conversions...',
    },
    columns: [
      GridColumns.lookup<IUomConvRow>('from_uom_no', 'From UOM', () => this.model.lookups().uoms.map(u => ({ value: u.value, label: u.label })))
        .required()
        .flex(1)
        .minWidth(220)
        .build(),
      GridColumns.decimal<IUomConvRow>('to_base_factor', 'To Base Factor (1 From = X Base)')
        .required()
        .precision(6)
        .min(0.000001)
        .width(260)
        .build(),
      GridColumns.action<IUomConvRow>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1001');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.product_no === no);
    if (item) {
      this.model.select(item);
    } else {
      this.model.onNew();
    }
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this product?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

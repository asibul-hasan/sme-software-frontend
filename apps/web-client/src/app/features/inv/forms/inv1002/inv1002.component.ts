import { Component, ChangeDetectionStrategy, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { IBarcode, Inv1002ModelService } from './services/model.service';
import { Inv1002DataService } from './services/data.service';

/** INV_1002 Barcode Generator — manage and print barcodes for a product. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1002',
  standalone: true,
  imports: [SharedModule, CommonModule, CommonTableComponent],
  providers: [Inv1002ModelService, Inv1002DataService],
  templateUrl: './inv1002.component.html',
  styles: [],
})
export class Inv1002Component implements OnInit {
  public model = inject(Inv1002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly rows = computed(() => this.model.barcodes() as unknown as Record<string, unknown>[]);

  readonly columns: ColumnDef[] = [
    { title: 'Barcode', field: 'barcode', cellType: 'text', sort: true, width: '180px', pin: 'left' },
    { title: 'UOM', field: 'uom_name', cellType: 'text', sort: true, width: '120px' },
    { title: 'Pack', field: 'pack_qty', cellType: 'decimal', sort: true, align: 'right', precision: 4, width: '110px' },
    {
      title: 'Type',
      field: 'barcode_type',
      cellType: 'select',
      sort: true,
      options: [...this.model.barcodeTypes],
      value: (row) => this.model.barcodeTypes.find((x) => x.value === row['barcode_type'])?.label ?? '',
      width: '130px',
    },
    {
      title: 'Primary',
      field: 'is_primary',
      cellType: 'badge',
      sort: true,
      align: 'center',
      width: '110px',
      badgeConfig: (value) => Number(value) === 1
        ? { label: 'Primary', variant: 'success' }
        : { label: 'Secondary', variant: 'neutral' },
    },
  ];

  readonly tableConfig: Partial<TableConfig> = {
    showTitle: true,
    title: 'Barcodes',
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    showExport: true,
    showColumnToggle: true,
    showActions: true,
    dense: true,
    striped: true,
    maxHeight: '100%',
    actions: [
      {
        type: 'delete',
        icon: 'delete',
        tooltip: 'Delete',
        variant: 'danger',
        visible: () => this.permissionService.canDelete(),
        onClick: (row) => this.onDelete(Number(row['barcode_no'])),
      },
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1002');
    this.model.loadLookups();
  }

  onDelete(barcodeNo: number): void {
    this.alertService.deleteConfirm('Delete this barcode?').subscribe((ok) => {
      if (ok) this.model.onDelete(barcodeNo);
    });
  }

  onRowClick(row: Record<string, unknown>): void {
    this.model.selectBarcode(row as unknown as IBarcode);
  }
}

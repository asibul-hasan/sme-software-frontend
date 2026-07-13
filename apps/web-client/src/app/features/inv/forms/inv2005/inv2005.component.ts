import {
  Component, ChangeDetectionStrategy, OnInit, TemplateRef, computed, inject, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { IReorder, Inv2005ModelService } from './services/model.service';
import { Inv2005DataService } from './services/data.service';

/** INV_2005 Reorder Level — per-warehouse reorder policy grid. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2005',
  standalone: true,
  imports: [SharedModule, CommonModule, CommonTableComponent],
  providers: [Inv2005ModelService, Inv2005DataService],
  templateUrl: './inv2005.component.html',
  styles: [],
})
export class Inv2005Component implements OnInit {
  public model = inject(Inv2005ModelService);
  public permissionService = inject(FormPermissionService);

  private productTpl = viewChild<TemplateRef<unknown>>('productTpl');
  private numberTpl = viewChild<TemplateRef<unknown>>('numberTpl');
  private removeTpl = viewChild<TemplateRef<unknown>>('removeTpl');

  readonly rows = computed(() => this.model.rows() as unknown as Record<string, unknown>[]);

  readonly columns = computed<ColumnDef[]>(() => [
    {
      title: 'Product',
      field: 'product_no',
      cellType: 'custom-template',
      customTemplate: this.productTpl(),
      value: (row) => this.productLabel(row),
      minWidth: '260px',
      pin: 'left',
      hideable: false,
      sort: true,
    },
    this.numberColumn('Reorder Level', 'reorder_level'),
    this.numberColumn('Reorder Qty', 'reorder_qty'),
    this.numberColumn('Min Stock', 'min_stock'),
    this.numberColumn('Max Stock', 'max_stock'),
    this.numberColumn('Lead Days', 'lead_time_days', '1'),
    {
      title: '',
      field: '__remove',
      cellType: 'custom-template',
      customTemplate: this.removeTpl(),
      value: () => '',
      width: '56px',
      align: 'center',
      hideable: false,
    },
  ]);

  readonly tableConfig: Partial<TableConfig> = {
    showTitle: true,
    title: 'Reorder Rules',
    showSearch: true,
    pagination: true,
    defaultPageSize: 12,
    pageSizeOptions: [12, 25, 50],
    showExport: true,
    showColumnToggle: true,
    showActions: false,
    dense: true,
    compact: true,
    striped: true,
    maxHeight: '100%',
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('INV_2005');
    this.model.loadOptions();
  }

  setRowValue(row: Record<string, unknown>, field: string, value: unknown): void {
    row[field] = value === '' ? null : value;
    this.model.rows.update((rows) => [...rows]);
  }

  removeRow(row: Record<string, unknown>): void {
    const index = this.model.rows().indexOf(row as unknown as IReorder);
    if (index >= 0) this.model.removeRow(index);
  }

  productLabel(row: Record<string, unknown>): string {
    return String(row['product_name'] ?? this.model.products().find((p) => p.value === row['product_no'])?.label ?? '');
  }

  private numberColumn(title: string, field: keyof IReorder, step = '0.0001'): ColumnDef {
    return {
      title,
      field,
      cellType: 'custom-template',
      customTemplate: this.numberTpl(),
      value: (row) => row[field] ?? '',
      sort: true,
      align: 'right',
      width: field === 'lead_time_days' ? '110px' : '130px',
      tooltip: step,
    };
  }
}

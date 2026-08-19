import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ICountLine, Inv2006DataService } from './services/data.service';
import { COUNT_TYPES, Inv2006ModelService } from './services/model.service';
import { formatDecimal } from '../../../../core/utils/format-number';

/**
 * INV_2006 — Physical Count.
 *
 * Open a sheet (which snapshots the warehouse), count, review the variance, post.
 * Posting hands the difference to INV_1102 as a Count adjustment, so stock only
 * ever moves through the one write path.
 */
@Component({
  selector: 'app-inv2006',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
    ErpGridComponent,
  ],
  providers: [Inv2006DataService, Inv2006ModelService],
  templateUrl: './inv2006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inv2006Component implements OnInit {
  readonly model = inject(Inv2006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  readonly countTypes = COUNT_TYPES;

  readonly gridConfig: GridConfig<ICountLine> = {
    gridKey: 'INV_2006_PHYSICAL_COUNT_GRID',
    rowIdField: 'count_dtl_no',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    canEdit: () => this.model.isOpen() && (this.permissionService.canUpdate() || this.permissionService.canInsert()),
    toolbar: {
      title: 'Count Items',
      showAdd: false,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search count items...',
    },
    columns: [
      GridColumns.number<ICountLine>('line_no', '#')
        .width(70)
        .readOnly()
        .build(),
      GridColumns.text<ICountLine>('product_name', 'Item')
        .flex(1)
        .minWidth(200)
        .readOnly()
        .build(),
      GridColumns.text<ICountLine>('batch_code', 'Batch')
        .width(130)
        .readOnly()
        .build(),
      GridColumns.decimal<ICountLine>('system_qty', 'System Qty')
        .width(120)
        .readOnly()
        .build(),
      GridColumns.decimal<ICountLine>('counted_qty', 'Counted Qty')
        .required()
        .min(0)
        .width(130)
        .build(),
      GridColumns.decimal<ICountLine>('variance_qty', 'Variance Qty')
        .width(130)
        .readOnly()
        .build(),
      GridColumns.decimal<ICountLine>('variance_value', 'Variance Value')
        .width(140)
        .readOnly()
        .sum()
        .footer('Total')
        .build(),
      GridColumns.text<ICountLine>('remarks', 'Note / Reason')
        .width(180)
        .build(),
    ],
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('INV_2006');
    this.model.loadWarehouses();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  confirmPost(): void {
    const variances = this.model.varianceCount();
    const val = formatDecimal(this.model.varianceValue());
    const msg = variances > 0
      ? `Post ${variances} variance line(s) worth ${val}? This will adjust stock via a count adjustment.`
      : 'Post this physical count? No stock variances detected.';

    this.alertService.confirm(msg, 'Post Physical Count', 'primary').subscribe((ok) => {
      if (ok) this.model.post();
    });
  }

  cancelSheet(): void {
    this.alertService.confirm('Cancel this physical count sheet?', 'Cancel Count Sheet', 'danger').subscribe((ok) => {
      if (ok) this.model.cancel();
    });
  }
}

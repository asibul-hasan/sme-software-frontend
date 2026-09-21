import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig } from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1101ModelService, IOpeningLine } from './services/model.service';
import { Inv1101DataService } from './services/data.service';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1101',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    PageFormLayoutComponent,
    ErpGridComponent,
    AppDatePickerComponent,
    AppDecimalPipe,
  ],
  providers: [Inv1101ModelService, Inv1101DataService],
  templateUrl: './inv1101.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Inv1101Component implements OnInit {
  public model = inject(Inv1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly lineGrid: GridConfig<IOpeningLine> = {
    gridKey: 'INV_1101_OPENING_LINES_GRID',
    rowIdField: '__uid',
    height: '100%',
    selectionMode: 'none',
    externalRowState: true,
    showPagination: true,
    pageSize: 50,
    canAdd: () => !this.model.isPosted() && (this.permissionService.canInsert() || this.permissionService.canUpdate()),
    canEdit: () => !this.model.isPosted() && (this.permissionService.canUpdate() || this.permissionService.canInsert()),
    canDeleteRow: () => !this.model.isPosted() && (this.permissionService.canDelete() || this.permissionService.canUpdate()),
    toolbar: {
      title: 'Opening Lines',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      searchPlaceholder: 'Search lines...',
    },
    columns: [
      GridColumns.lookup<IOpeningLine>('product_no', 'Product', () => this.model.lookups().products.map(p => ({ value: p.value, label: p.label })))
        .required()
        .flex(1)
        .minWidth(200)
        .build(),
      GridColumns.lookup<IOpeningLine>('uom_no', 'UOM', () => this.model.lookups().uoms.map(u => ({ value: u.value, label: u.label })))
        .required()
        .width(130)
        .build(),
      GridColumns.decimal<IOpeningLine>('qty', 'Quantity')
        .required()
        .min(0.0001)
        .width(120)
        .build(),
      GridColumns.decimal<IOpeningLine>('unit_cost', 'Unit Cost')
        .width(130)
        .min(0)
        .build(),
      GridColumns.text<IOpeningLine>('batch_code', 'Batch Code')
        .width(140)
        .build(),
      GridColumns.date<IOpeningLine>('expiry_date', 'Expiry')
        .width(120)
        .build(),
      GridColumns.decimal<IOpeningLine>('__total', 'Total Value')
        .width(140)
        .readOnly()
        .sum()
        .footer('Total')
        .build(),
      GridColumns.action<IOpeningLine>().build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1101');
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
    this.alertService.deleteConfirm('Delete this opening draft?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
  onPost(): void {
    this.alertService.confirm('Post this opening stock? This cannot be undone.', 'Post Opening Stock', 'primary').subscribe((ok) => {
      if (ok) this.model.onPost();
    });
  }
}

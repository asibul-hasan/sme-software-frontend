import {
  Component, ChangeDetectionStrategy, OnInit, TemplateRef, computed, inject, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1006ModelService } from './services/model.service';
import { Inv1006DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1006',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Inv1006ModelService, Inv1006DataService],
  templateUrl: './inv1006.component.html',
  styles: [],
})
export class Inv1006Component implements OnInit {
  public model = inject(Inv1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  private codeTpl = viewChild<TemplateRef<unknown>>('codeTpl');
  private nameTpl = viewChild<TemplateRef<unknown>>('nameTpl');
  private orderTpl = viewChild<TemplateRef<unknown>>('orderTpl');
  private removeTpl = viewChild<TemplateRef<unknown>>('removeTpl');

  readonly valueColumns = computed<ColumnDef[]>(() => [
    {
      title: 'Code',
      field: 'value_code',
      cellType: 'custom-template',
      customTemplate: this.codeTpl(),
      value: (row) => row['value_code'] ?? '',
      width: '160px',
      sort: true,
      hideable: false,
    },
    {
      title: 'Name',
      field: 'value_name',
      cellType: 'custom-template',
      customTemplate: this.nameTpl(),
      value: (row) => row['value_name'] ?? '',
      minWidth: '220px',
      sort: true,
      hideable: false,
    },
    {
      title: 'Order',
      field: 'order_sl',
      cellType: 'custom-template',
      customTemplate: this.orderTpl(),
      value: (row) => row['order_sl'] ?? '',
      align: 'right',
      width: '100px',
      sort: true,
    },
    {
      title: '',
      field: '__remove',
      cellType: 'custom-template',
      customTemplate: this.removeTpl(),
      value: () => '',
      align: 'center',
      width: '56px',
      hideable: false,
    },
  ]);

  readonly valueTableConfig: Partial<TableConfig> = {
    showTitle: true,
    title: 'Values',
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    showExport: true,
    showColumnToggle: true,
    showActions: false,
    dense: true,
    compact: true,
    striped: true,
    maxHeight: '100%',
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
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this attribute and its values?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }

  valueRows(): Record<string, unknown>[] {
    return this.model.values.controls.map((control, index) => ({
      index,
      ...(control.value as Record<string, unknown>),
    }));
  }
}

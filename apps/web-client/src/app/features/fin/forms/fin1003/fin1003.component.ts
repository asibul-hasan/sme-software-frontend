import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';

import { Fin1003ModelService, VoucherType } from './services/model.service';
import { Fin1003DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1003',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, ErpGridComponent],
  providers: [Fin1003ModelService, Fin1003DataService],
  templateUrl: './fin1003.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1003Component implements OnInit {
  public model             = inject(Fin1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly baseKinds = finConstants.voucherBaseKinds;

  readonly gridConfig: GridConfig<VoucherType> = {
    gridKey: 'FIN_1003_VOUCHER_TYPE_GRID',
    rowIdField: 'voucher_type_no',
    showPagination: true,
    pageSize: 25,
    canAdd: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canEdit: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: { showSearch: true, searchPlaceholder: 'Search voucher types...', showAdd: false },
    columns: [
      GridColumns.number<VoucherType>('order_sl', 'Order').width(90).precision(0).build(),
      GridColumns.text<VoucherType>('voucher_type_id', 'Type ID').minWidth(120).hidden(true).build(),
      GridColumns.text<VoucherType>('type_name', 'Type Name').minWidth(200).build(),
      GridColumns.select<VoucherType>('base_kind', 'Base Kind', this.baseKinds).minWidth(180).build(),
      GridColumns.text<VoucherType>('number_prefix', 'Prefix').width(100).build(),
      GridColumns.checkbox<VoucherType>('is_active', 'Active').width(80).align('center').build(),
      GridColumns.action<VoucherType>().build()
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1003'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }

  onSave(): void {
    this.model.saveAll();
  }

  onRowChange(row: VoucherType): void {
    (row as any).__dirty = true;
    if (!row.voucher_type_id && row.type_name) {
      row.voucher_type_id = String(row.type_name).toUpperCase().replace(/[^A-Z0-9_]/g, '_').substring(0, 20);
    }
  }

  onRowRemove(row: VoucherType): void {
    this.alertService.deleteConfirm().subscribe(ok => { 
      if (ok) this.model.deleteRow(row); 
    });
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject, ViewChild } from '@angular/core';
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
  @ViewChild('erpGrid') erpGrid?: ErpGridComponent<VoucherType>;

  public model             = inject(Fin1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly baseKinds = finConstants.voucherBaseKinds;

  readonly gridConfig: GridConfig<VoucherType> = {
    gridKey: 'FIN_1003_VOUCHER_TYPE_GRID',
    rowIdField: 'voucher_type_no',
    showPagination: true,
    pageSize: 25,
    selectionMode: 'none',
    externalRowState: true,
    canAdd: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canEdit: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canDeleteRow: (row?: VoucherType) => this.permissionService.canDelete() && row?.is_system !== 1,
    toolbar: { showSearch: true, searchPlaceholder: 'Search voucher types...', showAdd: false, showDelete: false },
    columns: [
      GridColumns.number<VoucherType>('order_sl', 'Order').width(80).precision(0).build(),
      GridColumns.text<VoucherType>('voucher_type_id', 'Type ID')
        .width(110)
        .required()
        .editable((row) => !(row?.is_system === 1 && !!row?.voucher_type_no))
        .build(),
      GridColumns.text<VoucherType>('type_name', 'Type Name').flex(1).minWidth(170).required().build(),
      GridColumns.select<VoucherType>('base_kind', 'Base Kind', this.baseKinds).width(140).required().build(),
      GridColumns.text<VoucherType>('number_prefix', 'Prefix').width(100).build(),
      GridColumns.select<VoucherType>('default_dr_account_no', 'Default Dr Account', () => this.model.accountOptions())
        .minWidth(200)
        .flex(1)
        .build(),
      GridColumns.select<VoucherType>('default_cr_account_no', 'Default Cr Account', () => this.model.accountOptions())
        .minWidth(200)
        .flex(1)
        .build(),
      GridColumns.checkbox<VoucherType>('is_system', 'System').readOnly().width(80).align('center').build(),
      GridColumns.checkbox<VoucherType>('is_active', 'Active').width(80).align('center').build(),
      GridColumns.action<VoucherType>().build()
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1003'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }

  onAddRow(): void {
    this.model.addRow();
    setTimeout(() => {
      const count = this.model.filtered().length;
      if (count > 0 && this.erpGrid) {
        this.erpGrid.editRow(count - 1);
      }
    }, 50);
  }

  onSave(): void {
    if (this.erpGrid) {
      this.erpGrid.stopEditing();
      const currentRows = this.erpGrid.getRows();
      for (const r of currentRows) {
        if (r.voucher_type_id) {
          r.voucher_type_id = r.voucher_type_id.toUpperCase().trim();
          r.voucher_type_code = r.voucher_type_id;
        }
        if (!r.number_prefix && r.voucher_type_id) {
          r.number_prefix = r.voucher_type_id;
          r.prefix = r.voucher_type_id;
        }
        this.model.updateRow(r);
      }
      this.model.saveAll(currentRows);
      return;
    }
    this.model.saveAll();
  }

  onReset(): void {
    if (this.erpGrid) {
      this.erpGrid.stopEditing(true);
    }
    this.model.load();
  }

  onRowChange(row: VoucherType): void {
    (row as any).__dirty = true;
    if (row.voucher_type_id) {
      row.voucher_type_id = row.voucher_type_id.toUpperCase().trim();
      row.voucher_type_code = row.voucher_type_id;
    }
    if (!row.number_prefix && row.voucher_type_id) {
      row.number_prefix = row.voucher_type_id;
      row.prefix = row.voucher_type_id;
    }
    this.model.updateRow(row);
  }

  onRowRemove(row: VoucherType): void {
    if (row.is_system === 1) {
      this.alertService.warning('System voucher types cannot be deleted');
      return;
    }
    this.alertService.deleteConfirm().subscribe(ok => { 
      if (ok) this.model.deleteRow(row); 
    });
  }
}

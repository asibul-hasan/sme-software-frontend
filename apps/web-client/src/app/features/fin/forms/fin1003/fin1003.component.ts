import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

import { Fin1003ModelService, VoucherType } from './services/model.service';
import { Fin1003DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1003',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  providers: [Fin1003ModelService, Fin1003DataService],
  templateUrl: './fin1003.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1003Component implements OnInit {
  public model             = inject(Fin1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly baseKinds = finConstants.voucherBaseKinds;

  tableColumns = computed<import('../../../../shared/components/common-table').ColumnDef[]>(() => [
    { title: 'Type ID', field: 'voucher_type_id', cellType: 'text', sort: true, editable: true, minWidth: '120px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Type Name', field: 'type_name', cellType: 'text', sort: true, editable: true, minWidth: '200px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Base Kind', field: 'base_kind', cellType: 'select', sort: true, editable: true, options: this.baseKinds, minWidth: '180px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Prefix', field: 'number_prefix', cellType: 'text', sort: false, editable: true, width: '100px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Order', field: 'order_sl', cellType: 'number', sort: true, editable: true, width: '90px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Active', field: 'is_active', cellType: 'checkbox', sort: true, editable: true, width: '80px', align: 'center', onChange: (_, row) => (row as any).__dirty = true },
  ]);

  tableData = computed(() => this.model.filtered() as unknown as Record<string, unknown>[]);

  tableConfig: Partial<import('../../../../shared/components/common-table').TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search voucher types...',
    pagination: true,
    defaultPageSize: 25,
    showActions: true,
    actions: [
      { type: 'delete', icon: 'delete', label: 'Delete', tooltip: 'Delete', variant: 'danger', onClick: (row) => this.alertService.deleteConfirm().subscribe(ok => { if (ok) this.model.deleteRow(row as any); }) }
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1003'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }

  onSave(): void {
    this.model.saveAll();
  }
}

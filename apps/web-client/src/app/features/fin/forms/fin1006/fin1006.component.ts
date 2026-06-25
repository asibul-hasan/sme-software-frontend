import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';

import { Fin1006ModelService } from './services/model.service';
import { Fin1006DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1006',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, CommonTableComponent],
  providers: [Fin1006ModelService, Fin1006DataService],
  templateUrl: './fin1006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1006Component implements OnInit {
  public model             = inject(Fin1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly eventTypes = ['PayrollPosted', 'PurchaseInvoicePosted', 'SupplierPaymentPosted', 'SalesInvoicePosted', 'CustomerReceiptPosted', 'StockAdjustmentPosted'];
  readonly legKeys    = ['EXPENSE', 'PAYABLE', 'RECEIVABLE', 'CASH', 'BANK', 'INVENTORY', 'COGS', 'REVENUE', 'VAT_INPUT', 'VAT_OUTPUT', 'STATUTORY', 'ROUNDING', 'FX_GAIN', 'FX_LOSS'];

  readonly eventTypeOptions = this.eventTypes.map(e => ({
    value: e,
    label: e.replace(/([A-Z])/g, ' $1').trim()
  }));

  readonly legKeyOptions = this.legKeys.map(k => ({ value: k, label: k }));

  tableColumns = computed<ColumnDef[]>(() => [
    { title: 'Event Type', field: 'event_type', cellType: 'select', sort: true, editable: true, options: this.eventTypeOptions, minWidth: '240px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Leg Key', field: 'leg_key', cellType: 'select', sort: true, editable: true, options: this.legKeyOptions, minWidth: '150px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Sub Key', field: 'sub_key', cellType: 'text', sort: true, editable: true, minWidth: '120px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'GL Account', field: 'account_no', cellType: 'select', sort: true, editable: true, options: this.model.accountOptions(), minWidth: '350px', onChange: (_, row) => (row as any).__dirty = true },
    { title: 'Active', field: 'is_active', cellType: 'checkbox', sort: true, editable: true, width: '80px', align: 'center', onChange: (_, row) => (row as any).__dirty = true },
  ]);

  tableData = computed(() => this.model.filtered() as unknown as Record<string, unknown>[]);

  tableConfig: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search mappings...',
    pagination: true,
    defaultPageSize: 25,
    showActions: true,
    actions: [
      { type: 'delete', icon: 'delete', label: 'Delete', tooltip: 'Delete', variant: 'danger', onClick: (row) => this.alertService.deleteConfirm().subscribe(ok => { if (ok) this.model.deleteRow(row as any); }) }
    ]
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('FIN_1006');
      this.model.loadAccounts();
      this.model.load();
    });
  }

  onSearchTermChange(v: string): void {
    this.model.searchTerm.set(v);
    this.model.pager.reset();
  }

  onEventTypeFilterChange(v: string | null): void {
    this.model.eventTypeFilter.set(v || null);
    this.model.pager.reset();
  }

  onSave(): void {
    this.model.saveAll();
  }
}

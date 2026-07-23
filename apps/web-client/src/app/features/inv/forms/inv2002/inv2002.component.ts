import { Component, ChangeDetectionStrategy, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { CommonTableComponent, ColumnDef, TableConfig, statusBadge } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { IRack, Inv2002ModelService } from './services/model.service';
import { Inv2002DataService } from './services/data.service';

/** INV_2002 Rack/Shelf Setup — bins under a selected warehouse. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2002',
  standalone: true,
  imports: [SharedModule, CommonModule, CommonTableComponent],
  providers: [Inv2002ModelService, Inv2002DataService],
  templateUrl: './inv2002.component.html',
  styles: [],
})
export class Inv2002Component implements OnInit {
  public model = inject(Inv2002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly rows = computed(() => this.model.racks() as unknown as Record<string, unknown>[]);

  readonly columns: ColumnDef[] = [
    { title: 'Code', field: 'rack_id', cellType: 'text', sort: true, width: '130px', pin: 'left' },
    { title: 'Name', field: 'rack_name', cellType: 'text', sort: true, width: '180px' },
    { title: 'Location', field: 'location', cellType: 'text', sort: true, value: (row) => this.locationLabel(row), width: '180px' },
    { title: 'Status', field: 'is_active', cellType: 'badge', sort: true, badgeConfig: statusBadge, width: '110px' },
  ];

  readonly tableConfig: Partial<TableConfig> = {
    rowKey: (row) => row['rack_no'] ?? row,
    showTitle: true,
    title: 'Racks',
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50],
    showExport: true,
    showColumnToggle: true,
    showActions: false,
    dense: true,
    striped: true,
    maxHeight: '100%',
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2002');
    this.model.loadWarehouses();
  }

  onDelete(): void {
    if (!this.model.selectedRackNo()) return;
    this.alertService.deleteConfirm('Delete this rack?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }

  onRowClick(row: Record<string, unknown>): void {
    this.model.selectRack(row as unknown as IRack);
  }

  private locationLabel(row: Record<string, unknown>): string {
    return [row['aisle'], row['rack'], row['shelf'], row['bin']]
      .filter((part) => part != null && String(part).trim() !== '')
      .join('-');
  }
}

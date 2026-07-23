import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { ColumnDef, TableConfig, statusBadge } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { MenuRow, ModuleRow, SubmoduleRow, Sys1201ModelService } from './services/model.service';
import { Sys1201DataService } from './services/data.service';

/**
 * SYS1201 – Dynamic Menu Builder. Vendor editor for the global catalog
 * (modules → submodules → menus).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1201',
  standalone: true,
  imports: [SharedModule, CommonModule, FormsModule],
  providers: [Sys1201ModelService, Sys1201DataService],
  templateUrl: './sys1201.component.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .sys1201-content,
    .sys1201-tab-pane,
    .sys1201-list-col,
    .sys1201-form-col {
      min-height: 0;
    }

    .sys1201-tab-pane {
      flex: 1 1 auto;
    }

    .sys1201-table {
      display: block;
      height: 100%;
      min-height: 0;
    }

    .sys1201-edit-card {
      height: 100%;
      min-height: 0;
    }

    .sys1201-edit-card > .card-body {
      overflow: auto;
      min-height: 0;
    }

    .sys1201-table ::ng-deep .form-section-card {
      height: 100%;
      min-height: 0;
      margin-bottom: 0;
      display: flex;
      flex-direction: column;
    }

    .sys1201-table ::ng-deep .form-section-card > .card-body {
      flex: 1 1 auto;
      min-height: 0;
    }

    .sys1201-table ::ng-deep .form-section-card > .card-body .overflow-auto {
      height: 100%;
      max-height: 100% !important;
    }
  `],
})
export class Sys1201Component implements OnInit {
  public model = inject(Sys1201ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  moduleRows = computed(() => this.model.filteredModules() as unknown as Record<string, unknown>[]);
  submoduleRows = computed(() => this.model.filteredSubmodules() as unknown as Record<string, unknown>[]);
  menuRows = computed(() => this.model.filteredMenus() as unknown as Record<string, unknown>[]);

  moduleTableColumns: ColumnDef[] = [
    { title: 'Code', field: 'module_code', sort: true, cellType: 'text', width: '120px', pin: 'left' },
    { title: 'Name', field: 'module_name', sort: true, cellType: 'text', minWidth: '220px' },
    { title: 'Route', field: 'module_route', sort: true, cellType: 'text', minWidth: '180px', visible: false },
    { title: 'Order', field: 'order_sl', sort: true, cellType: 'text', width: '90px', align: 'right' },
    { title: 'Status', field: 'is_active', sort: true, cellType: 'badge', width: '110px', badgeConfig: statusBadge },
  ];

  submoduleTableColumns: ColumnDef[] = [
    { title: 'Module', field: 'module_name', sort: true, cellType: 'text', minWidth: '180px' },
    { title: 'Code', field: 'submodule_code', sort: true, cellType: 'text', width: '140px', pin: 'left' },
    { title: 'Name', field: 'submodule_name', sort: true, cellType: 'text', minWidth: '220px' },
    { title: 'Route', field: 'submodule_route', sort: true, cellType: 'text', minWidth: '180px', visible: false },
    { title: 'Order', field: 'order_sl', sort: true, cellType: 'text', width: '90px', align: 'right' },
    { title: 'Status', field: 'is_active', sort: true, cellType: 'badge', width: '110px', badgeConfig: statusBadge },
  ];

  menuTableColumns: ColumnDef[] = [
    { title: 'Form ID', field: 'form_id', sort: true, cellType: 'text', width: '130px', pin: 'left' },
    { title: 'Name', field: 'form_name', sort: true, cellType: 'text', minWidth: '220px' },
    { title: 'Module', field: 'module_name', sort: true, cellType: 'text', minWidth: '150px' },
    { title: 'Submodule', field: 'submodule_name', sort: true, cellType: 'text', minWidth: '180px' },
    { title: 'Route', field: 'route_path', sort: true, cellType: 'text', minWidth: '220px' },
    { title: 'Type', field: 'menu_type', sort: true, cellType: 'text', width: '120px' },
    { title: 'Order', field: 'order_sl', sort: true, cellType: 'text', width: '90px', align: 'right' },
    { title: 'Status', field: 'is_active', sort: true, cellType: 'badge', width: '110px', badgeConfig: statusBadge },
  ];

  moduleTableConfig = computed<Partial<TableConfig>>(() =>
    this.tableConfig('Modules', 'Search modules...', 'module_no', (row) => this.confirmDeleteModule(Number(row['module_no']))),
  );

  submoduleTableConfig = computed<Partial<TableConfig>>(() =>
    this.tableConfig('Submodules', 'Search submodules...', 'submodule_no', (row) => this.confirmDeleteSubmodule(Number(row['submodule_no']))),
  );

  menuTableConfig = computed<Partial<TableConfig>>(() =>
    this.tableConfig('Menus', 'Search menus...', 'menu_no', (row) => this.confirmDeleteMenu(Number(row['menu_no']))),
  );

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1201');
    this.model.loadAll();
  }

  onModuleRow(row: Record<string, unknown>): void {
    this.model.editModule(row as unknown as ModuleRow);
  }

  onSubmoduleRow(row: Record<string, unknown>): void {
    this.model.editSubmodule(row as unknown as SubmoduleRow);
  }

  onMenuRow(row: Record<string, unknown>): void {
    this.model.editMenu(row as unknown as MenuRow);
  }

  setModuleActive(checked: boolean): void {
    this.model.moduleForm().is_active = checked ? 1 : 0;
  }

  setSubmoduleActive(checked: boolean): void {
    this.model.submoduleForm().is_active = checked ? 1 : 0;
  }

  setMenuActive(checked: boolean): void {
    this.model.menuForm().is_active = checked ? 1 : 0;
  }

  confirmDeleteModule(no: number): void {
    this.alertService.deleteConfirm('Delete this module?').subscribe((ok) => { if (ok) this.model.deleteModule(no); });
  }
  confirmDeleteSubmodule(no: number): void {
    this.alertService.deleteConfirm('Delete this submodule?').subscribe((ok) => { if (ok) this.model.deleteSubmodule(no); });
  }
  confirmDeleteMenu(no: number): void {
    this.alertService.deleteConfirm('Delete this menu?').subscribe((ok) => { if (ok) this.model.deleteMenu(no); });
  }

  private tableConfig(
    title: string,
    searchPlaceholder: string,
    pkField: string,
    onDelete: (row: Record<string, unknown>) => void,
  ): Partial<TableConfig> {
    return {
      // Row-selection identity — an unsaved row (null PK) falls back to itself.
      rowKey: (row) => row[pkField] ?? row,
      title,
      showTitle: true,
      showSearch: true,
      searchPlaceholder,
      pagination: true,
      defaultPageSize: 12,
      pageSizeOptions: [12, 25, 50],
      showExport: true,
      exportFormats: ['excel', 'pdf', 'csv', 'print'],
      showColumnToggle: true,
      showActions: this.permissionService.canDelete(),
      actions: [
        {
          type: 'delete',
          icon: 'delete',
          label: 'Delete',
          tooltip: 'Delete',
          variant: 'danger',
          onClick: onDelete,
        },
      ],
      selectable: false,
      dense: true,
      compact: true,
      striped: true,
      hoverEffect: true,
      maxHeight: '100%',
    };
  }
}

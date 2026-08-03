import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import {
  GridConfig,
  GridLookupOption,
} from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1104ModelService, MappingRow } from './services/model.service';
import { Sys1104DataService } from './services/data.service';

/**
 * SYS1104 – User-Branch Mapping.
 * Pick an employee (left list), then assign branches with a role per branch.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1104',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    NgSelectModule,
    PageFormLayoutComponent,
    ErpGridComponent,
  ],
  providers: [Sys1104ModelService, Sys1104DataService],
  templateUrl: './sys1104.component.html',
  styleUrls: ['./sys1104.component.scss'],
})
export class Sys1104Component implements OnInit {
  public model = inject(Sys1104ModelService);
  public permissionService = inject(FormPermissionService);

  /** Rows for the grid — the live mappings signal. */
  rows = computed(() => this.model.mappings());

  readonly grid: GridConfig<MappingRow> = {
    gridKey: 'SYS_USER_BRANCH_GRID',
    externalRowState: true,
    selectionMode: 'none',
    rowIdField: '__uid',
    showPagination: true,
    pageSize: 12,
    pageSizeOptions: [12, 25, 50],
    canAdd: () => this.permissionService.canInsert() && this.model.selectedUserNo() !== null,
    canEdit: () => this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'Branch Access & Roles',
      showAdd: true,
      showDelete: false,
      showSearch: false,
      showExport: false,
      showColumnChooser: false,
    },
    columns: [
      GridColumns.lookup<MappingRow>('branch_no', 'Branch', (row) =>
        this.model
          .branches()
          .filter((b) => !this.model.isBranchTaken(b.value, row.branch_no ?? null)) as GridLookupOption[]
      )
        .flex(1)
        .minWidth(220)
        .required()
        .build(),

      GridColumns.lookup<MappingRow>('role_no', 'Role', (row) =>
        this.model.rolesForBranch(row.branch_no ?? null) as GridLookupOption[]
      )
        .flex(1)
        .minWidth(220)
        .required()
        .build(),

      GridColumns.select<MappingRow>('is_default', 'Default', this.model.defaultOptions as GridLookupOption[])
        .width(110)
        .align('center')
        .build(),

      GridColumns.select<MappingRow>('is_active', 'Active', this.model.activeOptions as GridLookupOption[])
        .width(110)
        .align('center')
        .build(),

      GridColumns.action<MappingRow>().build(),
    ],
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1104');
    this.model.loadInitial();
  }

  onRowChange(row: MappingRow): void {
    this.model.updateRow(row);
  }

  onRowRemove(row: MappingRow): void {
    this.model.removeRowRef(row);
  }

  addRow(): void {
    this.model.addRow();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    this.model.reloadCurrent();
  }
}

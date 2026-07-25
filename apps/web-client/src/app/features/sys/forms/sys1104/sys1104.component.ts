import {
  Component, ChangeDetectionStrategy, OnInit, inject, computed, viewChild, TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { DataGridComponent, GridColumnDef, GridConfig, GridRow } from '../../../../shared/grid';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1104ModelService, MappingRow } from './services/model.service';
import { Sys1104DataService } from './services/data.service';

/**
 * SYS1104 – User-Branch Mapping. Pick an employee (left list), then assign branches with a
 * role per branch. The mapping grid uses the shared <app-data-grid> (AG Grid) with custom-template
 * columns so each row keeps always-visible controls.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1104',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, DataGridComponent],
  providers: [Sys1104ModelService, Sys1104DataService],
  templateUrl: './sys1104.component.html',
  styleUrls: ['./sys1104.component.scss'],
})
export class Sys1104Component implements OnInit {
  public model = inject(Sys1104ModelService);
  public permissionService = inject(FormPermissionService);

  // Cell templates captured from the view, fed into the grid column defs.
  private defaultTpl = viewChild<TemplateRef<unknown>>('defaultTpl');
  private activeTpl = viewChild<TemplateRef<unknown>>('activeTpl');
  private removeTpl = viewChild<TemplateRef<unknown>>('removeTpl');

  /** Rows for the table — the live mappings signal, typed for the grid. */
  rows = computed(() => this.model.mappings() as unknown as GridRow[]);

  columns = computed<GridColumnDef[]>(() => [
    {
      title: 'Branch',
      field: 'branch_no',
      cellType: 'select',
      editable: true,
      minWidth: 220,
      lockVisible: true,
      options: (r) => this.model.branches().filter((b) => !this.model.isBranchTaken(b.value, (r['branch_no'] as number) ?? null)),
      onChange: (v, r) => {
        const branch = this.model.branches().find((b) => b.value === Number(v) || b.label === v);
        this.model.setBranchForRow(r as unknown as MappingRow, branch ? branch.value : null);
      },
      value: (r) => this.branchLabel(r['branch_no']),
    },
    {
      title: 'Role',
      field: 'role_no',
      cellType: 'select',
      editable: true,
      minWidth: 220,
      lockVisible: true,
      options: (r) => this.model.rolesForBranch((r['branch_no'] as number) ?? null),
      onChange: (v, r) => {
        const role = this.model.roles().find((role) => role.value === Number(v) || role.label === v);
        this.model.setRoleForRow(r as unknown as MappingRow, role ? role.value : null);
      },
      value: (r) => this.roleLabel(r['role_no']),
    },
    {
      title: 'Default',
      field: 'is_default',
      cellType: 'custom-template',
      customTemplate: this.defaultTpl(),
      width: 90,
      align: 'center',
      lockVisible: true,
      value: (r) => (r['is_default'] === 1 ? 'Default' : ''),
    },
    {
      title: 'Active',
      field: 'is_active',
      cellType: 'custom-template',
      customTemplate: this.activeTpl(),
      width: 90,
      align: 'center',
      lockVisible: true,
      value: (r) => (r['is_active'] === 1 ? 'Active' : 'Inactive'),
    },
    {
      title: '',
      field: '__remove',
      cellType: 'custom-template',
      customTemplate: this.removeTpl(),
      width: 56,
      align: 'center',
      lockVisible: true,
      value: () => '',
    },
  ]);

  private branchLabel(v: unknown): string {
    if (v == null || v === '') return '';
    return this.model.branches().find((b) => Number(b.value) === Number(v))?.label ?? String(v);
  }
  private roleLabel(v: unknown): string {
    if (v == null || v === '') return '';
    return this.model.roles().find((r) => Number(r.value) === Number(v))?.label ?? String(v);
  }

  gridConfig: Partial<GridConfig> = {
    showToolbar: true,
    showSearch: true,
    searchPlaceholder: 'Search...',
    showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'],
    showColumnToggle: true,
    pagination: true,
    pageSize: 12,
    pageSizeOptions: [12, 25, 50],
    selection: 'none',
    editable: true,
    editMode: 'cell',
    agOptions: {
      singleClickEdit: true,
      stopEditingWhenCellsLoseFocus: true,
    },
    dense: true,
    striped: true,
    height: '100%',
    rowKey: '__uid',
    stateKey: 'sys1104-mappings',
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1104');
    this.model.loadInitial();
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

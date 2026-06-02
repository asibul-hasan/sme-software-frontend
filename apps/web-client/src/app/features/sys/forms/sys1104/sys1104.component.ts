import {
  Component, ChangeDetectionStrategy, OnInit, inject, computed, viewChild, TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1104ModelService, MappingRow } from './services/model.service';
import { Sys1104DataService } from './services/data.service';

/**
 * SYS1104 – User-Branch Mapping. Pick an employee (left list), then assign branches with a
 * role per branch. The mapping grid uses the shared <app-common-table> with custom-template
 * columns so each row keeps always-visible ng-select / checkbox controls.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1104',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Sys1104ModelService, Sys1104DataService],
  templateUrl: './sys1104.component.html',
  styleUrls: ['./sys1104.component.scss'],
})
export class Sys1104Component implements OnInit {
  public model = inject(Sys1104ModelService);
  public permissionService = inject(FormPermissionService);

  // Cell templates captured from the view, fed into the common-table column defs.
  private defaultTpl = viewChild<TemplateRef<unknown>>('defaultTpl');
  private activeTpl = viewChild<TemplateRef<unknown>>('activeTpl');
  private removeTpl = viewChild<TemplateRef<unknown>>('removeTpl');

  /** Rows for the table — the live mappings signal, typed for the common-table. */
  rows = computed(() => this.model.mappings() as unknown as Record<string, unknown>[]);

  columns = computed<ColumnDef[]>(() => [
    // Branch / Role show as plain text; double-click a cell to edit (common-table standard).
    { title: 'Branch', field: 'branch_no', cellType: 'select', editable: true, minWidth: '220px', hideable: false,
      options: (r) => this.model.branches().filter((b) => !this.model.isBranchTaken(b.value, (r['branch_no'] as number) ?? null)),
      onChange: (v, r) => this.model.setBranchForRow(r as unknown as MappingRow, v == null || v === '' ? null : Number(v)),
      value: (r) => this.branchLabel(r['branch_no']) },
    { title: 'Role', field: 'role_no', cellType: 'select', editable: true, minWidth: '220px', hideable: false,
      options: (r) => this.model.rolesForBranch((r['branch_no'] as number) ?? null),
      onChange: (v, r) => this.model.setRoleForRow(r as unknown as MappingRow, v == null || v === '' ? null : Number(v)),
      value: (r) => this.roleLabel(r['role_no']) },
    { title: 'Default', field: 'is_default', cellType: 'custom-template', customTemplate: this.defaultTpl(), width: '90px', align: 'center', hideable: false,
      value: (r) => (r['is_default'] === 1 ? 'Default' : '') },
    { title: 'Active',  field: 'is_active',  cellType: 'custom-template', customTemplate: this.activeTpl(),  width: '90px', align: 'center', hideable: false,
      value: (r) => (r['is_active'] === 1 ? 'Active' : 'Inactive') },
    { title: '',        field: '__remove',   cellType: 'custom-template', customTemplate: this.removeTpl(),  width: '56px', align: 'center', hideable: false,
      value: () => '' },
  ]);

  private branchLabel(v: unknown): string {
    return this.model.branches().find((b) => b.value === v)?.label ?? '';
  }
  private roleLabel(v: unknown): string {
    return this.model.roles().find((r) => r.value === v)?.label ?? '';
  }

  // Same format as SYS1003 (Financial Year periods) so both common tables render identically.
  tableConfig: Partial<TableConfig> = {
    showTitle: false,
    showSearch: true,
    searchPlaceholder: 'Search...',
    pagination: true,
    defaultPageSize: 12,
    pageSizeOptions: [12, 25, 50],
    showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'],
    showColumnToggle: true,
    showActions: false,
    selectable: false,
    dense: true,
    compact: true,
    striped: true,
    hoverEffect: true,
    maxHeight: '100%',
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

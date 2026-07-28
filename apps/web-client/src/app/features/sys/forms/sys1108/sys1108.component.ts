import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1108ModelService } from './services/model.service';
import { Sys1108DataService } from './services/data.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DataGridComponent } from '../../../../shared/grid/data-grid.component';
import { col } from '../../../../shared/grid/column-builders';
import { detailGridConfig } from '../../../../shared/grid/grid-presets';
import type { GridColumnDef, GridReadyEvent, GridRow } from '../../../../shared/grid/grid.types';

/**
 * SYS1108 — Approval Workflow Setup.
 *
 * Three chained editable grids: Workflow (scope) → Approval Steps → Step Approvers. Selecting a
 * row in one narrows the grid below it.
 *
 * Everything reusable lives in `shared/grid`: {@link detailGridConfig} supplies the grid chrome
 * and {@link col} builds the columns. What stays here is only what is genuinely specific to this
 * form — which fields exist, and where each grid's rows come from.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1108',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ReactiveFormsModule, FormsModule, DataGridComponent],
  providers: [Sys1108ModelService, Sys1108DataService],
  templateUrl: './sys1108.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sys1108Component implements OnInit {
  public model = inject(Sys1108ModelService);
  public permissionService = inject(FormPermissionService);

  /** Grid handles, used to open a freshly added row for editing. */
  scopesGrid?: GridReadyEvent;
  stepsGrid?: GridReadyEvent;
  approversGrid?: GridReadyEvent;

  // ── Grid configs ───────────────────────────────────────────────────────────
  // Chrome, density, height and row identity all come from the preset; each grid
  // states only the defaults for a newly added row.

  readonly scopeGridConfig = detailGridConfig({
    newRowDefaults: () => ({ branch_no: null, department_no: null, menu_no: null, is_active: 1 }),
  });

  readonly stepGridConfig = detailGridConfig({
    newRowDefaults: () => ({ step_number: 1, step_type: 1, next_step_no: null, step_name: '', is_active: 1 }),
  });

  readonly approverGridConfig = detailGridConfig({
    newRowDefaults: () => ({ emp_no: null, is_active: 1 }),
  });

  // ── Column definitions ─────────────────────────────────────────────────────
  // `patch*` turns "this column edits this field" into one argument, so a column
  // is a single readable line instead of a five-line object.

  readonly scopeColumns: GridColumnDef[] = [
    col.text('Workflow Name', 'workflow_name', { flex: 1, minWidth: 200, onChange: this.patchScope('workflow_name') }),
    col.selectNullable('Branch', 'branch_no', () => this.model.branchOptions(), '-- All Branches --',
      { width: 180, onChange: this.patchScope('branch_no') }),
    col.selectNullable('Department', 'department_no', () => this.model.departmentOptions(), '-- All Departments --',
      { width: 180, onChange: this.patchScope('department_no') }),
    col.select('Menu', 'menu_no', () => this.model.enrolledMenuOptions(),
      { width: 220, onChange: this.patchScope('menu_no') }),
    col.remove((r) => this.model.removeScope(r['__uid'] as number), 'Remove Workflow'),
  ];

  readonly stepColumns: GridColumnDef[] = [
    col.number('Step No', 'step_number', { width: 100, onChange: this.patchStep('step_number') }),
    col.select('Step Type', 'step_type', sysConstants.approvalStepTypes,
      { width: 150, onChange: this.patchStep('step_type') }),
    col.number('Next Step No', 'next_step_no', { width: 120, onChange: this.patchStep('next_step_no') }),
    col.text('Step Name', 'step_name', { flex: 1, minWidth: 150, onChange: this.patchStep('step_name') }),
    col.remove((r) => this.model.removeStep(r['__uid'] as number), 'Remove Step'),
  ];

  readonly approverColumns: GridColumnDef[] = [
    col.select('Employee Name', 'emp_no', () => this.model.employeeOptions(),
      { flex: 1, minWidth: 200, onChange: this.patchApprover('emp_no') }),
    col.remove((r) => this.model.removeStepApprover(r['__uid'] as number), 'Remove Approver'),
  ];

  // ── Data ───────────────────────────────────────────────────────────────────
  scopeTableData = computed(() => this.model.scopes() as unknown as GridRow[]);
  stepTableData = computed(() => this.model.currentSteps() as unknown as GridRow[]);
  approverTableData = computed(() => this.model.currentApprovers() as unknown as GridRow[]);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1108');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  // ── Selection — drives the master-detail chain ─────────────────────────────
  onScopeRowClick(row: GridRow): void {
    this.model.selectScope(row['__uid'] as number);
  }

  onStepRowClick(row: GridRow): void {
    this.model.selectStep(row['__uid'] as number);
  }

  onApproverRowClick(_row: GridRow): void {
    // Highlighting only — there is no grid below this one.
  }

  // ── Add rows ───────────────────────────────────────────────────────────────
  // The model owns the data; the grid picks the new row up through [data], then
  // we open it for editing on the next tick once it has rendered.
  addScopeRow(): void {
    const uid = this.model.addScopeRow();
    setTimeout(() => this.scopesGrid?.startEdit(uid));
  }

  addStepRow(): void {
    const uid = this.model.addStepRow();
    if (uid != null) setTimeout(() => this.stepsGrid?.startEdit(uid));
  }

  addStepApproverRow(): void {
    const uid = this.model.addStepApproverRow();
    if (uid != null) setTimeout(() => this.approversGrid?.startEdit(uid));
  }

  onNew(): void {
    this.addScopeRow();
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    this.model.loadList();
  }

  onDelete(): void {
    // Rows are removed through each grid's ✕ column.
  }

  // ── Edit plumbing ──────────────────────────────────────────────────────────
  // One factory per level instead of an inline arrow on every column.

  private patchScope(field: string) {
    return (value: unknown, row: GridRow) =>
      this.model.updateScope(row['__uid'] as number, { [field]: value });
  }

  private patchStep(field: string) {
    return (value: unknown, row: GridRow) =>
      this.model.updateStep(row['__uid'] as number, { [field]: value });
  }

  private patchApprover(field: string) {
    return (value: unknown, row: GridRow) =>
      this.model.updateStepApprover(row['__uid'] as number, { [field]: value });
  }
}

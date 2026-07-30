import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import {
  col,
  GridBuilder,
  GridComponent,
  type GridApiService,
  type GridRowData,
} from '../../../../shared/ag-grid';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1108DataService } from './services/data.service';
import { Sys1108ModelService } from './services/model.service';

/**
 * SYS1108 — Approval Workflow Setup.
 *
 * Three chained editable grids: Workflow → Approval Steps → Step Approvers. Selecting a row in
 * one narrows the grid below it.
 *
 * Reference implementation for the `shared/ag-grid` framework. Each grid is a `GridBuilder`
 * chain plus a `[height]`; everything else — toolbar, status bar, layout persistence, exports,
 * density — comes from the framework. The three grids are separate instances, so their saved
 * layouts and selections never collide.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1108',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    PageFormLayoutComponent,
    ReactiveFormsModule,
    FormsModule,
    GridComponent,
  ],
  providers: [Sys1108ModelService, Sys1108DataService],
  templateUrl: './sys1108.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sys1108Component implements OnInit {
  public model = inject(Sys1108ModelService);
  public permissionService = inject(FormPermissionService);

  /** Grid handles, captured from `(ready)` — used to open a freshly added row for editing. */
  private scopesGrid?: GridApiService;
  private stepsGrid?: GridApiService;
  private approversGrid?: GridApiService;

  // ── Grid definitions ───────────────────────────────────────────────────────
  // Each grid states only what makes it different. Toolbar, status bar, paging,
  // persistence and density all come from the framework defaults.

  readonly scopeGrid = GridBuilder.create('SYS_APPROVAL_WORKFLOW_GRID')
    .columns([
      col.text('workflow_name', 'Workflow Name').flex(1).minWidth(200)
        .editable(this.patchScope('workflow_name')).done(),
      col.select('branch_no', 'Branch', () => [
        { value: null, label: '— All Branches —' },
        ...this.model.branchOptions(),
      ]).width(180).editable(this.patchScope('branch_no')).done(),
      col.select('department_no', 'Department', () => [
        { value: null, label: '— All Departments —' },
        ...this.model.departmentOptions(),
      ]).width(180).editable(this.patchScope('department_no')).done(),
      col.select('menu_no', 'Menu', () => this.model.enrolledMenuOptions())
        .width(220).editable(this.patchScope('menu_no')).done(),
    ])
    .rowId('__uid')
    .editable({ newRowDefaults: () => ({ branch_no: null, department_no: null, menu_no: null, is_active: 1 }) })
    .toolbar({ title: 'Workflow' })
    .build();

  readonly stepGrid = GridBuilder.create('SYS_APPROVAL_STEP_GRID')
    .columns([
      col.number('step_number', 'Step No').width(100).editable(this.patchStep('step_number')).done(),
      col.select('step_type', 'Step Type', sysConstants.approvalStepTypes)
        .width(150).editable(this.patchStep('step_type')).done(),
      col.number('next_step_no', 'Next Step').width(120).editable(this.patchStep('next_step_no')).done(),
      col.text('step_name', 'Step Name').flex(1).minWidth(150).editable(this.patchStep('step_name')).done(),
    ])
    .rowId('__uid')
    .editable({ newRowDefaults: () => ({ step_number: 1, step_type: 1, next_step_no: null, step_name: '', is_active: 1 }) })
    .toolbar({ title: 'Approval Steps', exportExcel: false, exportCsv: false, print: false })
    .build();

  readonly approverGrid = GridBuilder.create('SYS_STEP_APPROVER_GRID')
    .columns([
      col.select('emp_no', 'Employee', () => this.model.employeeOptions())
        .flex(1).minWidth(200).editable(this.patchApprover('emp_no')).done(),
    ])
    .rowId('__uid')
    .editable({ newRowDefaults: () => ({ emp_no: null, is_active: 1 }) })
    .toolbar({ title: 'Step Approvers', exportExcel: false, exportCsv: false, print: false })
    .build();

  // ── Data ───────────────────────────────────────────────────────────────────
  readonly scopeRows = computed(() => this.model.scopes() as unknown as GridRowData[]);
  readonly stepRows = computed(() => this.model.currentSteps() as unknown as GridRowData[]);
  readonly approverRows = computed(() => this.model.currentApprovers() as unknown as GridRowData[]);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1108');
    this.model.loadLookups();
    this.model.loadList();
  }

  // ── Grid handles ───────────────────────────────────────────────────────────
  onScopesReady(api: GridApiService): void {
    this.scopesGrid = api;
  }

  onStepsReady(api: GridApiService): void {
    this.stepsGrid = api;
  }

  onApproversReady(api: GridApiService): void {
    this.approversGrid = api;
  }

  // ── Selection drives the chain ─────────────────────────────────────────────
  onScopeRowClick(row: GridRowData): void {
    this.model.selectScope(row['__uid'] as number);
  }

  onStepRowClick(row: GridRowData): void {
    this.model.selectStep(row['__uid'] as number);
  }

  // ── Add rows ───────────────────────────────────────────────────────────────
  // The model owns the data; the grid picks a new row up through [data], then it is
  // opened for editing once it has rendered.
  addScopeRow(): void {
    const uid = this.model.addScopeRow();
    queueMicrotask(() => this.scopesGrid?.startEdit(String(uid)));
  }

  addStepRow(): void {
    const uid = this.model.addStepRow();
    if (uid != null) queueMicrotask(() => this.stepsGrid?.startEdit(String(uid)));
  }

  addStepApproverRow(): void {
    const uid = this.model.addStepApproverRow();
    if (uid != null) queueMicrotask(() => this.approversGrid?.startEdit(String(uid)));
  }

  // ── Page actions ───────────────────────────────────────────────────────────
  onSearchTermChange(value: string): void {
    this.model.searchTerm.set(value);
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

  // ── Edit plumbing ──────────────────────────────────────────────────────────
  // One factory per level, so a column says which field it edits and nothing more.

  private patchScope(field: string) {
    return (value: unknown, row: GridRowData) =>
      this.model.updateScope(row['__uid'] as number, { [field]: value });
  }

  private patchStep(field: string) {
    return (value: unknown, row: GridRowData) =>
      this.model.updateStep(row['__uid'] as number, { [field]: value });
  }

  private patchApprover(field: string) {
    return (value: unknown, row: GridRowData) =>
      this.model.updateStepApprover(row['__uid'] as number, { [field]: value });
  }
}

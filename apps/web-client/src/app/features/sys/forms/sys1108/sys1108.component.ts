import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridApiService } from '../../../../shared/ag-grid/services/grid-api.service';
import {
  GridConfig,
  GridLookupOption,
} from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1108DataService } from './services/data.service';
import {
  ApprovalScope,
  ApprovalStep,
  StepApprover,
  Sys1108ModelService,
} from './services/model.service';

/**
 * SYS1108 — Approval Workflow Setup.
 *
 * Three chained grids: Workflow → Approval Steps → Step Approvers. Selecting a row
 * in one narrows the next.
 *
 * All three run with `externalRowState`: the model service is the single source of
 * truth. It holds every step and approver across all workflows and hands each grid a
 * filtered slice, so the grid must not own the rows — switching workflow replaces a
 * child grid's `[data]`, and grid-owned state would discard unsaved edits with it.
 * The grids report intent (`rowChange` / `rowRemove` / `addRow`); the model applies it
 * and the result flows back down.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1108',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    NgSelectModule,
    PageFormLayoutComponent,
    ErpGridComponent,
  ],
  providers: [Sys1108ModelService, Sys1108DataService],
  templateUrl: './sys1108.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Sys1108Component implements OnInit {
  public model = inject(Sys1108ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  private workflowGridApi?: GridApiService<ApprovalScope>;
  private stepGridApi?: GridApiService<ApprovalStep>;

  readonly scopes = computed(() => this.model.scopes());
  readonly steps = computed(() => this.model.currentSteps());
  readonly approvers = computed(() => this.model.currentApprovers());

  /**
   * Built once and kept `readonly` — the config is static, rows flow separately
   * through `[data]`. Lookup columns take a FUNCTION so the options stay reactive
   * as the lookups load, without ever rebuilding the columns.
   */
  readonly workflowGrid: GridConfig<ApprovalScope> = {
    gridKey: 'SYS_1108_WORKFLOW_GRID',
    externalRowState: true,
    selectionMode: 'single',
    autoSelectFirstRow: true,
    rowIdField: '__uid',
    height: '200px',
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    canAdd: () => this.permissionService.canInsert(),
    canEdit: () => this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'Workflow',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search workflows...',
    },
    columns: [
      GridColumns.text<ApprovalScope>('workflow_name', 'Workflow Name')
        .flex(2)
        .minWidth(180)
        .required()
        .build(),
      GridColumns.lookup<ApprovalScope>('branch_no', 'Branch', () =>
        this.opts(this.model.branchOptions()),
      )
        .flex(1)
        .minWidth(140)
        .build(),
      GridColumns.lookup<ApprovalScope>('department_no', 'Department', () =>
        this.opts(this.model.departmentOptions()),
      )
        .flex(1)
        .minWidth(140)
        .build(),
      GridColumns.lookup<ApprovalScope>('menu_no', 'Menu Form', () =>
        this.opts(this.model.enrolledMenuOptions()),
      )
        .flex(1)
        .minWidth(160)
        .build(),
      GridColumns.action<ApprovalScope>().build(),
    ],
  };

  readonly stepGrid: GridConfig<ApprovalStep> = {
    gridKey: 'SYS_1108_STEP_GRID',
    externalRowState: true,
    selectionMode: 'single',
    autoSelectFirstRow: true,
    rowIdField: '__uid',
    height: '150px',
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    canAdd: () => this.permissionService.canInsert() && this.model.selectedScopeUid() !== null,
    canEdit: () => this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'Approval Steps',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search steps...',
    },
    columns: [
      GridColumns.number<ApprovalStep>('step_number', 'Step No')
        .width(90)
        .build(),
      GridColumns.select<ApprovalStep>(
        'step_type',
        'Step Type',
        sysConstants.approvalStepTypes as GridLookupOption[],
      )
        .width(140)
        .build(),
      GridColumns.text<ApprovalStep>('step_name', 'Step Name')
        .flex(1)
        .minWidth(140)
        .build(),
      GridColumns.number<ApprovalStep>('next_step_no', 'Next Step')
        .width(110)
        .build(),
      GridColumns.action<ApprovalStep>().build(),
    ],
  };

  readonly approverGrid: GridConfig<StepApprover> = {
    gridKey: 'SYS_1108_APPROVER_GRID',
    externalRowState: true,
    selectionMode: 'none',
    rowIdField: '__uid',
    height: '150px',
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    canAdd: () => this.permissionService.canInsert() && this.model.selectedStepUid() !== null,
    canEdit: () => this.permissionService.canUpdate(),
    // Approvers are the leaf level — nothing hangs off them, so permission alone decides.
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'Step Approvers',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search approvers...',
    },
    columns: [
      GridColumns.lookup<StepApprover>('emp_no', 'Employee', () =>
        this.opts(this.model.employeeOptions()),
      )
        .flex(1)
        .minWidth(200)
        .build(),
      GridColumns.action<StepApprover>().build(),
    ],
  };

  constructor() {
    // A parent's delete button depends on how many children it has, and that count
    // changes without the parent's own rows changing — the grid would keep the
    // stale button until something else forced a redraw.
    effect(() => {
      this.model.currentSteps().length;
      this.workflowGridApi?.refreshView();
    });
    effect(() => {
      this.model.currentApprovers().length;
      this.stepGridApi?.refreshView();
    });
  }

  onWorkflowGridReady(api: GridApiService<ApprovalScope>): void {
    this.workflowGridApi = api;
  }

  onStepGridReady(api: GridApiService<ApprovalStep>): void {
    this.stepGridApi = api;
  }

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1108');
    this.model.loadLookups();
    this.model.loadList();
  }

  /** The model's `{value,label}` lookups already match the grid's option shape. */
  private opts(list: { value: number; label: string }[]): GridLookupOption[] {
    return list as GridLookupOption[];
  }

  /**
   * Grid-level row delete is always allowed if the user has delete permission.
   * The model cascades children locally. No API call — that's the page-level Delete.
   */
  private canDeleteWorkflow(): boolean {
    return this.permissionService.canDelete();
  }

  private canDeleteStep(): boolean {
    return this.permissionService.canDelete();
  }

  // ── Selection: each grid narrows the next ────────────────────────────────
  onScopeRowClick(row: ApprovalScope): void {
    this.model.selectScope(row.__uid);
  }

  onStepRowClick(row: ApprovalStep): void {
    this.model.selectStep(row.__uid);
  }

  // ── Edits: the grid reports, the model applies ───────────────────────────
  onScopeChange(row: ApprovalScope): void {
    this.model.updateScope(row.__uid, row);
  }

  onStepChange(row: ApprovalStep): void {
    this.model.updateStep(row.__uid, row);
  }

  onApproverChange(row: StepApprover): void {
    this.model.updateStepApprover(row.__uid, row);
  }

  // ── Add / remove ─────────────────────────────────────────────────────────
  addScopeRow(): void {
    this.model.addScopeRow();
  }

  addStepRow(): void {
    this.model.addStepRow();
  }

  addApproverRow(): void {
    this.model.addStepApproverRow();
  }

  /** The model refuses rows that still have children, and says why. */
  onScopeRemove(row: ApprovalScope): void {
    this.model.removeScope(row.__uid);
  }

  onStepRemove(row: ApprovalStep): void {
    this.model.removeStep(row.__uid);
  }

  onApproverRemove(row: StepApprover): void {
    this.model.removeStepApprover(row.__uid);
  }

  // ── Filters — each change re-queries the workflow list ───────────────────
  onFilterBranch(value: number | null): void {
    this.model.applyFilters({ branch: value });
  }

  onFilterDepartment(value: number | null): void {
    this.model.applyFilters({ department: value });
  }

  onFilterMenu(value: number | null): void {
    this.model.applyFilters({ menu: value });
  }

  clearFilters(): void {
    this.model.clearFilters();
  }

  // ── Page actions ─────────────────────────────────────────────────────────
  onSearchTermChange(value: string): void {
    this.model.searchTerm.set(value);
  }

  onNew(): void {
    this.addScopeRow();
  }

  onSave(): void {
    this.alertService
      .confirm('Do you want to save this workflow?', 'Save Confirmation')
      .subscribe((confirmed) => {
        if (confirmed) this.model.onSave();
      });
  }

  onDelete(): void {
    this.alertService
      .deleteConfirm('Are you sure you want to delete this workflow? This action cannot be undone.')
      .subscribe((confirmed) => {
        if (confirmed) this.model.deleteScope();
      });
  }

  onReset(): void {
    this.model.loadList();
  }
}

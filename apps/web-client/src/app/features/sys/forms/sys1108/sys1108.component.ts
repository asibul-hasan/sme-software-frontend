import { Component, ChangeDetectionStrategy, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { activeStatusOptions, yesNoOptions } from '../../../../core/constants/common-options.constants';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1108ModelService } from './services/model.service';
import { Sys1108DataService } from './services/data.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DataGridComponent } from '../../../../shared/grid/data-grid.component';
import type { GridColumnDef, GridConfig, GridReadyEvent, GridRow } from '../../../../shared/grid/grid.types';

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

  readonly activeStatusOptions = activeStatusOptions;
  readonly yesNoOptions = yesNoOptions;

  // Grid-ready handles for imperative control (addRow, etc.)
  scopesGrid?: GridReadyEvent;
  stepsGrid?: GridReadyEvent;
  approversGrid?: GridReadyEvent;

  readonly permissionService = inject(FormPermissionService);

  // ── Grid configs ───────────────────────────────────────────────────────────
  readonly scopeGridConfig: Partial<GridConfig> = {
    showToolbar: false,
    showSearch: false,
    showExport: false,
    showColumnToggle: false,
    showSerial: true,
    pagination: false,
    dense: true,
    height: '100%',
    rowKey: '__uid',
  };

  readonly stepGridConfig: Partial<GridConfig> = {
    showToolbar: false,
    showSearch: false,
    showExport: false,
    showColumnToggle: false,
    showSerial: true,
    pagination: false,
    dense: true,
    height: '100%',
    rowKey: '__uid',
  };

  readonly approverGridConfig: Partial<GridConfig> = {
    showToolbar: false,
    showSearch: false,
    showExport: false,
    showColumnToggle: false,
    showSerial: true,
    pagination: false,
    dense: true,
    height: '100%',
    rowKey: '__uid',
  };

  // ── Column definitions ─────────────────────────────────────────────────────
  readonly scopeColumns: GridColumnDef[] = [
    {
      title: 'Workflow Name', field: 'workflow_name', flex: 1, minWidth: 200, editable: true,
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { workflow_name: v as string }),
    },
    {
      title: 'Branch', field: 'branch_no', cellType: 'select', width: 180, editable: true,
      options: (row) => [{ value: null, label: '-- All Branches --' }, ...this.model.branchOptions()],
      value: (r) => {
        const opts = this.model.branchOptions();
        const opt = opts.find(o => o.value === r['branch_no']);
        return opt?.label ?? '';
      },
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { branch_no: v as number }),
    },
    {
      title: 'Department', field: 'department_no', cellType: 'select', width: 180, editable: true,
      options: (row) => [{ value: null, label: '-- All Departments --' }, ...this.model.departmentOptions()],
      value: (r) => {
        const opts = this.model.departmentOptions();
        const opt = opts.find(o => o.value === r['department_no']);
        return opt?.label ?? '';
      },
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { department_no: v as number }),
    },
    {
      title: 'Menu', field: 'menu_no', cellType: 'select', width: 220, editable: true,
      options: () => this.model.enrolledMenuOptions(),
      value: (r) => {
        const opts = this.model.enrolledMenuOptions();
        const opt = opts.find(o => o.value === r['menu_no']);
        return opt?.label ?? '';
      },
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { menu_no: v as number }),
    },
    {
      title: '', field: '__actions', cellType: 'actions', width: 60, pin: 'right',
      actions: [
        {
          kind: 'delete',
          tooltip: 'Remove Scope',
          onClick: (r) => this.model.removeScope(r['__uid'] as number),
        },
      ],
    },
  ];

  readonly stepColumns: GridColumnDef[] = [
    {
      title: 'Step No', field: 'step_number', cellType: 'number', width: 100, editable: true,
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_number: v as number }),
    },
    {
      title: 'Step Type', field: 'step_type', cellType: 'select', width: 150, editable: true,
      options: () => sysConstants.approvalStepTypes,
      value: (r) => {
        const opt = sysConstants.approvalStepTypes.find(o => o.value === r['step_type']);
        return opt?.label ?? '';
      },
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_type: v as number }),
    },
    {
      title: 'Next Step No', field: 'next_step_no', cellType: 'number', width: 120, editable: true,
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { next_step_no: v as number }),
    },
    {
      title: 'Step Name', field: 'step_name', flex: 1, minWidth: 150, editable: true,
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_name: v as string }),
    },
    {
      title: '', field: '__actions', cellType: 'actions', width: 60, pin: 'right',
      actions: [
        {
          kind: 'delete',
          tooltip: 'Remove Step',
          onClick: (r) => this.model.removeStep(r['__uid'] as number),
        },
      ],
    },
  ];

  readonly approverColumns: GridColumnDef[] = [
    {
      title: 'Employee Name', field: 'emp_no', cellType: 'select', flex: 1, minWidth: 200, editable: true,
      options: () => this.model.employeeOptions(),
      value: (r) => {
        const opt = this.model.employeeOptions().find(o => o.value === r['emp_no']);
        return opt?.label ?? '';
      },
      onChange: (v, r) => this.model.updateStepApprover(r['__uid'] as number, { emp_no: v as number }),
    },
    {
      title: '', field: '__actions', cellType: 'actions', width: 60, pin: 'right',
      actions: [
        {
          kind: 'delete',
          tooltip: 'Remove Approver',
          onClick: (r) => this.model.removeStepApprover(r['__uid'] as number),
        },
      ],
    },
  ];

  // ── Table data (cast to GridRow) ───────────────────────────────────────────
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

  onScopeRowClick(row: GridRow): void {
    this.model.selectScope(row['__uid'] as number);
  }

  onStepRowClick(row: GridRow): void {
    this.model.selectStep(row['__uid'] as number);
  }

  onApproverRowClick(_row: GridRow): void {
    // No-op — selection highlight is handled by the grid.
  }

  addScopeRow(): void {
    this.model.addScopeRow();
    // Focus the new row in edit mode after Angular renders it.
    setTimeout(() => this.scopesGrid?.addRow());
  }

  addStepRow(): void {
    this.model.addStepRow();
    setTimeout(() => this.stepsGrid?.addRow());
  }

  addStepApproverRow(): void {
    this.model.addStepApproverRow();
    setTimeout(() => this.approversGrid?.addRow());
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
    // Handled by row actions
  }
}

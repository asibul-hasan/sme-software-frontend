import { Component, ChangeDetectionStrategy, OnInit, inject, computed, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { activeStatusOptions, yesNoOptions } from '../../../../core/constants/common-options.constants';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1108ModelService } from './services/model.service';
import { Sys1108DataService } from './services/data.service';
import { ColumnDef, TableConfig, CommonTableComponent } from '../../../../shared/components/common-table';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1108',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ReactiveFormsModule, FormsModule],
  providers: [Sys1108ModelService, Sys1108DataService],
  templateUrl: './sys1108.component.html',
  styles: [],
})
export class Sys1108Component implements OnInit {
  public model = inject(Sys1108ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  
  @ViewChild('scopesTable') scopesTable!: CommonTableComponent;
  @ViewChild('stepsTable') stepsTable!: CommonTableComponent;
  @ViewChild('approversTable') approversTable!: CommonTableComponent;

  readonly activeStatusOptions = activeStatusOptions;
  readonly yesNoOptions = yesNoOptions;

  constructor() {
    // Mirror the model's selection onto the grids. `setActiveRow` never emits
    // `rowClick`, so this can't loop back into selectScope/selectStep.
    effect(() => {
      const uid = this.model.selectedScopeUid();
      const row = this.scopeTableData().find((r: any) => r.__uid === uid);
      this.scopesTable?.setActiveRow(row ?? null);
    });

    effect(() => {
      const uid = this.model.selectedStepUid();
      const row = this.stepTableData().find((r: any) => r.__uid === uid);
      this.stepsTable?.setActiveRow(row ?? null);
    });
  }

  // Configs
  scopeTableConfig: Partial<TableConfig> = {
    showTitle: false,
    showSearch: false,
    pagination: false,
    dense: true,
    compact: true,
    striped: true,
    selectable: false,
    showActions: true,
    actions: [
      {
        type: 'delete',
        icon: 'delete',
        tooltip: 'Remove Scope',
        variant: 'danger',
        onClick: (row) => this.model.removeScope(row['__uid'] as number)
      }
    ]
  };

  stepTableConfig: Partial<TableConfig> = {
    showTitle: false,
    showSearch: false,
    pagination: false,
    dense: true,
    compact: true,
    striped: true,
    selectable: false,
    showActions: true,
    actions: [
      {
        type: 'delete',
        icon: 'delete',
        tooltip: 'Remove Step',
        variant: 'danger',
        onClick: (row) => this.model.removeStep(row['__uid'] as number)
      }
    ]
  };

  approverTableConfig: Partial<TableConfig> = {
    showTitle: false,
    showSearch: false,
    pagination: false,
    dense: true,
    compact: true,
    striped: true,
    selectable: false,
    showActions: true,
    actions: [
      {
        type: 'delete',
        icon: 'delete',
        tooltip: 'Remove Approver',
        variant: 'danger',
        onClick: (row) => this.model.removeStepApprover(row['__uid'] as number)
      }
    ]
  };

  scopeTableColumns = computed<ColumnDef[]>(() => [
    { 
      title: 'Workflow Name', field: 'workflow_name', cellType: 'text', editable: true, minWidth: '200px',
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { workflow_name: v as string })
    },
    { 
      title: 'Branch', field: 'branch_no', cellType: 'select', 
      options: this.model.branchOptions(), editable: true, minWidth: '150px',
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { branch_no: v as number })
    },
    { 
      title: 'Department', field: 'department_no', cellType: 'select', 
      options: this.model.departmentOptions(), editable: true, minWidth: '150px',
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { department_no: v as number })
    },
    { 
      title: 'Menu', field: 'menu_no', cellType: 'select', 
      options: this.model.enrolledMenuOptions(), editable: true, minWidth: '200px',
      onChange: (v, r) => this.model.updateScope(r['__uid'] as number, { menu_no: v as number })
    }
  ]);

  stepTableColumns = computed<ColumnDef[]>(() => [
    { 
      title: 'Step No', field: 'step_number', cellType: 'number', editable: true, width: '90px',
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_number: v as number })
    },
    { 
      title: 'Step Type', field: 'step_type', cellType: 'select', 
      options: sysConstants.approvalStepTypes, editable: true, minWidth: '150px',
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_type: v as number })
    },
    { 
      title: 'Next Step No', field: 'next_step_no', cellType: 'number', editable: true, width: '120px',
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { next_step_no: v as number })
    },
    { 
      title: 'Step Name', field: 'step_name', cellType: 'text', editable: true, minWidth: '150px',
      onChange: (v, r) => this.model.updateStep(r['__uid'] as number, { step_name: v as string })
    }
  ]);

  approverTableColumns = computed<ColumnDef[]>(() => [
    { 
      title: 'Employee Name', field: 'emp_no', cellType: 'select', 
      options: this.model.employeeOptions(), editable: true, minWidth: '200px',
      onChange: (v, r) => this.model.updateStepApprover(r['__uid'] as number, { emp_no: v as number })
    }
  ]);

  scopeTableData = computed(() => this.model.scopes() as unknown as Record<string, unknown>[]);
  stepTableData = computed(() => this.model.currentSteps() as unknown as Record<string, unknown>[]);
  approverTableData = computed(() => this.model.currentApprovers() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1108');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  onScopeRowClick(row: Record<string, unknown>): void {
    this.model.selectScope(row['__uid'] as number);
  }

  onStepRowClick(row: Record<string, unknown>): void {
    this.model.selectStep(row['__uid'] as number);
  }

  onApproverRowClick(_row: Record<string, unknown>): void {
    // Highlighting is handled by the table's own active-row state; nothing to do.
  }

  /**
   * Make the row just appended the active row and open it for editing.
   * `selectRow` emits `rowClick` once (so the child grids follow the new
   * master) and is a no-op if that row is already active.
   */
  private focusNewRow(
    table: CommonTableComponent | undefined,
    data: Record<string, unknown>[],
  ): void {
    if (!table || !data.length) return;
    const index = data.length - 1;
    table.selectRow(data[index]);
    table.startRowEdit(data[index], index);
  }

  addScopeRow(): void {
    this.model.addScopeRow();
    setTimeout(() => this.focusNewRow(this.scopesTable, this.scopeTableData()));
  }

  addStepRow(): void {
    this.model.addStepRow();
    setTimeout(() => this.focusNewRow(this.stepsTable, this.stepTableData()));
  }

  addStepApproverRow(): void {
    this.model.addStepApproverRow();
    setTimeout(() =>
      this.focusNewRow(this.approversTable, this.approverTableData()),
    );
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

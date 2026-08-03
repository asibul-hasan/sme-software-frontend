import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { activeStatusOptions } from '../../../../core/constants/common-options.constants';
import { Sys1102ModelService, IRole } from './services/model.service';
import { Sys1102DataService } from './services/data.service';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig, GridColumns } from '../../../../shared/ag-grid';

/**
 * SYS1102 – Role Management.
 *
 * Master-detail CRUD over company-scoped role templates (SYS re-plan). Roles are assigned to
 * users per branch (see SYS1101); permission grants live in SYS1103 (Role Permission Matrix).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1102',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Sys1102ModelService, Sys1102DataService],
  templateUrl: './sys1102.component.html',
  styles: [],
})
export class Sys1102Component implements OnInit {
  public model = inject(Sys1102ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  readonly activeStatusOptions = activeStatusOptions;

  readonly roleGrid: GridConfig<IRole> = {
    gridKey: 'SYS_1102_ROLES_SIDEBAR',
    rowIdField: 'role_no',
    selectionMode: 'single',
    externalRowState: true,
    showPagination: false,
    showStatusBar: false,
    canAdd: () => false,
    canEdit: () => false,
    canDeleteRow: () => false,
    toolbar: {
      showAdd: false, showDelete: false, showSearch: true,
      showExport: true, showColumnChooser: true,
    },
    columns: [
      GridColumns.text<IRole>('role_name', 'Name').flex(1).minWidth(120).build(),
    ],
  };

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1102');
    this.model.loadBranches();
    this.model.loadRoles();
  }

  onSearchTermChange(val: string): void {
    // left intentionally empty or completely removed
  }

  onSave(): void {
    this.model.onSave();
  }

  onNew(): void {
    this.model.onNew();
  }

  onReset(): void {
    const roleNo = this.model.selectedRoleNo();
    if (roleNo) {
      const r = this.model.roles().find((x) => x.role_no === roleNo);
      if (r) this.model.selectRole(r);
    } else {
      this.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedRoleNo()) return;
    this.alertService
      .deleteConfirm('Are you sure you want to delete this role?')
      .subscribe((confirmed) => {
        if (confirmed) this.model.onDelete();
      });
  }
}

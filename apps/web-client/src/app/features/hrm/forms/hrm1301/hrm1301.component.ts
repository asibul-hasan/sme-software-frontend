import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig, BadgeConfig } from '../../../../shared/components/common-table';

import { Hrm1301ModelService, LeaveApplication } from './services/model.service';
import { Hrm1301DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1301',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Hrm1301ModelService, Hrm1301DataService],
  templateUrl: './hrm1301.component.html',
  styles: [`:host { display: block; height: 100%; } .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; } .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }`],
})
export class Hrm1301Component implements OnInit {
  public model             = inject(Hrm1301ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly statusOptions = hrmConstants.leaveStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1301');
      this.model.loadEmployees();
      this.model.loadLeaveTypes();
      this.model.loadLeaves();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  tableColumns: ColumnDef[] = [
    { title: 'ID', field: 'leave_application_no', sort: true, cellType: 'text', width: '80px', pin: 'left' },
    { title: 'Employee', field: 'employee_no', sort: true, cellType: 'text', value: (r) => this.model.employeeName(r['employee_no'] as number) },
    { title: 'Leave Type', field: 'leave_type_no', sort: true, cellType: 'text', value: (r) => this.model.leaveTypeName(r['leave_type_no'] as number) },
    { title: 'From Date', field: 'from_date', sort: true, cellType: 'date', dateFormat: 'dd/MM/yyyy' },
    { title: 'To Date', field: 'to_date', sort: true, cellType: 'date', dateFormat: 'dd/MM/yyyy' },
    { title: 'Days', field: 'total_days', sort: true, cellType: 'text', align: 'right' },
    { title: 'Reason', field: 'reason', sort: true, cellType: 'text' },
    { title: 'Reliever', field: 'reliever_employee_no', sort: true, cellType: 'text', value: (r) => this.model.employeeName(r['reliever_employee_no'] as number) },
    { title: 'Status', field: 'status', sort: true, cellType: 'badge', width: '120px',
      badgeConfig: (val) => this.leaveStatusBadge(val), value: (r) => this.statusLabel(r['status'] as number) },
  ];

  /**
   * Leave status → pill. The shared {@link statusBadge} treats the numeric code {@code 1} as an
   * "active" flag (green "Active"), which mislabels a Draft leave; leave status is its own 1–5
   * enum (Draft/Applied/Approved/Rejected/Cancelled), so map it explicitly.
   */
  leaveStatusBadge(value: unknown): BadgeConfig {
    switch (Number(value)) {
      case 1:  return { label: 'Draft',     variant: 'neutral' };
      case 2:  return { label: 'Applied',   variant: 'warning' };
      case 3:  return { label: 'Approved',  variant: 'success' };
      case 4:  return { label: 'Rejected',  variant: 'danger'  };
      case 5:  return { label: 'Cancelled', variant: 'neutral' };
      default: return { label: this.statusLabel(Number(value)), variant: 'neutral' };
    }
  }

  tableConfig: Partial<TableConfig> = {
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    dense: true,
    striped: true,
    minHeight: '320px',
    // Identity for the row-selection contract: re-clicking the loaded record
    // must not reload it. Unsaved rows fall back to object identity.
    rowKey: (row) => row['leave_application_no'] ?? row,
  };

  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isEditable(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.leaves().find((l) => l.leave_application_no === this.model.selectedNo());
      if (original) this.model.selectLeave(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectLeave(item: LeaveApplication | Record<string, unknown>): void {
    const leaveItem = item as unknown as LeaveApplication;
    this.model.selectLeave(leaveItem);
  }
  onLookupChange(): void { this.model.refreshBalance(); }

  submit(): void  { this.model.doAction('submit'); }
  approve(): void { this.model.doAction('approve'); }
  reject(): void  { this.model.doAction('reject'); }
  cancel(): void {
    this.alertService.confirm('Cancel this leave? An approved leave will return the consumed days.', 'Cancel Leave', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('cancel'); });
  }

  statusLabel(value: number): string {
    return this.statusOptions.find((s) => s.value === value)?.label ?? String(value);
  }
  statusClass(value: number): string {
    return value === 3 ? 'list-item-tag--primary' : (value === 4 || value === 5) ? 'list-item-tag--warning' : '';
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

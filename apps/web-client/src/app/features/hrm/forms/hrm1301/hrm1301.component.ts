import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  computed,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatCheckboxChange } from '@angular/material/checkbox';
import { ToastrService } from 'ngx-toastr';
import { SharedModule } from '../../../../shared/shared.module';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import {
  ColumnDef,
  TableConfig,
  BadgeConfig,
} from '../../../../shared/components/common-table';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import { GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';

import {
  Hrm1301ModelService,
  LeaveApplication,
} from './services/model.service';
import { Hrm1301DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1301',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,

    AppDatePickerComponent,
    ErpGridComponent,
    AppDecimalPipe,
  ],
  providers: [Hrm1301ModelService, Hrm1301DataService],
  templateUrl: './hrm1301.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .fill-card {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .fill-card > .card-body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class Hrm1301Component implements OnInit {
  public model = inject(Hrm1301ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);

  readonly statusOptions = hrmConstants.leaveStatuses;

  readonly balance = computed(
    () =>
      this.model.balance() ?? {
        employee_no: 0,
        leave_type_no: 0,
        leave_year: 0,
        entitled_days: 0,
        accrued_days: 0,
        consumed_days: 0,
        carried_forward: 0,
        available_days: 0,
      },
  );

  readonly selected = computed(() => {
    const no = this.model.selectedNo();
    if (!no) return null;
    return (
      this.model.leaves().find((l) => l.leave_application_no === no) ?? null
    );
  });

  readonly currentYear = new Date().getFullYear();
  readonly yearOptions = [
    this.currentYear - 2,
    this.currentYear - 1,
    this.currentYear,
    this.currentYear + 1,
  ];

  readonly balanceType = computed(() => {
    const typeNo =
      this.model.balanceLeaveType() ??
      this.formdata?.get('leave_type_no')?.value;
    if (!typeNo) return 'All Types';
    return this.model.leaveTypeName(typeNo) || 'Selected Leave Type';
  });

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

  readonly leaveGrid: GridConfig<LeaveApplication> = {
    gridKey: 'HRM_1301_LEAVE_HISTORY',
    rowIdField: 'leave_application_no',
    selectionMode: 'single',
    externalRowState: true,
    showPagination: true,
    showStatusBar: true,
    canAdd: () => false,
    canEdit: () => false,
    canDeleteRow: () => false,
    toolbar: {
      showAdd: false,
      showDelete: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
    },
    columns: [
      GridColumns.text<LeaveApplication>('leave_application_no', 'ID')
        .width(80)
        .pinned('left')
        .build(),
      GridColumns.text<LeaveApplication>('employee_no', 'Employee')
        .valueFormatter((_, r) => this.model.employeeName(r.employee_no))
        .build(),
      GridColumns.text<LeaveApplication>('leave_type_no', 'Leave Type')
        .valueFormatter((_, r) => this.model.leaveTypeName(r.leave_type_no))
        .build(),
      GridColumns.date<LeaveApplication>('from_date', 'From Date')
        .width(110)
        .build(),
      GridColumns.date<LeaveApplication>('to_date', 'To Date')
        .width(110)
        .build(),
      GridColumns.text<LeaveApplication>('total_days', 'Days')
        .width(80)
        .align('right')
        .build(),
      GridColumns.text<LeaveApplication>('reason', 'Reason').build(),
      GridColumns.text<LeaveApplication>('reliever_employee_no', 'Reliever')
        .valueFormatter((_, r) =>
          this.model.employeeName(r.reliever_employee_no),
        )
        .build(),
      GridColumns.text<LeaveApplication>('reliever_status', 'Reliever Status')
        .width(130)
        .valueFormatter((v, _) => {
          const opt = this.relieverStatusOptions.find(
            (o) => o.value === Number(v),
          );
          return opt ? opt.label : 'Pending';
        })
        .build(),
      GridColumns.text<LeaveApplication>('status', 'Status')
        .width(120)
        .pinned('right')
        .valueFormatter((v, _) => this.statusLabel(Number(v)))
        .build(),
    ],
  };

  readonly relieverStatusOptions = hrmConstants.relieverStatuses;

  relieverStatusBadge(value: unknown): BadgeConfig {
    const opt = this.relieverStatusOptions.find(
      (o) => o.value === Number(value),
    );
    const label = opt ? opt.label : 'Pending';
    switch (Number(value)) {
      case 1:
        return { label, variant: 'danger' };
      case 2:
        return { label, variant: 'success' };
      default:
        return { label, variant: 'warning' };
    }
  }

  /**
   * Leave status → pill. The shared {@link statusBadge} treats the numeric code {@code 1} as an
   * "active" flag (green "Active"), which mislabels a Draft leave; leave status is its own 1–5
   * enum (Draft/Applied/Approved/Rejected/Cancelled), so map it explicitly.
   */
  leaveStatusBadge(value: unknown): BadgeConfig {
    switch (Number(value)) {
      case 1:
        return { label: 'Draft', variant: 'neutral' };
      case 2:
        return { label: 'Applied', variant: 'warning' };
      case 3:
        return { label: 'Approved', variant: 'success' };
      case 4:
        return { label: 'Rejected', variant: 'danger' };
      case 5:
        return { label: 'Cancelled', variant: 'neutral' };
      default:
        return { label: this.statusLabel(Number(value)), variant: 'neutral' };
    }
  }

  get formdata() {
    return this.model.form;
  }
  get status(): number {
    return this.model.status();
  }
  get editable(): boolean {
    return this.model.isEditable();
  }

  onSave(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model
        .leaves()
        .find((l) => l.leave_application_no === this.model.selectedNo());
      if (original) this.model.selectLeave(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo() || !this.editable) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  onGridDelete(item: LeaveApplication | Record<string, unknown>): void {
    const leaveItem = item as unknown as LeaveApplication;
    if (leaveItem.status !== 1 && leaveItem.status !== 2) {
       this.toastr.warning('Only Draft or Applied leave applications can be deleted.');
       return;
    }
    
    // We cannot immediately check `this.editable` as selectLeave is async and loads from server.
    // However, the backend delete API will reject if it's already under approval.
    this.model.selectedNo.set(leaveItem.leave_application_no);
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectLeave(item: LeaveApplication | Record<string, unknown>): void {
    const leaveItem = item as unknown as LeaveApplication;
    this.model.selectLeave(leaveItem);
  }
  onLookupChange(): void {
    const empNo = this.formdata.get('employee_no')?.value;
    this.model.onEmployeeChange(empNo);
  }

  submit(): void {
    this.model.doAction('submit');
  }
  approve(): void {
    this.model.doAction('approve');
  }
  reject(): void {
    this.model.doAction('reject');
  }
  cancel(): void {
    this.alertService
      .confirm(
        'Cancel this leave? An approved leave will return the consumed days.',
        'Cancel Leave',
        'warn',
      )
      .subscribe((ok) => {
        if (ok) this.model.doAction('cancel');
      });
  }

  statusLabel(value: number): string {
    return (
      this.statusOptions.find((s) => s.value === value)?.label ?? String(value)
    );
  }
  statusClass(value: number): string {
    return value === 3
      ? 'list-item-tag--primary'
      : value === 4 || value === 5
        ? 'list-item-tag--warning'
        : '';
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

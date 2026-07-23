import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import {
  CommonTableComponent,
  ColumnDef,
  TableConfig,
  BadgeConfig,
} from '../../../../shared/components/common-table';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { hrmConstants } from '../../constants/hrm.constants';
import { Hrm1321ModelService, LeaveRequest } from './services/model.service';
import { Hrm1321DataService } from './services/data.service';

import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CommonDataService,
  DepartmentLookup,
  DesignationLookup,
  EmployeeLookup,
} from '../../../../shared/services/common-data.service';
import { isSuccess } from '../../../../core/models/response.model';
import { EmployeeLeaveHistoryItem, EmployeeLeaveTypeBalance } from './services/data.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { LeaveHistoryDialogComponent } from './components/leave-history-dialog/leave-history-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1321',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
    CommonTableComponent,
    AppDecimalPipe,
  ],
  providers: [Hrm1321ModelService, Hrm1321DataService],
  templateUrl: './hrm1321.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1321Component implements OnInit {
  public model = inject(Hrm1321ModelService);
  public permissionService = inject(FormPermissionService);
  private commonApi = inject(CommonDataService);
  private dataService = inject(Hrm1321DataService);
  private toastr = inject(ToastrService);
  private dialogService = inject(DialogService);

  @ViewChild('datesTpl', { static: true }) datesTpl!: TemplateRef<any>;
  @ViewChild('attachmentTpl', { static: true }) attachmentTpl!: TemplateRef<any>;
  @ViewChild('checkboxTpl', { static: true }) checkboxTpl!: TemplateRef<any>;
  @ViewChild('historyBtnTpl', { static: true }) historyBtnTpl!: TemplateRef<any>;

  readonly statusOptions = hrmConstants.leaveStatuses;

  // Filter signals and data
  departments = signal<DepartmentLookup[]>([]);
  designations = signal<DesignationLookup[]>([]);
  employees = signal<EmployeeLookup[]>([]);
  leaveTypes = signal<Array<{ leave_type_no: number; leave_type_name: string }>>([]);

  filterDept = signal<number | null>(null);
  filterDesig = signal<number | null>(null);
  filterEmp = signal<number | null>(null);
  filterLeaveType = signal<number | null>(null);
  filterStatus = signal<number | null>(null);

  readonly statusFilterOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Pending / Waiting', value: 1 },
    { label: 'Approved', value: 2 },
    { label: 'Rejected', value: 3 },
  ];

  readonly filteredRequests = computed(() => {
    let list = this.model.requests();
    const dept = this.filterDept();
    const desig = this.filterDesig();
    const emp = this.filterEmp();
    const lt = this.filterLeaveType();
    const st = this.filterStatus();

    if (dept != null) {
      const deptObj = this.departments().find(d => d.department_no === dept);
      if (deptObj) {
        list = list.filter(r => r.department_name === deptObj.department_name);
      }
    }
    if (desig != null) {
      const desigObj = this.designations().find(d => d.designation_no === desig);
      if (desigObj) {
        list = list.filter(r => r.designation_name === desigObj.designation_name);
      }
    }
    if (emp != null) {
      list = list.filter(r => r.employee_no === emp);
    }
    if (lt != null) {
      list = list.filter(r => r.leave_type_no === lt);
    }
    // Status is applied server-side (see onStatusChange) — the returned set already matches it.
    void st;

    return list;
  });

  /** Reload from the server for the chosen workflow status (Pending/Waiting, Approved, Rejected). */
  onStatusChange(value: number | null): void {
    this.filterStatus.set(value);
    this.model.loadPending(value);
  }

  clearFilters(): void {
    this.filterDept.set(null);
    this.filterDesig.set(null);
    this.filterEmp.set(null);
    this.filterLeaveType.set(null);
    this.filterStatus.set(null);
  }

  openHistoryModal(): void {
    let req = this.selected();
    if (!req && this.filteredRequests().length > 0) {
      req = this.filteredRequests()[0];
      this.model.selectRequest(req);
    }

    this.dialogService.open(LeaveHistoryDialogComponent, {
      size: 'xl',
      data: {
        employeeNo: req?.employee_no,
        employeeName: req ? `${req.employee_id || ''} · ${req.employee_name || 'Employee'}` : undefined,
        leaveTypeNo: req?.leave_type_no,
        employees: this.employees(),
        leaveTypes: this.leaveTypes(),
      },
    }).subscribe(() => {});
  }

  openHistoryModalFor(row: LeaveRequest): void {
    this.model.selectRequest(row);
    this.dialogService.open(LeaveHistoryDialogComponent, {
      size: 'xl',
      data: {
        employeeNo: row.employee_no,
        employeeName: `${row.employee_id || ''} · ${row.employee_name || 'Employee'}`,
        leaveTypeNo: row.leave_type_no,
        employees: this.employees(),
        leaveTypes: this.leaveTypes(),
      },
    }).subscribe(() => {});
  }

  readonly selected = this.model.selectedRequest;
  readonly balance = this.model.balance;
  /** Remarks — optional to approve, mandatory to reject (business document §wireframe 3). */
  readonly remarks = signal('');
  readonly selectedStep = signal<string | number | null>(null);
  readonly workflowSteps = [
    { label: 'Pending Approval', value: 'pending' },
    { label: 'Step 1: Department Manager', value: 'step_1' },
    { label: 'Step 2: HR Administrator', value: 'step_2' },
    { label: 'Step 3: Final Approval', value: 'step_3' },
  ];
  /** A leave can be acted on only when it sits on THIS approver's layer right now. */
  readonly canActOnSelected = computed(() => this.selected()?.can_act === true);
  readonly canReject = computed(
    () => this.canActOnSelected() && this.remarks().trim().length > 0 && !this.model.isSaving(),
  );
  readonly canApprove = computed(() => this.canActOnSelected() && !this.model.isSaving());
  /** Only actionable rows count toward bulk approve. */
  readonly selectedCount = computed(
    () => this.filteredRequests().filter((r) => r.selected && r.can_act === true).length,
  );
  readonly balanceType = computed(
    () => this.selected()?.leave_type_name ?? 'No request selected',
  );

  tableColumns: ColumnDef[] = [];
  tableConfig: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search pending requests...',
    pagination: true,
    defaultPageSize: 10,
    dense: true,
    striped: true,
    showActions: false,
    minHeight: '280px',
    rowKey: 'leave_application_no',
  };

  ngOnInit(): void {
    this.tableColumns = [
      { title: 'Emp ID', field: 'employee_id', cellType: 'text', sort: true, width: '110px', pin: 'left' },
      { title: 'Employee', field: 'employee_name', cellType: 'text', sort: true, minWidth: '170px' },
      { title: 'Designation', field: 'designation_name', cellType: 'text', minWidth: '150px' },
      { title: 'Department', field: 'department_name', cellType: 'text', minWidth: '150px' },
      { title: 'Leave Type', field: 'leave_type_name', cellType: 'text', sort: true, width: '140px' },
      { title: 'Dates', field: 'from_date', cellType: 'custom-template', customTemplate: this.datesTpl,
        value: (r) => `${r['from_date']} → ${r['to_date']}`, width: '200px' },
      { title: 'Days', field: 'total_days', cellType: 'decimal', align: 'right', precision: 1, width: '90px' },
      { title: 'Reason', field: 'reason', cellType: 'text', minWidth: '180px' },
      { title: 'Reliever', field: 'reliever_name', cellType: 'text', minWidth: '150px' },
      { title: 'Attachment', field: 'attachment_path', cellType: 'custom-template',
        customTemplate: this.attachmentTpl, value: (r) => r['attachment_path'] ?? '', width: '150px' },
      { title: 'Status', field: 'approval_state', cellType: 'badge', width: '130px',
        badgeConfig: (val) => this.approvalStateBadge(val), value: (r) => this.approvalStateLabel(r['approval_state']) },
      { title: 'History', field: 'history_action', cellType: 'custom-template', customTemplate: this.historyBtnTpl, width: '90px', sort: false },
      { title: '', field: 'selected', cellType: 'custom-template', customTemplate: this.checkboxTpl,
        width: '60px', sort: false, hideable: false, pin: 'right' },
    ];

    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1321');
      this.loadFilterLookups();
      this.model.loadPending();
    });
  }

  loadFilterLookups(): void {
    this.commonApi.getDepartmentList().subscribe(res => {
      if (isSuccess(res) && res.data) this.departments.set(res.data);
    });
    this.commonApi.getDesignationList().subscribe(res => {
      if (isSuccess(res) && res.data) this.designations.set(res.data);
    });
    this.commonApi.getEmployeeList().subscribe(res => {
      if (isSuccess(res) && res.data) {
        const mapped = res.data.map(e => ({
          ...e,
          full_name_with_id: `${e.employee_id} - ${e.full_name || (e.first_name ? e.first_name + ' ' + (e.last_name || '') : 'Emp #' + e.employee_no)}`
        }));
        this.employees.set(mapped);
      }
    });
    this.dataService.loadLeaveTypes().subscribe(res => {
      if (isSuccess(res) && res.data) this.leaveTypes.set(res.data);
    });
  }

  statusLabel(value: number): string {
    return this.statusOptions.find((s) => s.value === value)?.label ?? String(value ?? '');
  }

  /** Label shown for the per-approver workflow state. */
  approvalStateLabel(value: unknown): string {
    switch (value) {
      case 'PENDING':  return 'Pending';
      case 'WAITING':  return 'Waiting';
      case 'APPROVED': return 'Approved';
      default:         return String(value ?? '');
    }
  }

  /** Badge colour for the per-approver workflow state (on my layer / upstream / passed). */
  approvalStateBadge(value: unknown): BadgeConfig {
    switch (value) {
      case 'PENDING':  return { label: 'Pending',  variant: 'warning' };
      case 'WAITING':  return { label: 'Waiting',  variant: 'info'    };
      case 'APPROVED': return { label: 'Approved', variant: 'success' };
      default:         return { label: String(value ?? ''), variant: 'neutral' };
    }
  }

  onRowClick(row: Record<string, unknown> | LeaveRequest): void {
    this.model.selectRequest(row as LeaveRequest);
    this.remarks.set('');
  }

  toggleRow(row: LeaveRequest, checked: boolean): void {
    this.model.toggleRowSelection(row.leave_application_no, checked);
  }

  /** Apply the decision to the selected request. */
  decide(action: 'approve' | 'reject'): void {
    const req = this.selected();
    if (!req) return;
    const note = this.remarks().trim();
    if (action === 'reject') {
      if (!note) return;                       // guarded in the template too
      this.model.reject(req.leave_application_no, note);
    } else {
      this.model.approve(req.leave_application_no, note || undefined);
    }
    this.remarks.set('');
  }

  /** Bulk-approve every checked row. */
  approveSelected(): void {
    this.model.approveSelected(this.remarks().trim() || undefined);
    this.remarks.set('');
  }

  onRefresh(): void {
    this.model.loadPending();
  }
}

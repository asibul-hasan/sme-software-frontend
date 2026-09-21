import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig, SelectOption } from '../../../../shared/components/common-table';
import { Hrm1005DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastrService } from 'ngx-toastr';
import { isSuccess } from '../../../../core/models/response.model';
import { hrmConstants } from '../../constants/hrm.constants';
import { CommonDataService } from '../../../../shared/services/common-data.service';
import { LeaveType, LeavePolicySetup } from './services/data.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';

interface WorkingLeaveType extends Partial<LeaveType> {
  __uid: number;
}
interface WorkingPolicy extends Partial<LeavePolicySetup> {
  __uid: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1005',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Hrm1005DataService],
  templateUrl: './hrm1005.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1005Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data       = inject(Hrm1005DataService);
  private commonApi  = inject(CommonDataService);
  private toastr     = inject(ToastrService);
  private alert      = inject(AlertService);
  private authCtx    = inject(AuthContextService);

  readonly table = viewChild(CommonTableComponent);

  private uid = 0;
  lines = signal<WorkingLeaveType[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');

  // Child table state
  selectedLeaveTypeNo = signal<number | null>(null);
  selectedLeaveTypeName = signal('');
  policyLines = signal<WorkingPolicy[]>([]);
  isPolicyLoading = signal(false);

  readonly accrualMethods: SelectOption[] = hrmConstants.leaveAccrualMethods.map(m => ({ label: m.label, value: m.value }));
  designations = signal<SelectOption[]>([]);



  readonly statutoryCategories: SelectOption[] = [
    { label: 'None', value: 'NONE' },
    { label: 'Casual (Min 10)', value: 'CASUAL' },
    { label: 'Sick (Min 14)', value: 'SICK' },
    { label: 'Annual (Earned)', value: 'ANNUAL' },
    { label: 'Maternity', value: 'MATERNITY' }
  ];

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  onStatutoryCategoryChange(val: any, row: any) {
    if (val === 'CASUAL' || val === 'SICK') {
      row['is_carry_forward_allowed'] = 0;
      row['max_carry_forward_days'] = null;
      row['carry_forward_validity_months'] = null;
      if (val === 'SICK') row['documentation_required'] = 1;
      row['eligibility_service_months'] = 0;
    } else if (val === 'ANNUAL') {
      row['eligibility_service_months'] = 12;
    }
  }

  readonly columns = computed<ColumnDef[]>(() => [
    { title: 'Leave ID', field: 'leave_type_id', cellType: 'text', editable: true, minWidth: '120px' },
    { title: 'Leave Name', field: 'leave_type_name', cellType: 'text', editable: true, minWidth: '180px' },
    { title: 'Statutory Cat.', field: 'statutory_category', cellType: 'select', editable: true, options: this.statutoryCategories, minWidth: '150px',
      onChange: (val: any, row: any, col: ColumnDef) => this.onStatutoryCategoryChange(val, row) 
    },
    { title: 'Accrual Method', field: 'accrual_method', cellType: 'select', editable: true, options: this.accrualMethods, minWidth: '140px' },
    { title: 'Default Days', field: 'default_days_per_year', cellType: 'number', editable: true, minWidth: '100px', align: 'right' },
    { title: 'Eligibility (Mo)', field: 'eligibility_service_months', cellType: 'number', editable: true, minWidth: '120px', align: 'right' },
    { title: 'Paid?', field: 'is_paid', cellType: 'checkbox', editable: true, minWidth: '80px', align: 'center' },
    { title: 'Approval?', field: 'requires_approval', cellType: 'checkbox', editable: true, minWidth: '90px', align: 'center' },
    { title: 'Doc Reqd?', field: 'documentation_required', cellType: 'checkbox', editable: (r: any) => r['statutory_category'] !== 'SICK', minWidth: '90px', align: 'center' },
    { title: 'Encashable?', field: 'is_encashable', cellType: 'checkbox', editable: true, minWidth: '100px', align: 'center' },
    { title: 'Lapsable?', field: 'is_lapsable', cellType: 'checkbox', editable: true, minWidth: '90px', align: 'center' },
    { title: 'Carry Forward?', field: 'is_carry_forward_allowed', cellType: 'checkbox', editable: (r: any) => r['statutory_category'] !== 'CASUAL' && r['statutory_category'] !== 'SICK', minWidth: '120px', align: 'center', 
      onChange: (val: any, row: any, col: ColumnDef) => { if (!val) { row['max_carry_forward_days'] = null; row['carry_forward_validity_months'] = null; } } 
    },
    { title: 'Max C/F Days', field: 'max_carry_forward_days', cellType: 'number', editable: (r) => !!(r as Record<string, unknown>)['is_carry_forward_allowed'], minWidth: '110px', align: 'right' },
    { title: 'C/F Validity (Mo)', field: 'carry_forward_validity_months', cellType: 'number', editable: (r) => !!(r as Record<string, unknown>)['is_carry_forward_allowed'], minWidth: '130px', align: 'right' },
    { title: 'Min Duration', field: 'min_duration_days', cellType: 'number', editable: true, minWidth: '110px', align: 'right' },
    { title: 'Max Duration', field: 'max_duration_days', cellType: 'number', editable: true, minWidth: '110px', align: 'right' },
    { title: 'Remarks', field: 'remarks', cellType: 'text', editable: true, minWidth: '180px' },
    { title: 'Active', field: 'is_active', cellType: 'checkbox', editable: true, minWidth: '80px', align: 'center' },
  ]);

  readonly config: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search leave types...',
    pagination: false,
    showActions: true,
    showColumnToggle: true,
    showExport: true,
    height: '100%',
    maxHeight: '100%',
    actions: [
      { type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.removeLine(row['__uid'] as number, row as unknown as WorkingLeaveType) }
    ]
  };

  readonly policyColumns = computed<ColumnDef[]>(() => [
    { title: 'Designation', field: 'employee_group_no', cellType: 'select', editable: true, options: this.designations(), minWidth: '170px' },
    { title: 'Policy Name', field: 'policy_name', cellType: 'text', editable: true, minWidth: '150px' },
    { title: 'Default Days', field: 'default_days', cellType: 'number', editable: true, minWidth: '100px', align: 'right' },
    { title: 'Accrual Method', field: 'accrual_method', cellType: 'select', editable: true, options: this.accrualMethods, minWidth: '140px' },
    { title: 'C/F Allowed?', field: 'is_carry_forward_allowed', cellType: 'checkbox', editable: true, minWidth: '100px', align: 'center' },
    { title: 'Max C/F Days', field: 'max_carry_forward_days', cellType: 'number', editable: (r) => !!(r as Record<string, unknown>)['is_carry_forward_allowed'], minWidth: '110px', align: 'right' },
    { title: 'Encashable?', field: 'is_encashable', cellType: 'checkbox', editable: true, minWidth: '100px', align: 'center' },
    { title: 'Max Encash Days', field: 'max_encashable_days', cellType: 'number', editable: (r) => !!(r as Record<string, unknown>)['is_encashable'], minWidth: '130px', align: 'right' },
    { title: 'Lapsable?', field: 'is_lapsable', cellType: 'checkbox', editable: true, minWidth: '90px', align: 'center' },
  ]);

  readonly policyConfig: Partial<TableConfig> = {
    showSearch: true,
    searchPlaceholder: 'Search policies...',
    pagination: false,
    showActions: true,
    height: '100%',
    maxHeight: '100%',
    actions: [
      { type: 'delete', icon: 'delete', tooltip: 'Remove Policy', variant: 'danger', onClick: (row) => this.removePolicyLine(row['__uid'] as number, row as unknown as WorkingPolicy) }
    ]
  };

  readonly policyTableData = computed(() => {
    return this.policyLines() as unknown as Record<string, unknown>[];
  });

  readonly tableData = computed(() => {
    let result = this.lines();
    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      result = result.filter(l => 
        (l.leave_type_name || '').toLowerCase().includes(term) ||
        (l.leave_type_id || '').toLowerCase().includes(term)
      );
    }
    return result as unknown as Record<string, unknown>[];
  });

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1005');
      this.loadDesignations();
      this.loadData();
    });
  }

  loadDesignations(): void {
    this.commonApi.getDesignationList().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const options: SelectOption[] = res.data.map(d => ({
            label: d.designation_name,
            value: d.designation_no
          }));
          this.designations.set(options);
        }
      }
    });
  }

  loadData(reselectNo?: number): void {
    this.isLoading.set(true);
    this.data.loadLeaveTypes().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const loaded = res.data.map(item => ({ ...item, __uid: ++this.uid }));
          this.lines.set(loaded);
          if (loaded.length > 0) {
            const target = reselectNo != null
              ? loaded.find(l => l.leave_type_no === reselectNo) || loaded[0]
              : loaded[0];
            if (target && target.leave_type_no) {
              this.selectLeaveType(target);
            }
          } else {
            this.selectedLeaveTypeNo.set(null);
            this.addLine();
          }
        }
      },
      error: () => this.toastr.error('Failed to load leave types'),
    });
  }

  onRowClick(row: Record<string, unknown>): void {
    const item = row as unknown as WorkingLeaveType;
    if (item && item.leave_type_no) {
      this.selectLeaveType(item);
    }
  }

  onCarryForwardChange(val: any, row: Record<string, unknown>): void {
    if (!val) {
      row['max_carry_forward_days'] = null;
      row['carry_forward_validity_months'] = null;
    }
  }

  addLine(): void {
    const newLine: WorkingLeaveType = {
      __uid: ++this.uid,
      leave_type_name: '',
      leave_type_id: '',
      is_paid: 1,
      accrual_method: 1,
      requires_approval: 1,
      is_encashable: 0,
      is_carry_forward_allowed: 0,
      is_lapsable: 0,
      is_active: 1,
    };
    this.lines.update(ls => [newLine, ...ls]);
    this.focusLine(newLine.__uid);
  }

  removeLine(uid: number, row: WorkingLeaveType): void {
    if (row.leave_type_no) {
      this.alert.confirm('Are you sure you want to delete this leave type from the database?', 'Delete Leave Type', 'danger')
        .subscribe(ok => {
          if (ok) {
            this.isLoading.set(true);
            this.data.deleteLeaveType(row.leave_type_no!).pipe(finalize(() => this.isLoading.set(false))).subscribe({
              next: (res) => {
                if (isSuccess(res)) {
                  this.toastr.success('Leave type deleted');
                  this.lines.update(ls => ls.filter(l => l.__uid !== uid));
                }
              },
              error: () => this.toastr.error('Failed to delete leave type'),
            });
          }
        });
    } else {
      this.lines.update(ls => ls.filter(l => l.__uid !== uid));
      if (!this.lines().length) this.addLine();
    }
  }

  onReset(): void {
    this.loadData();
  }

  // --- Child Table Methods ---

  selectLeaveType(row: WorkingLeaveType): void {
    if (!row.leave_type_no) return;
    this.selectedLeaveTypeNo.set(row.leave_type_no);
    this.selectedLeaveTypeName.set(row.leave_type_name || row.leave_type_id || 'Unknown');
    this.loadPolicies(row.leave_type_no);
  }

  loadPolicies(leaveTypeNo: number): void {
    this.isPolicyLoading.set(true);
    this.data.loadPolicies().pipe(finalize(() => this.isPolicyLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          // Filter by selected leave_type_no
          const filtered = res.data.filter(p => p.leave_type_no === leaveTypeNo);
          const mapped = filtered.map(item => ({ ...item, __uid: ++this.uid }));
          this.policyLines.set(mapped);
        }
      },
      error: () => this.toastr.error('Failed to load leave policies'),
    });
  }

  readonly policyTable = viewChild<CommonTableComponent>('policyTable');

  addPolicyLine(): void {
    const leaveTypeNo = this.selectedLeaveTypeNo();
    if (!leaveTypeNo) return;
    const newPolicy: WorkingPolicy = {
      __uid: ++this.uid,
      leave_type_no: leaveTypeNo,
      employee_group_no: undefined,
      policy_name: '',
      default_days: 0,
      accrual_method: 1,
      is_carry_forward_allowed: 0,
      is_encashable: 0,
      is_lapsable: 0,
    };
    this.policyLines.update(ls => [newPolicy, ...ls]);
    this.focusPolicyLine(newPolicy.__uid);
  }

  private focusPolicyLine(uid: number): void {
    setTimeout(() => {
      const index = this.policyLines().findIndex(line => line.__uid === uid);
      const tableComp = this.policyTable();
      if (index >= 0 && tableComp) {
        tableComp.startRowEdit(this.policyLines()[index] as unknown as Record<string, unknown>, index);
      }
    });
  }

  removePolicyLine(uid: number, row: WorkingPolicy): void {
    if (row.policy_no) {
      this.alert.confirm('Are you sure you want to delete this policy?', 'Delete Policy', 'danger')
        .subscribe(ok => {
          if (ok) {
            this.data.deletePolicy(row.policy_no!).subscribe({
              next: (res) => {
                if (isSuccess(res)) {
                  this.policyLines.update(ls => ls.filter(l => l.__uid !== uid));
                  this.toastr.success('Policy deleted');
                }
              },
              error: () => this.toastr.error('Failed to delete policy')
            });
          }
        });
    } else {
      this.policyLines.update(ls => ls.filter(l => l.__uid !== uid));
    }
  }

  // --- Master & Detail Unified Save ---

  save(): void {
    const allLines = this.lines();
    if (!allLines.length) {
      this.toastr.warning('Nothing to save');
      return;
    }

    // Validation for master leave types
    for (const line of allLines) {
      if (!line.leave_type_name || !line.leave_type_name.trim()) {
        this.toastr.warning('Leave Name is required for all rows');
        return;
      }
    }

    this.isSaving.set(true);
    const payload = allLines.map(l => ({
      ...l,
      branch_no: l.branch_no || this.currentBranchNo,
      leave_type_name: l.leave_type_name?.trim(),
      leave_type_id: l.leave_type_id?.trim() || undefined
    }));

    // 1. Save master leave types first
    this.data.saveLeaveTypes(payload).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const savedMasterList = res.data;
          
          // Re-map lines with saved master primary keys
          const currentSelectedNo = this.selectedLeaveTypeNo();
          let targetLeaveTypeNo: number | undefined;

          if (currentSelectedNo) {
            const matched = savedMasterList.find(m => m.leave_type_no === currentSelectedNo);
            targetLeaveTypeNo = matched?.leave_type_no ?? currentSelectedNo;
          } else if (savedMasterList.length > 0) {
            targetLeaveTypeNo = savedMasterList[0].leave_type_no;
          }

          // 2. Save child policies for the active master leave type if any
          const policiesToSave = this.policyLines().filter(p => p.employee_group_no);

          if (targetLeaveTypeNo && policiesToSave.length > 0) {
            let completed = 0;
            let hasError = false;

            policiesToSave.forEach(p => {
              const policyPayload: LeavePolicySetup = {
                ...p,
                leave_type_no: targetLeaveTypeNo!,
              } as LeavePolicySetup;

              this.data.savePolicy(policyPayload).subscribe({
                next: () => {
                  completed++;
                  if (completed === policiesToSave.length) {
                    this.isSaving.set(false);
                    this.toastr.success('Leave types and policies saved successfully');
                    this.loadData();
                    if (targetLeaveTypeNo) {
                      this.selectedLeaveTypeNo.set(targetLeaveTypeNo);
                      this.loadPolicies(targetLeaveTypeNo);
                    }
                  }
                },
                error: () => {
                  if (!hasError) {
                    hasError = true;
                    this.isSaving.set(false);
                    this.toastr.error('Failed to save some policies');
                  }
                }
              });
            });
          } else {
            this.isSaving.set(false);
            this.toastr.success('Leave types saved successfully');
            this.loadData();
            if (targetLeaveTypeNo) {
              this.selectedLeaveTypeNo.set(targetLeaveTypeNo);
              this.loadPolicies(targetLeaveTypeNo);
            }
          }
        } else {
          this.isSaving.set(false);
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => {
        this.isSaving.set(false);
        this.toastr.error('Failed to save leave types');
      },
    });
  }

  private focusLine(uid: number): void {
    setTimeout(() => {
      const index = this.lines().findIndex(line => line.__uid === uid);
      const tableComp = this.table();
      if (index >= 0 && tableComp) {
        tableComp.startRowEdit(this.lines()[index] as unknown as Record<string, unknown>, index);
      }
    });
  }
}

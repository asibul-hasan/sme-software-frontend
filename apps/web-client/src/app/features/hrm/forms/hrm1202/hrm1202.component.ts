import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1202ModelService, PayrollRun } from './services/model.service';

import { Hrm1202DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1202',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Hrm1202ModelService, Hrm1202DataService],
  templateUrl: './hrm1202.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1202Component implements OnInit {
  public model             = inject(Hrm1202ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly runTypes = hrmConstants.payrollRunTypes;
  readonly statusOptions = hrmConstants.payrollStatuses;
  readonly runDetail = computed(() => this.model.currentRunDetail());

  // ── Payslip grid (shared common-table per the fixed-table rule) ──────────────
  readonly payslipColumns: ColumnDef[] = [
    { title: 'Employee',   field: 'employee_name',   sort: true,  cellType: 'text' },
    { title: 'Basic',      field: 'basic_salary',     cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Payable',    field: 'payable_days',     cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'OT Hrs',     field: 'ot_hours',         cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'OT Amt',     field: 'ot_amount',        cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Gross',      field: 'gross_earning',    cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Taxable',    field: 'taxable_income',   cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Deductions', field: 'total_deduction',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Employer',   field: 'employer_contribution', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Net Pay',    field: 'net_pay',          cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Payment',    field: 'payment_status',   cellType: 'badge', align: 'center', width: '110px',
      badgeConfig: (v) => v === 2 ? { label: 'Paid', variant: 'success' } : { label: 'Pending', variant: 'neutral' } },
  ];
  readonly payslipConfig: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 15, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '420px',
  };
  readonly payslipData = computed(() =>
    this.model.payslips().map((p) => ({ ...p, employee_name: this.model.employeeName(p.employee_no) })) as unknown as Record<string, unknown>[]
  );

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1202');
      this.model.loadEmployees();
      this.model.loadBonusRuns();
      this.model.loadRuns();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get isNew(): boolean { return !this.model.selectedNo(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.runs().find((r) => r.payroll_run_no === this.model.selectedNo());
      if (original) this.model.selectRun(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo() || (this.status !== 1 && this.status !== 5)) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectRun(item: PayrollRun): void { this.model.selectRun(item); }

  calculate(): void { this.model.doAction('calculate'); }
  approve(): void {
    this.alertService.confirm('Approve this payroll run? Attendance for the period will be locked.', 'Approve Payroll', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('approve'); });
  }
  pay(): void { this.model.doAction('pay'); }
  cancel(): void {
    this.alertService.confirm('Cancel this payroll run?', 'Cancel Run', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('cancel'); });
  }

  runTypeLabel(v: number): string { return this.runTypes.find((t) => t.value === v)?.label ?? String(v); }
  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  postingStatusLabel(v?: number | null): string {
    if (v === 1) return 'Pending';
    if (v === 2) return 'Posted';
    if (v === 3) return 'Failed';
    return 'Not queued';
  }
  postingStatusClass(v?: number | null): string {
    if (v === 2) return 'list-item-tag--primary';
    if (v === 3) return 'list-item-tag--warning';
    return '';
  }
  statusClass(v: number): string {
    return v === 3 || v === 4 ? 'list-item-tag--primary' : v === 5 ? 'list-item-tag--warning' : '';
  }
}

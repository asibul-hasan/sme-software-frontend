import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1203ModelService } from './services/model.service';
import { Hrm1203DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1203',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Hrm1203ModelService, Hrm1203DataService],
  templateUrl: './hrm1203.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Hrm1203Component implements OnInit {
  public model             = inject(Hrm1203ModelService);
  public permissionService = inject(FormPermissionService);

  readonly statusOptions = hrmConstants.payrollStatuses;

  readonly columns: ColumnDef[] = [
    { title: 'Employee',   field: 'employee_name',  sort: true, cellType: 'text', pin: 'left' },
    { title: 'Present',    field: 'present_days',   cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Absent',     field: 'absent_days',    cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Leave',      field: 'leave_days',     cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'LWP',        field: 'lwp_days',       cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Gross',      field: 'gross_earning',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Deductions', field: 'total_deduction',cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Net Pay',    field: 'net_pay',        cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Payment',    field: 'payment_status', cellType: 'badge', align: 'center', width: '110px',
      badgeConfig: (v) => v === 2 ? { label: 'Paid', variant: 'success' } : { label: 'Pending', variant: 'neutral' } },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 20, dense: true, striped: true,
    showActions: false, showColumnToggle: true, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1203');
      this.model.loadLookups();
      this.model.loadRuns();
    });
  }

  onRunChange(no: number): void { this.model.selectRun(no != null ? Number(no) : null); }
  statusLabel(v?: number | null): string { return this.statusOptions.find((s) => s.value === v)?.label ?? ''; }
}

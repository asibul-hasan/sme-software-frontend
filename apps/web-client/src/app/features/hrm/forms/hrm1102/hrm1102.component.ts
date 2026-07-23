import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1102ModelService } from './services/model.service';

import { Hrm1102DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1102',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Hrm1102ModelService, Hrm1102DataService],
  templateUrl: './hrm1102.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1102Component implements OnInit {
  public model             = inject(Hrm1102ModelService);
  public permissionService = inject(FormPermissionService);

  // new-punch entry
  newEmployee: number | null = null;
  newDate: string = new Date().toISOString().split('T')[0];
  newIn: string | null = null;
  newOut: string | null = null;
  newShift: number | null = null;

  readonly statusOptions = hrmConstants.attendanceStatuses;

  // ── Staging grid ──────────────────────────────────────────────────────────
  readonly punchColumns: ColumnDef[] = [
    { title: 'Employee', field: 'employee_name', sort: true, cellType: 'text' },
    { title: 'Date',     field: 'att_date',      sort: true, cellType: 'text', width: '120px' },
    { title: 'In',       field: 'in_time',       cellType: 'text', align: 'center', width: '90px' },
    { title: 'Out',      field: 'out_time',      cellType: 'text', align: 'center', width: '90px' },
    { title: 'Shift',    field: 'shift_name',    cellType: 'text' },
  ];
  readonly punchConfig: Partial<TableConfig> = {
    showSearch: false, pagination: true, defaultPageSize: 10, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '300px',
    showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.model.removePunch(row['__uid'] as number) }],
  };
  readonly punchData = computed(() =>
    this.model.punches().map((p) => ({ ...p, employee_name: this.model.employeeName(p.employee_no), shift_name: this.model.shiftName(p.shift_no) })) as unknown as Record<string, unknown>[]
  );

  // ── Recent grid ───────────────────────────────────────────────────────────
  readonly recentColumns: ColumnDef[] = [
    { title: 'Employee', field: 'employee_name', sort: true, cellType: 'text', pin: 'left' },
    { title: 'Date',     field: 'att_date',      sort: true, cellType: 'text', width: '120px' },
    { title: 'In',       field: 'in_time',       cellType: 'text', align: 'center', width: '90px' },
    { title: 'Out',      field: 'out_time',      cellType: 'text', align: 'center', width: '90px' },
    { title: 'Late (m)', field: 'late_minutes',  cellType: 'number', align: 'right', width: '90px' },
    { title: 'Worked',   field: 'worked_hours',  cellType: 'decimal', align: 'right', precision: 2 },
    { title: 'Status',   field: 'status_label',  sort: true, cellType: 'text', width: '110px' },
    { title: 'Source',   field: 'source_label',  cellType: 'badge', align: 'center', width: '100px',
      badgeConfig: (v) => v === 'Device' ? { label: 'Device', variant: 'success' } : { label: 'Manual', variant: 'neutral' } },
  ];
  readonly recentConfig: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 15, dense: true, striped: true,
    showActions: false, showColumnToggle: true, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '420px',
  };
  readonly recentData = computed(() =>
    this.model.recent().map((r) => ({
      ...r,
      employee_name: this.model.employeeName(r.employee_no),
      status_label: this.statusLabel(r.status),
      source_label: r.source === 2 ? 'Device' : 'Manual',
    })) as unknown as Record<string, unknown>[]
  );

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1102');
      this.model.loadLookups();
      this.model.loadRecent();
    });
  }

  addPunch(): void {
    const ok = this.model.addPunch({
      employee_no: this.newEmployee!, att_date: this.newDate, in_time: this.newIn, out_time: this.newOut, shift_no: this.newShift,
    });
    if (ok) { this.newEmployee = null; this.newIn = null; this.newOut = null; this.newShift = null; }
  }
  sync(): void { this.model.sync(); }
  clearPunches(): void { this.model.clearPunches(); }

  statusLabel(v?: number | null): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v ?? ''); }
}

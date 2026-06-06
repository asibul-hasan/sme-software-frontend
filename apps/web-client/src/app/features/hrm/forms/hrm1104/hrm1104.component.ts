import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1104ModelService, Roster } from './services/model.service';
import { Hrm1104DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1104',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Hrm1104ModelService, Hrm1104DataService],
  templateUrl: './hrm1104.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1104Component implements OnInit {
  public model             = inject(Hrm1104ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  // new-line entry fields
  newEmployee: number | null = null;
  newShift: number | null = null;
  newWeeklyOff: number | null = null;

  readonly weekdays = hrmConstants.weekdays;
  readonly statusOptions = hrmConstants.rosterStatuses;

  readonly lineColumns: ColumnDef[] = [
    { title: 'Employee',   field: 'employee_name', sort: true, cellType: 'text' },
    { title: 'Shift',      field: 'shift_name',    sort: true, cellType: 'text' },
    { title: 'Weekly Off', field: 'weekly_off_label', cellType: 'text', align: 'center', width: '140px' },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 10, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '360px',
    showActions: true,
    actions: [{ type: 'delete', icon: 'delete', tooltip: 'Remove', variant: 'danger', onClick: (row) => this.removeLine(row) }],
  };
  readonly lineData = computed(() =>
    this.model.lines().map((l) => ({
      ...l,
      employee_name: this.model.employeeName(l.employee_no),
      shift_name: this.model.shiftName(l.shift_no),
      weekly_off_label: this.model.weekdayName(l.weekly_off),
    })) as unknown as Record<string, unknown>[]
  );

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1104');
      this.model.loadLookups();
      this.model.loadRosters();
    });
  }

  onSearchTermChange(val: string): void { this.model.searchTerm.set(val); this.model.pager.reset(); }
  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isDraft(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); this.resetNewLine(); }
  onReset(): void {
    if (this.model.selectedNo()) {
      const o = this.model.rosters().find((s) => s.roster_no === this.model.selectedNo());
      if (o) this.model.selectRoster(o);
    } else { this.model.onNew(); }
    this.resetNewLine();
  }
  onDelete(): void {
    if (!this.model.selectedNo() || (this.status !== 1 && this.status !== 3)) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  selectRoster(item: Roster): void { this.model.selectRoster(item); }

  addLine(): void {
    if (this.model.addLine(this.newEmployee, this.newShift, this.newWeeklyOff)) this.resetNewLine();
  }
  removeLine(row: Record<string, unknown>): void { this.model.removeLine(row['__uid'] as number); }
  private resetNewLine(): void { this.newEmployee = null; this.newShift = null; this.newWeeklyOff = null; }

  publish(): void {
    this.alertService.confirm('Publish this roster? It can no longer be edited.', 'Publish Roster', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('publish'); });
  }
  cancel(): void { this.model.doAction('cancel'); }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string { return v === 2 ? 'list-item-tag--primary' : v === 3 ? 'list-item-tag--warning' : ''; }
}

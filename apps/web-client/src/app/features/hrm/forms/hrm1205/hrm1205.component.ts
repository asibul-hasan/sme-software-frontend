import { Component, ChangeDetectionStrategy, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1205ModelService, BonusRun } from './services/model.service';
import { Hrm1205DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1205',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Hrm1205ModelService, Hrm1205DataService],
  templateUrl: './hrm1205.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1205Component implements OnInit {
  public model             = inject(Hrm1205ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly bonusTypes = hrmConstants.bonusTypes;
  readonly bonusCalculationTypes = hrmConstants.bonusCalculationTypes;
  readonly bonusApplicabilityOptions = hrmConstants.bonusApplicabilityOptions;
  readonly statusOptions = hrmConstants.payrollStatuses;

  // ── Bonus lines grid (shared common-table per the fixed-table rule) ──────────
  readonly lineColumns: ColumnDef[] = [
    { title: 'Employee',     field: 'employee_name', sort: true, cellType: 'text' },
    { title: 'Basis Amount', field: 'base_salary',   cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Bonus Amount', field: 'bonus_amount',  cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly lineConfig: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 15, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '420px',
  };
  readonly lineData = computed(() =>
    this.model.lines().map((l) => ({ ...l, employee_name: this.model.employeeName(l.employee_no) })) as unknown as Record<string, unknown>[]
  );

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1205');
      this.model.loadEmployees();
      this.model.loadDesignations();
      this.model.loadRuns();
    });
  }

  onSearchTermChange(val: string): void { this.model.searchTerm.set(val); this.model.pager.reset(); }
  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isEditable(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void {
    if (this.model.selectedNo()) {
      const o = this.model.runs().find((r) => r.bonus_run_no === this.model.selectedNo());
      if (o) this.model.selectRun(o);
    } else { this.model.onNew(); }
  }
  onDelete(): void {
    if (!this.model.selectedNo() || (this.status !== 1 && this.status !== 5)) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  selectRun(item: BonusRun): void { this.model.selectRun(item); }

  calculate(): void { this.model.doAction('calculate'); }
  approve(): void { this.model.doAction('approve'); }
  reject(): void { this.model.doAction('reject'); }
  pay(): void { this.model.doAction('pay'); }
  cancel(): void {
    this.alertService.confirm('Cancel this bonus run?', 'Cancel Run', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('cancel'); });
  }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  bonusTypeLabel(v?: number | null): string { return this.bonusTypes.find((t) => t.value === v)?.label ?? ''; }
  calculationTypeLabel(v?: number | null): string { return this.bonusCalculationTypes.find((t) => t.value === v)?.label ?? ''; }
  applicabilityLabel(v?: number | null): string { return this.bonusApplicabilityOptions.find((t) => t.value === v)?.label ?? ''; }
  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string {
    return (v === 3 || v === 4) ? 'list-item-tag--primary' : v === 5 ? 'list-item-tag--warning' : '';
  }
}

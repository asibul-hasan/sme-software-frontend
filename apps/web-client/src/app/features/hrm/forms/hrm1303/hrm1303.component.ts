import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { Hrm1303ModelService } from './services/model.service';
import { Hrm1303DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1303',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Hrm1303ModelService, Hrm1303DataService],
  templateUrl: './hrm1303.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Hrm1303Component implements OnInit {
  public model             = inject(Hrm1303ModelService);
  public permissionService = inject(FormPermissionService);

  readonly columns: ColumnDef[] = [
    { title: 'Employee',    field: 'employee_name',   sort: true, cellType: 'text', pin: 'left' },
    { title: 'Leave Type',  field: 'leave_type_name', sort: true, cellType: 'text' },
    { title: 'Year',        field: 'leave_year',      sort: true, cellType: 'text', align: 'center', width: '90px' },
    // Ledger order per the business document: Opening → Availed → Encashment →
    // Carry Forward → Closing, plus lapse tracking.
    { title: 'Opening',     field: 'opening_balance', cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Entitled',    field: 'entitled_days',   cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Accrued',     field: 'accrued_days',    cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Carried Fwd', field: 'carried_forward', cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Consumed',    field: 'consumed_days',   cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Pending',     field: 'pending_days',    cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Encashed',    field: 'encashed_days',   cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Lapsed',      field: 'lapsed_days',     cellType: 'decimal', align: 'right', precision: 1 },
    { title: 'Available',   field: 'available_days',  cellType: 'decimal', align: 'right', precision: 1, bottomTotal: true, pin: 'right' },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 20, dense: true, striped: true,
    showActions: false, showColumnToggle: true, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1303');
      this.model.loadLookups();
      this.model.loadBalances();
    });
  }

  onYearChange(y: number): void { this.model.year.set(Number(y)); this.model.loadBalances(); }
}

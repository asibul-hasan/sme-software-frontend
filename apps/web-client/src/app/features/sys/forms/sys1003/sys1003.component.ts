import { Component, ChangeDetectionStrategy, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1003ModelService, FinancialYear, isClosedToLabel } from './services/model.service';
import { Sys1003DataService } from './services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { ColumnDef, TableConfig } from '../../../../shared/components/common-table';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1003',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Sys1003ModelService, Sys1003DataService, DatePipe],
  templateUrl: './sys1003.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .periods-table-container {
        max-height: 400px;
        overflow-y: auto;
      }
    `,
  ],
})
export class Sys1003Component implements OnInit {
  public model             = inject(Sys1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS   = sysConstants;

  // ─── Status options for period dropdown (numeric values matching backend) ───
  readonly periodStatusOptions = sysConstants.periodStatuses;

  periodsSignal = signal<Record<string, unknown>[]>([]);

  // Common Table configuration for Accounting Periods list
  // Field names MUST match the FormArray control names from model.service.ts
  periodsTableColumns: ColumnDef[] = [
    {
      title: 'Period Code',
      field: 'fin_period_id',
      width: '140px',
      sort: true,
      pin: 'left',
      cellType: 'text',
    },
    {
      title: 'Period Name',
      field: 'fin_period_name',
      sort: true,
      cellType: 'text',
      editable: true,
    },
    {
      title: 'Start Date',
      field: 'start_date',
      width: '130px',
      sort: true,
      cellType: 'date',
      dateFormat: 'dd/MM/yyyy',
      editable: true,
    },
    {
      title: 'End Date',
      field: 'end_date',
      width: '130px',
      sort: true,
      cellType: 'date',
      dateFormat: 'dd/MM/yyyy',
      editable: true,
    },
    {
      title: 'Status',
      field: 'period_status',
      width: '120px',
      sort: true,
      cellType: 'select',
      options: [
        { label: 'Open', value: 1 },
        { label: 'Closed', value: 2 },
        { label: 'Locked', value: 3 },
      ],
      editable: true,
    },
  ];

  periodsTableConfig: Partial<TableConfig> = {
    title: 'Accounting Periods',
    showTitle: false,
    showSearch: true,
    searchPlaceholder: 'Search periods...',
    pagination: true,
    defaultPageSize: 12,
    pageSizeOptions: [12, 25, 50],
    showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'],
    showColumnToggle: true,
    showActions: false,
    selectable: false,
    dense: true,
    compact: true,
    striped: true,
    hoverEffect: true,
    maxHeight: '400px',
  };

  periodsTableData = computed(() => this.periodsSignal());

  ngOnInit(): void {
    this.model.initForm();

    // Bind periodsSignal to periodsFormArray's valueChanges reactively
    this.periodsSignal.set(this.periodsFormArray.value || []);
    this.periodsFormArray.valueChanges.subscribe((val) => {
      this.periodsSignal.set(val || []);
    });

    setTimeout(() => {
      this.permissionService.useLocalPermissions('SYS_1003');
      this.model.loadBranches();
      this.model.loadFinancialYears();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  /** Expose Form and FormArray accessor to template */
  get formdata() {
    return this.model.form;
  }

  get periodsFormArray() {
    return this.model.periodsFormArray;
  }

  onSave(): void        { this.model.onSave(); }
  onNew(): void         { this.model.onNew(); }
  autoGeneratePeriods() { this.model.autoGeneratePeriods(); }
  addPeriodRow()        { this.model.addPeriodRow(); }

  onReset(): void {
    if (this.model.selectedYearNo()) {
      const original = this.model
        .financialYears()
        .find((y) => y.fin_year_no === this.model.selectedYearNo());
      if (original) this.model.selectYear(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedYearNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  onCloseFY(): void {
    if (!this.model.selectedYearNo()) return;
    this.alertService
      .confirm(
        'WARNING: Closing the Financial Year will lock all transactions. Proceed?',
        'Close Fiscal Year',
        'warn',
      )
      .subscribe((confirmed) => {
        if (confirmed) this.model.closeFiscalYear();
      });
  }

  selectYear(year: FinancialYear): void {
    this.model.selectYear(year);
  }

  onSelectYear(yearNo: number | null): void {
    if (yearNo) {
      const year = this.model.financialYears().find((y) => y.fin_year_no === yearNo);
      if (year) {
        this.model.selectYear(year);
      }
    }
  }

  onRowClick(row: Record<string, unknown>): void {
    const year = row as unknown as FinancialYear;
    this.model.selectYear(year);
  }

  onCellEdit(event: { value: unknown; row: Record<string, unknown>; column: ColumnDef }): void {
    const field = event.column.field;
    const value = event.value;

    // Find the matching form array control by fin_period_id
    const periodId = event.row['fin_period_id'];
    const controls = this.periodsFormArray.controls;
    const idx = controls.findIndex((ctrl) => ctrl.get('fin_period_id')?.value === periodId);

    if (idx !== -1) {
      controls[idx].get(field)?.setValue(value);
      controls[idx].get(field)?.markAsDirty();
      this.formdata.markAsDirty();
    }
  }
}

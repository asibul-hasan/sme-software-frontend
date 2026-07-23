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
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1006ModelService, Holiday } from './services/model.service';
import { Hrm1006DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ColumnDef, TableConfig, statusBadge } from '@app/shared/components/common-table';
import { hrmConstants } from '../../constants/hrm.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1006',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Hrm1006ModelService, Hrm1006DataService],
  templateUrl: './hrm1006.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .selected-day {
        border: 2px solid var(--bs-primary, #0d6efd) !important;
        background-color: rgba(13, 110, 253, 0.1);
      }
    `,
  ],
})
export class Hrm1006Component implements OnInit {
  public model = inject(Hrm1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly holidayTypes = hrmConstants.holidayTypes;
  readonly alternateOptions = [
    { value: null, label: '— None —' },
    { value: 1, label: 'Holiday' },
    { value: 2, label: 'Working Day' }
  ];

  tableConfig: Partial<TableConfig> = {
    showSearch: true,
    pagination: true,
    defaultPageSize: 10,
    dense: true,
    striped: true,
    maxHeight: '100%',
    actions: [
      { type: 'delete', icon: 'delete', tooltip: 'Delete', variant: 'ghost', onClick: (row) => this.deleteRow(row['holiday_no'] as number) }
    ]
  };

  tableColumns: ColumnDef[] = [
    { title: 'Date', field: 'holiday_date', cellType: 'datepipe', dateFormat: 'dd MMM yyyy' },
    { title: 'Holiday Name', field: 'holiday_name', cellType: 'text' },
    { title: 'Type', field: 'holiday_type', cellType: 'select', options: this.holidayTypes, editable: true, onChange: (val, row) => this.handleInlineEdit(val, row, 'holiday_type') },
    { title: 'Alternate', field: 'alternate_type', cellType: 'select', options: this.alternateOptions, editable: true, onChange: (val, row) => this.handleInlineEdit(val, row, 'alternate_type') },
    { title: 'Repeat', field: 'is_recurring', cellType: 'checkbox', editable: true, onChange: (val, row) => this.handleInlineEdit(val, row, 'is_recurring') },
    { title: 'Status', field: 'is_active', cellType: 'badge', badgeConfig: statusBadge },
    { title: 'Remarks', field: 'remarks', cellType: 'text' }
  ];

  tableData = computed(() => this.model.filtered() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1006');
      this.model.loadHolidays();
    });
  }

  get yearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() {
    return this.model.form;
  }

  onSave(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }

  onAddRow(): void {
    this.model.onNew();
  }

  deleteRow(holidayNo: number): void {
    this.model.selectedNo.set(holidayNo);
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  handleInlineEdit(val: unknown, row: Record<string, unknown>, field: string): void {
    const updatedRow = { ...row, [field]: val };
    this.model.onInlineEdit(updatedRow);
  }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model
        .holidays()
        .find((h) => h.holiday_no === this.model.selectedNo());
      if (original) this.model.selectHoliday(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectHoliday(item: Holiday, index?: number): void {
    this.model.selectHoliday(item, index);
  }

  typeLabel(value: number): string {
    return (
      this.holidayTypes.find((t) => t.value === value)?.label ?? String(value)
    );
  }

  typeTagClass(value: number): string {
    switch (value) {
      case 1:
        return 'list-item-tag--danger';
      case 2:
        return 'list-item-tag--info';
      case 3:
        return 'list-item-tag--primary';
      case 4:
        return 'list-item-tag--warning';
      default:
        return '';
    }
  }

  typeTextClass(value: number): string {
    switch (value) {
      case 1:
        return 'text-danger';
      case 2:
        return 'text-info';
      case 3:
        return 'text-primary';
      case 4:
        return 'text-warning';
      default:
        return '';
    }
  }

  typeDotClass(value: number): string {
    switch (value) {
      case 1:
        return 'bg-danger';
      case 2:
        return 'bg-info';
      case 3:
        return 'bg-primary';
      case 4:
        return 'bg-warning';
      default:
        return '';
    }
  }

  onCalendarDayClick(day: any): void {
    if (!day.dateStr) return;
    this.formdata.patchValue({
      holiday_date: day.dateStr,
      leave_year: day.year,
    });
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }

  formatDateShort(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  prevMonth(): void {
    this.model.prevMonth();
  }
  nextMonth(): void {
    this.model.nextMonth();
  }
}

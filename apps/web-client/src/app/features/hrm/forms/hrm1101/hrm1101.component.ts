import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1101ModelService, Attendance } from './services/model.service';
import { Hrm1101DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1101',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1101ModelService, Hrm1101DataService],
  templateUrl: './hrm1101.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1101Component implements OnInit {
  public model             = inject(Hrm1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly statusOptions = hrmConstants.attendanceStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1101');
      this.model.loadEmployees();
      this.model.loadAttendances();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }

  get isLocked(): boolean {
    return this.formdata.get('is_locked')?.value === 1;
  }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.attendances().find((a) => a.attendance_no === this.model.selectedNo());
      if (original) this.model.selectAttendance(original);
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

  selectAttendance(item: Attendance): void {
    this.model.selectAttendance(item);
  }

  statusLabel(value: number): string {
    return this.statusOptions.find((s) => s.value === value)?.label ?? String(value);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

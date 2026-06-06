import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1005ModelService, LeaveType } from './services/model.service';
import { Hrm1005DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1005',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1005ModelService, Hrm1005DataService],
  templateUrl: './hrm1005.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1005Component implements OnInit {
  public model             = inject(Hrm1005ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly accrualMethods = hrmConstants.leaveAccrualMethods;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1005');
      this.model.loadLeaveTypes();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.leaveTypes().find((t) => t.leave_type_no === this.model.selectedNo());
      if (original) this.model.selectLeaveType(original);
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

  selectLeaveType(item: LeaveType, index?: number): void {
    this.model.selectLeaveType(item, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  accrualLabel(value: number): string {
    return this.accrualMethods.find((m) => m.value === value)?.label ?? String(value);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

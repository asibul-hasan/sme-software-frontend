import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { Hrm1103ModelService, Adjustment } from './services/model.service';
import { Hrm1103DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1103',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Hrm1103ModelService, Hrm1103DataService],
  templateUrl: './hrm1103.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1103Component implements OnInit {
  public model             = inject(Hrm1103ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly attStatusOptions = hrmConstants.attendanceStatuses;
  readonly statusOptions = hrmConstants.adjustmentStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1103');
      this.model.loadEmployees();
      this.model.loadAdjustments();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get pending(): boolean { return this.model.isPending(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.adjustments().find((a) => a.adjustment_no === this.model.selectedNo());
      if (original) this.model.selectAdjustment(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectAdjustment(item: Adjustment): void { this.model.selectAdjustment(item); }

  approve(): void {
    this.alertService.confirm('Approve this adjustment? The attendance row will be updated even if locked.', 'Approve Adjustment', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('approve'); });
  }
  reject(): void { this.model.doAction('reject'); }

  attStatusLabel(v: number): string { return this.attStatusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string { return v === 2 ? 'list-item-tag--primary' : v === 3 ? 'list-item-tag--warning' : ''; }
}

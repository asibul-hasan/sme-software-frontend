import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1401ModelService, JobRequisition } from './services/model.service';
import { Hrm1401DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1401',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1401ModelService, Hrm1401DataService],
  templateUrl: './hrm1401.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1401Component implements OnInit {
  public model             = inject(Hrm1401ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly employmentTypes = hrmConstants.requisitionEmploymentTypes;
  readonly statusOptions = hrmConstants.requisitionStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1401');
      this.model.loadLookups();
      this.model.loadRequisitions();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isDraft(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedNo()) {
      const original = this.model.requisitions().find((r) => r.requisition_no === this.model.selectedNo());
      if (original) this.model.selectRequisition(original);
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

  selectRequisition(item: JobRequisition): void { this.model.selectRequisition(item); }
  onDeptChange(no: number | null): void { this.model.onDeptChange(no); }

  submit(): void  { this.model.doAction('submit'); }
  approve(): void { this.model.doAction('approve'); }
  reject(): void  { this.model.doAction('reject'); }
  hold(): void    { this.model.doAction('hold'); }
  resume(): void  { this.model.doAction('resume'); }
  close(): void {
    this.alertService.confirm('Close this requisition as filled?', 'Close Requisition', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('close'); });
  }
  cancel(): void {
    this.alertService.confirm('Cancel this requisition?', 'Cancel Requisition', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('cancel'); });
  }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  empLabel(v?: number | null): string { return this.employmentTypes.find((t) => t.value === v)?.label ?? ''; }
  statusClass(v: number): string {
    return v === 3 ? 'list-item-tag--primary' : (v === 5 || v === 6) ? 'list-item-tag--warning' : '';
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1207ModelService, Settlement } from './services/model.service';
import { Hrm1207DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1207',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1207ModelService, Hrm1207DataService],
  templateUrl: './hrm1207.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1207Component implements OnInit {
  public model             = inject(Hrm1207ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly separationTypes = hrmConstants.separationTypes;
  readonly statusOptions = hrmConstants.settlementStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1207');
      this.model.loadEmployees();
      this.model.loadSettlements();
    });
  }

  onSearchTermChange(val: string): void { this.model.searchTerm.set(val); this.model.pager.reset(); }
  get formdata() { return this.model.form; }
  get status(): number { return this.model.status(); }
  get editable(): boolean { return this.model.isDraft(); }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void {
    if (this.model.selectedNo()) {
      const o = this.model.settlements().find((s) => s.settlement_no === this.model.selectedNo());
      if (o) this.model.selectSettlement(o);
    } else { this.model.onNew(); }
  }
  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  selectSettlement(item: Settlement): void { this.model.selectSettlement(item); }

  submit(): void { this.model.doAction('submit'); }
  approve(): void { this.model.doAction('approve'); }
  reject(): void { this.model.doAction('reject'); }
  pay(): void {
    this.alertService.confirm('Mark this settlement paid? The employee will be deactivated.', 'Pay Settlement', 'warn')
      .subscribe((ok) => { if (ok) this.model.doAction('pay'); });
  }
  cancel(): void { this.model.doAction('cancel'); }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string { return (v === 2 || v === 3) ? 'list-item-tag--primary' : v === 4 ? 'list-item-tag--warning' : ''; }
}

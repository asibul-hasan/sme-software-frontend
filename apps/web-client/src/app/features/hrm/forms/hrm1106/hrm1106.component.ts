import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1106ModelService, Movement } from './services/model.service';
import { Hrm1106DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1106',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1106ModelService, Hrm1106DataService],
  templateUrl: './hrm1106.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1106Component implements OnInit {
  public model             = inject(Hrm1106ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly movementTypes = hrmConstants.movementTypes;
  readonly statusOptions = hrmConstants.movementStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1106');
      this.model.loadLookups();
      this.model.loadMovements();
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
      const o = this.model.movements().find((m) => m.movement_no === this.model.selectedNo());
      if (o) this.model.selectMovement(o);
    } else { this.model.onNew(); }
  }
  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  selectMovement(item: Movement): void { this.model.selectMovement(item); }

  submit(): void { this.model.doAction('submit'); }
  approve(): void {
    this.alertService.confirm('Approve this movement? The employee record will be updated.', 'Approve', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('approve'); });
  }
  reject(): void { this.model.doAction('reject'); }
  cancel(): void { this.model.doAction('cancel'); }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  typeLabel(v?: number | null): string { return this.movementTypes.find((t) => t.value === v)?.label ?? ''; }
  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string { return v === 3 ? 'list-item-tag--primary' : v === 4 ? 'list-item-tag--warning' : ''; }
}

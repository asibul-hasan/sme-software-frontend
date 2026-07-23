import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { Hrm1206ModelService, Loan } from './services/model.service';
import { Hrm1206DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1206',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Hrm1206ModelService, Hrm1206DataService],
  templateUrl: './hrm1206.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1206Component implements OnInit {
  public model             = inject(Hrm1206ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  recoveryAmount = 0;

  readonly loanTypes = hrmConstants.loanTypes;
  readonly statusOptions = hrmConstants.loanStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1206');
      this.model.loadEmployees();
      this.model.loadLoans();
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
      const o = this.model.loans().find((s) => s.loan_no === this.model.selectedNo());
      if (o) this.model.selectLoan(o);
    } else { this.model.onNew(); }
  }
  onDelete(): void {
    if (!this.model.selectedNo() || this.status !== 1) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  selectLoan(item: Loan): void { this.model.selectLoan(item); }

  submit(): void { this.model.doAction('submit'); }
  approve(): void { this.model.doAction('approve'); }
  reject(): void { this.model.doAction('reject'); }
  disburse(): void {
    this.alertService.confirm('Disburse this loan? It becomes ready for monthly recovery.', 'Disburse Loan', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('disburse'); });
  }
  cancel(): void { this.model.doAction('cancel'); }
  recover(): void { this.model.recover(Number(this.recoveryAmount)); this.recoveryAmount = 0; }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string {
    return (v === 2 || v === 3) ? 'list-item-tag--primary' : v === 4 ? '' : v === 5 ? 'list-item-tag--warning' : '';
  }
}

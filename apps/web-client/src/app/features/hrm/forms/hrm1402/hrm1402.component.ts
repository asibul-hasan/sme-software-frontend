import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1402ModelService, Candidate } from './services/model.service';
import { Hrm1402DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1402',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1402ModelService, Hrm1402DataService],
  templateUrl: './hrm1402.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1402Component implements OnInit {
  public model             = inject(Hrm1402ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly sources = hrmConstants.candidateSources;
  readonly statuses = hrmConstants.candidateStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1402');
      this.model.loadRequisitions();
      this.model.loadCandidates();
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
      const original = this.model.candidates().find((c) => c.candidate_no === this.model.selectedNo());
      if (original) this.model.selectCandidate(original);
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

  selectCandidate(item: Candidate): void { this.model.selectCandidate(item); }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  statusLabel(v: number): string { return this.statuses.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string {
    return v === 6 ? 'list-item-tag--primary' : (v === 7 || v === 8) ? 'list-item-tag--warning' : '';
  }
}

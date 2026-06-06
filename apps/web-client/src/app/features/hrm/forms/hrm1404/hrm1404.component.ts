import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1404ModelService, Offer } from './services/model.service';
import { Hrm1404DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1404',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1404ModelService, Hrm1404DataService],
  templateUrl: './hrm1404.component.html',
  styles: [`:host { display: block; height: 100%; }
    .offer-letter { white-space: pre-wrap; font-family: Georgia, 'Times New Roman', serif; font-size: 13.5px; line-height: 1.6; }`],
})
export class Hrm1404Component implements OnInit {
  public model             = inject(Hrm1404ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly statusOptions = hrmConstants.offerStatuses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1404');
      this.model.loadLookups();
      this.model.loadOffers();
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
      const original = this.model.offers().find((o) => o.offer_no === this.model.selectedNo());
      if (original) this.model.selectOffer(original);
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

  selectOffer(item: Offer): void { this.model.selectOffer(item); }

  send(): void { this.model.doAction('send'); }
  accept(): void {
    this.alertService.confirm('Mark this offer accepted? The candidate will be hired and ready for onboarding.', 'Accept Offer', 'primary')
      .subscribe((ok) => { if (ok) this.model.doAction('accept'); });
  }
  decline(): void { this.model.doAction('decline'); }
  revoke(): void { this.model.doAction('revoke'); }
  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  generateLetter(): void { this.model.generateLetter(); }
  printLetter(): void { window.print(); }

  statusLabel(v: number): string { return this.statusOptions.find((s) => s.value === v)?.label ?? String(v); }
  statusClass(v: number): string {
    return v === 3 ? 'list-item-tag--primary' : (v === 4 || v === 6 || v === 5) ? 'list-item-tag--warning' : '';
  }
}

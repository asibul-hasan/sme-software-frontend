import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { Pur1001ModelService, Supplier } from './services/model.service';
import { Pur1001DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { purConstants } from '../../constants/pur.constants';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pur1001',
  standalone: true,
  imports: [DecimalInputDirective, CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Pur1001ModelService, Pur1001DataService],
  templateUrl: './pur1001.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Pur1001Component implements OnInit {
  public model             = inject(Pur1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly supplierTypes = purConstants.supplierTypes;
  readonly paymentTerms  = purConstants.paymentTerms;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => { this.permissionService.useLocalPermissions('PUR_1001'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }
  get formdata() { return this.model.form; }

  typeLabel(v: number): string { return this.supplierTypes.find((t) => t.value === v)?.label ?? ''; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void { const o = this.model.suppliers().find((s) => s.supplier_no === this.model.selectedNo()); if (o) this.model.select(o); else this.model.onNew(); }
  onDelete(): void { if (!this.model.selectedNo()) return; this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); }); }
  select(item: Supplier): void { this.model.select(item); }
}

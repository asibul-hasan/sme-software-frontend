import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

import { Sal1101ModelService, Customer } from './services/model.service';
import { Sal1101DataService } from './services/data.service';

import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { salConstants } from '../../constants/sal.constants';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sal1101',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Sal1101ModelService, Sal1101DataService],
  templateUrl: './sal1101.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sal1101Component implements OnInit {
  public model             = inject(Sal1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly customerTypes = salConstants.customerTypes;
  readonly priceTiers    = salConstants.priceTiers;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => { this.permissionService.useLocalPermissions('SAL_1101'); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }
  get formdata() { return this.model.form; }

  typeLabel(v: number): string { return this.customerTypes.find((t) => t.value === v)?.label ?? ''; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void { const o = this.model.customers().find((c) => c.customer_no === this.model.selectedNo()); if (o) this.model.select(o); else this.model.onNew(); }
  onDelete(): void { if (!this.model.selectedNo()) return; this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); }); }
  select(item: Customer): void { this.model.select(item); }
}

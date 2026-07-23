import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';

import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { AlertService } from '../../../../core/services/alert.service';
import { activeStatusOptions } from '../../../../core/constants/common-options.constants';

import { Sys1006ModelService } from './services/model.service';
import { Sys1006DataService } from './services/data.service';

import { AppDatePickerComponent } from '../../../../shared/components/date-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1006',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent, AppDatePickerComponent],
  providers: [Sys1006ModelService, Sys1006DataService],
  templateUrl: './sys1006.component.html',
  styles: [],
})
export class Sys1006Component implements OnInit {
  public model = inject(Sys1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  readonly activeStatusOptions = activeStatusOptions;

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1006');
    this.model.loadCurrencies();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.exchange_rate_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this exchange rate?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

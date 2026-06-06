import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1006ModelService, Holiday } from './services/model.service';
import { Hrm1006DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1006',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1006ModelService, Hrm1006DataService],
  templateUrl: './hrm1006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1006Component implements OnInit {
  public model             = inject(Hrm1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly holidayTypes = hrmConstants.holidayTypes;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1006');
      this.model.loadHolidays();
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
      const original = this.model.holidays().find((h) => h.holiday_no === this.model.selectedNo());
      if (original) this.model.selectHoliday(original);
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

  selectHoliday(item: Holiday, index?: number): void {
    this.model.selectHoliday(item, index);
  }

  typeLabel(value: number): string {
    return this.holidayTypes.find((t) => t.value === value)?.label ?? String(value);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

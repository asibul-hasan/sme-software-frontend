import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1007ModelService, SalaryComponent } from './services/model.service';
import { Hrm1007DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1007',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1007ModelService, Hrm1007DataService],
  templateUrl: './hrm1007.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1007Component implements OnInit {
  public model             = inject(Hrm1007ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly componentTypes = hrmConstants.salaryComponentTypes;

  readonly calcTypes = hrmConstants.salaryCalcTypes;

  readonly roundingModes = hrmConstants.roundingModes;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1007');
      this.model.loadComponents();
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
      const original = this.model.components().find((c) => c.component_no === this.model.selectedNo());
      if (original) this.model.selectComponent(original);
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

  selectComponent(item: SalaryComponent, index?: number): void {
    this.model.selectComponent(item, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  typeLabel(value: number): string {
    return this.componentTypes.find((t) => t.value === value)?.label ?? String(value);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

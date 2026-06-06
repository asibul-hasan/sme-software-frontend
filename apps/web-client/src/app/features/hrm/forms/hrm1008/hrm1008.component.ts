import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1008ModelService } from './services/model.service';
import { Hrm1008DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';

import { hrmConstants } from '../../constants/hrm.constants';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1008',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Hrm1008ModelService, Hrm1008DataService],
  templateUrl: './hrm1008.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Hrm1008Component implements OnInit {
  public model             = inject(Hrm1008ModelService);
  public permissionService = inject(FormPermissionService);

  readonly countries = hrmConstants.countryPacks;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1008');
      this.model.loadSettings();
    });
  }

  get formdata() { return this.model.form; }

  onSave(): void  { this.model.onSave(); }
  onReset(): void { this.model.loadSettings(); }

  onCountryChange(country: string): void {
    this.model.applyPack(country);
  }

  toggleFlag(control: string, event: MatCheckboxChange): void {
    this.formdata.get(control)?.setValue(event.checked ? 1 : 0);
  }
}

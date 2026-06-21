import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { AlertService } from '../../../../core/services/alert.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { SharedModule } from '../../../../shared/shared.module';
import { hrmConstants } from '../../constants/hrm.constants';
import { Hrm1009DataService } from './services/data.service';
import { Hrm1009ModelService, TaxSlabProfile } from './services/model.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1009',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Hrm1009ModelService, Hrm1009DataService],
  templateUrl: './hrm1009.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class Hrm1009Component implements OnInit {
  public model = inject(Hrm1009ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly countries = hrmConstants.countryPacks;
  readonly taxpayerClasses = hrmConstants.taxpayerClasses;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1009');
      this.model.loadProfiles();
    });
  }

  onSearchTermChange(value: string): void {
    this.model.searchTerm.set(value);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedTaxSlabNo()) {
      const original = this.model.profiles().find((item) => item.tax_slab_no === this.model.selectedTaxSlabNo());
      if (original) this.model.selectProfile(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedTaxSlabNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectProfile(profile: TaxSlabProfile, index?: number): void {
    this.model.selectProfile(profile, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(String(ctrl.value).toUpperCase(), { emitEvent: false });
  }

  toggleActive(event: MatCheckboxChange): void {
    this.formdata.get('is_active')?.setValue(event.checked ? 1 : 0);
  }
}

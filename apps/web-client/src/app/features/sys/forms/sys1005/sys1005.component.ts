import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysTaxTypeOptions } from '../../../../core/constants/common-options.constants';
import { Sys1005ModelService, TaxRule } from './services/model.service';
import { Sys1005DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1005',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Sys1005ModelService, Sys1005DataService, DatePipe],
  templateUrl: './sys1005.component.html',
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class Sys1005Component implements OnInit {
  public model             = inject(Sys1005ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly taxTypeOptions = sysTaxTypeOptions;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('SYS_1005');
      this.model.loadBranches();
      this.model.loadTaxRules();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  get formdata() { return this.model.form; }

  onSave(): void  { this.model.onSave(); }
  onNew(): void   { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedTaxNo()) {
      const original = this.model.taxRules().find(
        (t) => t.vat_tax_no === this.model.selectedTaxNo(),
      );
      if (original) this.model.selectTax(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedTaxNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectTax(tax: TaxRule, index?: number): void {
    this.model.selectTax(tax, index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  toggleActive(event: MatCheckboxChange): void {
    this.formdata.get('is_active')?.setValue(event.checked ? 1 : 0);
  }

  getTaxTypeLabel(value: number): string {
    const found = sysTaxTypeOptions.find((t) => t.value === value);
    return found ? found.label : String(value);
  }
}

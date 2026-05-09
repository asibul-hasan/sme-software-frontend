import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1005ModelService, TaxRule } from './services/model.service';
import { Sys1005DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
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
    .composite-container {
      border: 1px dashed #dee2e6;
      border-radius: 8px;
      padding: 1rem;
      background: #f8f9fa;
    }
    .drag-handle { cursor: move; color: #adb5bd; }
    .cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      background: white;
      display: flex;
      align-items: center;
      padding: 10px;
      border-radius: 4px;
    }
    .cdk-drag-placeholder { opacity: 0.3; }
  `],
})
export class Sys1005Component implements OnInit {
  public model             = inject(Sys1005ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS   = sysConstants;

  ngOnInit(): void {
    this.model.initForm();
    // Move side-effects to next tick to avoid NG0100
    setTimeout(() => {
      this.permissionService.useLocalPermissions('SYS_1005');
      this.model.loadBranches();
      this.model.loadTaxRules();
    });
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  /** Expose form and FormArray to template */
  get formdata()             { return this.model.form; }
  get componentsFormArray()  { return this.model.componentsFormArray; }

  onSave(): void  { this.model.onSave(); }
  onNew(): void   { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedTaxNo()) {
      const original = this.model.taxRules().find(
        (t) => t.tax_no === this.model.selectedTaxNo(),
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

  addComponentRow(comp?: Partial<TaxRule>): void {
    this.model.addComponentRow(comp);
  }

  removeComponent(index: number): void {
    this.model.removeComponent(index);
  }

  dropComponent(event: CdkDragDrop<FormGroup[]>): void {
    this.model.dropComponent(event);
  }

  onChildTaxSelect(tax: TaxRule): void {
    this.model.onChildTaxSelect(tax);
  }

  updateCompositeRate(): void {
    this.model.updateCompositeRate();
  }
}

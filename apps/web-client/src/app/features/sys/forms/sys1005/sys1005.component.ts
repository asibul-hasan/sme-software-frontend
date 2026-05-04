import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1005ModelService, TaxRule, TaxComponent } from './services/model.service';
import { SysDataService } from '../../services/data.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { ToastrService } from 'ngx-toastr';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { finalize } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sys1005',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [DatePipe, Sys1005ModelService],
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
  `]
})
export class Sys1005Component implements OnInit {
  public model = inject(Sys1005ModelService);
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);
  private datePipe = inject(DatePipe);
  public permissionService = inject(FormPermissionService);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS = sysConstants;

  onSearchTermChange(val: string) {
    this.model.searchTerm.set(val);
  }

  formdata: FormGroup = this.fb.group({
    tax_no: [null],
    tax_code: ['', [Validators.required, Validators.maxLength(20)]],
    tax_name: ['', [Validators.required]],
    tax_type: ['VAT', [Validators.required]],
    tax_rate: [0, [Validators.required, Validators.min(0)]],
    is_compound: [false],
    applies_to_sales: [true],
    applies_to_purchase: [false],
    is_inclusive: [false],
    is_default: [false],
    tax_authority: [''],
    reporting_code: [''],
    effective_from: [new Date().toISOString().split('T')[0], [Validators.required]],
    effective_to: [null],
    status: ['Active', [Validators.required]],
    branch_nos: [[], [Validators.required]],
    components: this.fb.array([])
  });

  get componentsFormArray() {
    return this.formdata.get('components') as FormArray;
  }

  ngOnInit(): void {
    this.permissionService.loadPermissions('SYS_1005').subscribe();
    this.loadBranches();
    this.loadTaxRules();
  }

  loadBranches() {
    this.sysService.getList<any>('branch/list').subscribe(res => {
      if (res.success) this.model.branches.set(res.data);
    });
  }

  loadTaxRules(reselectIndex?: number) {
    this.model.isLoading.set(true);
    this.sysService.getList<any>('tax/list')
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.model.taxRules.set(res.data);
            this.model.allTaxes.set(res.data); // Store for composite selection
            if (res.data.length > 0) {
              const index = (reselectIndex !== undefined && reselectIndex < res.data.length) ? reselectIndex : 0;
              this.selectTax(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.toastr.error('Failed to load tax rules');
          console.error(err);
        }
      });
  }

  selectTax(tax: any, index?: number) {
    if (index !== undefined) this.model.lastSelectedIndex = index;
    this.model.selectedTaxNo.set(tax.tax_no);
    
    this.model.isLoading.set(true);
    this.sysService.getDetails<any>('tax/detail', { tax_no: tax.tax_no })
      .pipe(finalize(() => this.model.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.componentsFormArray.clear();
            
            this.formdata.patchValue({
              tax_no: res.data.taxNo,
              tax_code: res.data.taxCode,
              tax_name: res.data.taxName,
              tax_type: res.data.taxType,
              tax_rate: res.data.taxRate,
              is_compound: res.data.isCompound === 1 || res.data.isCompound === true,
              applies_to_sales: res.data.appliesToSales === 1 || res.data.appliesToSales === true,
              applies_to_purchase: res.data.appliesToPurchase === 1 || res.data.appliesToPurchase === true,
              is_inclusive: res.data.isInclusive === 1 || res.data.isInclusive === true,
              is_default: res.data.isDefault === 1 || res.data.isDefault === true,
              tax_authority: res.data.taxAuthority,
              reporting_code: res.data.reportingCode,
              effective_from: this.datePipe.transform(res.data.effectiveFrom, 'yyyy-MM-dd'),
              effective_to: this.datePipe.transform(res.data.effectiveTo, 'yyyy-MM-dd'),
              status: res.data.status,
              branch_nos: res.data.branchNos || []
            });

            if (res.data.components) {
              res.data.components.forEach((c: any) => this.addComponentRow(c));
            }
          }
        },
        error: (err) => {
          this.toastr.error('Failed to load details');
          console.error(err);
        }
      });
  }

  addComponentRow(comp?: any) {
    const group = this.fb.group({
      child_tax_no: [comp?.childTaxNo || comp?.tax_no || null, Validators.required],
      child_tax_code: [{ value: comp?.childTaxCode || comp?.tax_code || '', disabled: true }],
      child_tax_name: [{ value: comp?.childTaxName || comp?.tax_name || '', disabled: true }],
      tax_rate: [{ value: comp?.taxRate || comp?.tax_rate || 0, disabled: true }],
      sequence: [comp?.sequence || this.componentsFormArray.length + 1]
    });
    this.componentsFormArray.push(group);
    this.updateCompositeRate();
  }

  removeComponent(index: number) {
    this.componentsFormArray.removeAt(index);
    this.updateSequences();
    this.updateCompositeRate();
  }

  dropComponent(event: CdkDragDrop<any[]>) {
    const arr = this.componentsFormArray.controls;
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.updateSequences();
  }

  updateSequences() {
    this.componentsFormArray.controls.forEach((control, index) => {
      control.get('sequence')?.setValue(index + 1);
    });
  }

  updateCompositeRate() {
    if (this.formdata.get('tax_type')?.value === 'COMPOSITE') {
      const total = this.componentsFormArray.controls.reduce((sum, ctrl) => sum + (ctrl.get('tax_rate')?.value || 0), 0);
      this.formdata.get('tax_rate')?.setValue(total, { emitEvent: false });
    }
  }

  onChildTaxSelect(tax: any) {
    // Check if already added
    const exists = this.componentsFormArray.value.some((c: any) => c.child_tax_no === tax.tax_no);
    if (exists) {
      this.toastr.warning('This tax is already added as a component.');
      return;
    }
    this.addComponentRow(tax);
  }

  onNew() {
    this.model.selectedTaxNo.set(null);
    this.componentsFormArray.clear();
    this.formdata.reset({
      tax_type: 'VAT',
      tax_rate: 0,
      is_compound: false,
      applies_to_sales: true,
      applies_to_purchase: false,
      is_inclusive: false,
      is_default: false,
      status: 'Active',
      effective_from: new Date().toISOString().split('T')[0],
      branch_nos: []
    });
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }

    this.model.isSaving.set(true);
    const val = this.formdata.getRawValue();

    const payload = {
      ...val,
      is_compound: val.is_compound ? 1 : 0,
      applies_to_sales: val.applies_to_sales ? 1 : 0,
      applies_to_purchase: val.applies_to_purchase ? 1 : 0,
      is_inclusive: val.is_inclusive ? 1 : 0,
      is_default: val.is_default ? 1 : 0,
      components: val.tax_type === 'COMPOSITE' ? val.components : []
    };

    const isUpdate = !!this.model.selectedTaxNo();
    const obs = isUpdate 
      ? this.sysService.update<any>('tax/update', payload)
      : this.sysService.create<any>('tax/create', payload);

    obs.pipe(finalize(() => this.model.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toastr.success(isUpdate ? 'Tax updated' : 'Tax created');
            this.loadTaxRules(isUpdate ? this.model.lastSelectedIndex : 0);
          } else {
            this.toastr.error(res.message || 'Save failed');
          }
        },
        error: (err) => {
          this.toastr.error('Server error during save');
          console.error(err);
        }
      });
  }

  onDelete() {
    if (!this.model.selectedTaxNo()) return;

    this.alertService.deleteConfirm().subscribe(confirmed => {
      if (confirmed) {
        this.model.isLoading.set(true);
        this.sysService.delete<any>('tax/delete', { tax_no: this.model.selectedTaxNo() })
          .pipe(finalize(() => this.model.isLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.toastr.success('Tax rule deleted');
                this.loadTaxRules();
              } else {
                this.toastr.error(res.message || 'Delete failed');
              }
            },
            error: (err) => {
              this.toastr.error('Server error during delete');
              console.error(err);
            }
          });
      }
    });
  }

  onReset() {
    if (this.model.selectedTaxNo()) {
      const original = this.model.taxRules().find(t => t.tax_no === this.model.selectedTaxNo());
      if (original) this.selectTax(original);
    } else {
      this.onNew();
    }
  }
}

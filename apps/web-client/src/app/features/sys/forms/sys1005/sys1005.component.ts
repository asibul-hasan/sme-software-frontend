import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { sysConstants } from '../../constants/sys.constants';
import { SysDataService } from '../../services/data.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { finalize } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

interface TaxComponent {
  child_tax_no: number;
  child_tax_code: string;
  child_tax_name: string;
  tax_rate: number;
  sequence: number;
}

interface TaxRule {
  tax_no: number;
  tax_code: string;
  tax_name: string;
  tax_type: string;
  tax_rate: number;
  is_compound: boolean;
  applies_to_sales: boolean;
  applies_to_purchase: boolean;
  is_inclusive: boolean;
  is_default: boolean;
  tax_authority: string;
  reporting_code: string;
  effective_from: string;
  effective_to?: string;
  status: string;
  branch_nos: number[];
  components: TaxComponent[];
}

@Component({
  selector: 'app-sys1005',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  providers: [DatePipe],
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
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private alertService = inject(AlertService);
  private datePipe = inject(DatePipe);
  public permissionService = inject(FormPermissionService);

  readonly SYS_CONSTS = sysConstants;

  // Data signals
  taxRules = signal<TaxRule[]>([]);
  branches = signal<any[]>([]);
  accounts = signal<any[]>([]); // GL Accounts
  allTaxes = signal<any[]>([]); // For composite child selection
  isLoading = signal(false);
  isSaving = signal(false);

  searchTerm = signal('');
  selectedTaxNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  filteredTaxRules = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.taxRules().filter(t =>
      t.tax_name.toLowerCase().includes(term) || 
      t.tax_code.toLowerCase().includes(term)
    );
  });

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
      if (res.success) this.branches.set(res.data);
    });
  }

  loadTaxRules(reselectIndex?: number) {
    this.isLoading.set(true);
    this.sysService.getList<any>('tax/list')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.taxRules.set(res.data);
            this.allTaxes.set(res.data); // Store for composite selection
            if (res.data.length > 0) {
              const index = (reselectIndex !== undefined && reselectIndex < res.data.length) ? reselectIndex : 0;
              this.selectTax(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.alertService.error('Failed to load tax rules');
          console.error(err);
        }
      });
  }

  selectTax(tax: any, index?: number) {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedTaxNo.set(tax.tax_no);
    
    this.isLoading.set(true);
    this.sysService.getDetails<any>('tax/detail', { tax_no: tax.tax_no })
      .pipe(finalize(() => this.isLoading.set(false)))
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
          this.alertService.error('Failed to load details');
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
      this.alertService.warning('This tax is already added as a component.');
      return;
    }
    this.addComponentRow(tax);
  }

  onNew() {
    this.selectedTaxNo.set(null);
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
      this.alertService.warning('Please correct the errors before saving.');
      return;
    }

    this.isSaving.set(true);
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

    const isUpdate = !!this.selectedTaxNo();
    const obs = isUpdate 
      ? this.sysService.update<any>('tax/update', payload)
      : this.sysService.create<any>('tax/create', payload);

    obs.pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.success(isUpdate ? 'Tax updated' : 'Tax created');
            this.loadTaxRules(isUpdate ? this.lastSelectedIndex : 0);
          } else {
            this.alertService.error(res.message || 'Save failed');
          }
        },
        error: (err) => {
          this.alertService.error('Server error during save');
          console.error(err);
        }
      });
  }

  onDelete() {
    if (!this.selectedTaxNo()) return;

    this.alertService.deleteConfirm().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.sysService.delete<any>('tax/delete', { tax_no: this.selectedTaxNo() })
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.success('Tax rule deleted');
                this.loadTaxRules();
              } else {
                this.alertService.error(res.message || 'Delete failed');
              }
            },
            error: (err) => {
              this.alertService.error('Server error during delete');
              console.error(err);
            }
          });
      }
    });
  }

  onReset() {
    if (this.selectedTaxNo()) {
      const original = this.taxRules().find(t => t.tax_no === this.selectedTaxNo());
      if (original) this.selectTax(original);
    } else {
      this.onNew();
    }
  }
}

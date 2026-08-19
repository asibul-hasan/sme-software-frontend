import { Component, ChangeDetectionStrategy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ToastrService } from 'ngx-toastr';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Hrm1004ModelService, Grade, GradeStep } from './services/model.service';
import { Hrm1004DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { DecimalInputDirective } from '@app/shared/directives/decimal-input.directive';

type SalarySetupTab = 'elements' | 'grades';
type SalaryElementCategory = 'earning' | 'deduction' | 'employer';
type SalaryElementBasis = 'basic' | 'gross' | 'fixed';
type SalaryElementCalcMode = 'manual' | 'fixed' | 'percent' | 'formula';
type StepEntryMode = 'gross' | 'basic';

interface SalaryElementDraft {
  id: string;
  component_id: string;
  component_name: string;
  category: SalaryElementCategory;
  basis: SalaryElementBasis;
  calc_mode: SalaryElementCalcMode;
  value: number | null;
  formula_note: string;
  affects_gross: boolean;
  is_taxable: boolean;
  is_active: boolean;
  order_no: number;
}

interface StepMasterDraft {
  entry_mode: StepEntryMode;
  basic_percent_of_gross: number;
  reference_gross: number | null;
  reference_basic: number | null;
  working_days: number;
  remarks: string;
}

interface PayrollPreviewRow {
  id: string;
  component_id: string;
  component_name: string;
  category: SalaryElementCategory;
  basis: SalaryElementBasis;
  calc_mode: SalaryElementCalcMode;
  amount: number;
  formula_note: string;
  affects_gross: boolean;
  is_taxable: boolean;
}

interface PayrollPreviewSummary {
  gross: number;
  deductions: number;
  employerCost: number;
  netPay: number;
  basic: number;
  rows: PayrollPreviewRow[];
}

function defaultSalaryElements(): SalaryElementDraft[] {
  return [
    {
      id: 'BASIC',
      component_id: 'BASIC',
      component_name: 'Basic Salary',
      category: 'earning',
      basis: 'basic',
      calc_mode: 'manual',
      value: null,
      formula_note: 'Primary wage element',
      affects_gross: true,
      is_taxable: true,
      is_active: true,
      order_no: 1,
    },
    {
      id: 'HOUSE_RENT',
      component_id: 'HOUSE_RENT',
      component_name: 'House Rent',
      category: 'earning',
      basis: 'basic',
      calc_mode: 'percent',
      value: 50,
      formula_note: 'Common Bangladesh allowance ratio',
      affects_gross: true,
      is_taxable: true,
      is_active: true,
      order_no: 2,
    },
    {
      id: 'MEDICAL',
      component_id: 'MEDICAL',
      component_name: 'Medical Allowance',
      category: 'earning',
      basis: 'fixed',
      calc_mode: 'fixed',
      value: 1500,
      formula_note: 'Flat monthly allowance',
      affects_gross: true,
      is_taxable: true,
      is_active: true,
      order_no: 3,
    },
    {
      id: 'CONVEYANCE',
      component_id: 'CONVEYANCE',
      component_name: 'Conveyance Allowance',
      category: 'earning',
      basis: 'fixed',
      calc_mode: 'fixed',
      value: 1200,
      formula_note: 'Transport support',
      affects_gross: true,
      is_taxable: true,
      is_active: true,
      order_no: 4,
    },
    {
      id: 'PF_EMPLOYEE',
      component_id: 'PF_EMPLOYEE',
      component_name: 'Provident Fund Employee',
      category: 'deduction',
      basis: 'basic',
      calc_mode: 'percent',
      value: 8,
      formula_note: 'Employee contribution',
      affects_gross: false,
      is_taxable: false,
      is_active: true,
      order_no: 5,
    },
    {
      id: 'PF_EMPLOYER',
      component_id: 'PF_EMPLOYER',
      component_name: 'Provident Fund Employer',
      category: 'employer',
      basis: 'basic',
      calc_mode: 'percent',
      value: 8,
      formula_note: 'Employer contribution',
      affects_gross: false,
      is_taxable: false,
      is_active: true,
      order_no: 6,
    },
  ];
}

function cloneSalaryElements(rows: SalaryElementDraft[]): SalaryElementDraft[] {
  return rows.map((row) => ({ ...row }));
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hrm1004',
  standalone: true,
  imports: [DecimalInputDirective, 
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Hrm1004ModelService, Hrm1004DataService],
  templateUrl: './hrm1004.component.html',
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .setup-shell {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .setup-tabs {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 14px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.14);
    }

    .setup-tab {
      border: 0;
      background: transparent;
      color: var(--text-color, #cbd5e1);
      border-radius: 10px;
      padding: 10px 14px;
      min-width: 150px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 700;
      transition: all 0.18s ease;
    }

    .setup-tab mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .setup-tab.active {
      background: linear-gradient(180deg, rgba(99, 102, 241, 0.24), rgba(99, 102, 241, 0.16));
      color: #eef2ff;
      box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.45);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }

    .summary-card {
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.12);
      min-height: 96px;
    }

    .summary-card__label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(148, 163, 184, 0.9);
      margin-bottom: 8px;
    }

    .summary-card__value {
      font-size: 22px;
      font-weight: 800;
      color: #f8fafc;
      line-height: 1.15;
    }

    .summary-card__meta {
      margin-top: 6px;
      color: rgba(148, 163, 184, 0.92);
      font-size: 12px;
    }

    .elements-table th,
    .elements-table td,
    .preview-table th,
    .preview-table td,
    .steps-table th,
    .steps-table td {
      vertical-align: middle;
      white-space: nowrap;
    }

    .elements-table input,
    .elements-table select,
    .steps-table input,
    .rule-grid input,
    .rule-grid textarea {
      min-height: 38px;
    }

    .elements-table tbody tr {
      transition: background 0.18s ease, box-shadow 0.18s ease;
    }

    .elements-table tbody tr.is-selected {
      background: rgba(79, 70, 229, 0.14);
      box-shadow: inset 3px 0 0 #818cf8;
    }

    .sidebar-tree {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 2px 0 6px;
    }

    .tree-grade {
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.08);
      background: rgba(15, 23, 42, 0.52);
      overflow: hidden;
    }

    .tree-grade__button,
    .tree-step__button {
      width: 100%;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
    }

    .tree-grade__button.active {
      background: rgba(79, 70, 229, 0.14);
      box-shadow: inset 3px 0 0 #818cf8;
    }

    .tree-grade__main,
    .tree-step__main {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .tree-grade__meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .tree-grade__title,
    .tree-step__title {
      font-size: 13px;
      font-weight: 800;
      color: #e2e8f0;
      min-width: 0;
    }

    .tree-grade__subtitle,
    .tree-step__subtitle {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.92);
      min-width: 0;
    }

    .tree-step-list {
      position: relative;
      padding: 4px 0 10px 18px;
      margin-left: 18px;
    }

    .tree-step-list::before {
      content: '';
      position: absolute;
      left: 10px;
      top: 4px;
      bottom: 12px;
      width: 1px;
      background: rgba(99, 102, 241, 0.2);
    }

    .tree-step {
      position: relative;
      padding-left: 14px;
    }

    .tree-step::before {
      content: '';
      position: absolute;
      left: 0;
      top: 21px;
      width: 12px;
      height: 1px;
      background: rgba(99, 102, 241, 0.2);
    }

    .tree-step__button {
      border-radius: 12px 0 0 12px;
      padding: 10px 12px;
    }

    .tree-step__button.active {
      background: rgba(79, 70, 229, 0.18);
      box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.42);
      border-radius: 12px;
    }

    .step-rule-card {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78));
      border: 1px solid rgba(99, 102, 241, 0.12);
    }

    .step-selector {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(99, 102, 241, 0.14);
      border-radius: 12px;
    }

    .step-selector button {
      border: 0;
      background: transparent;
      color: #cbd5e1;
      border-radius: 10px;
      min-width: 122px;
      padding: 9px 14px;
      font-weight: 700;
    }

    .step-selector button.active {
      background: rgba(79, 70, 229, 0.18);
      color: #eef2ff;
      box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.45);
    }

    .rule-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px 16px;
    }

    .metric-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 16px;
    }

    .metric-pill {
      border-radius: 14px;
      padding: 12px 14px;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(129, 140, 248, 0.16);
    }

    .metric-pill__label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(148, 163, 184, 0.92);
      margin-bottom: 4px;
    }

    .metric-pill__value {
      font-size: 18px;
      font-weight: 800;
      color: #f8fafc;
    }

    .badge-soft {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(99, 102, 241, 0.12);
      color: #c7d2fe;
      border: 1px solid rgba(129, 140, 248, 0.18);
    }

    .badge-soft.is-deduction {
      background: rgba(248, 113, 113, 0.12);
      border-color: rgba(248, 113, 113, 0.2);
      color: #fecaca;
    }

    .badge-soft.is-employer {
      background: rgba(45, 212, 191, 0.12);
      border-color: rgba(45, 212, 191, 0.22);
      color: #99f6e4;
    }

    .preview-footer {
      display: flex;
      justify-content: flex-end;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid rgba(148, 163, 184, 0.12);
    }

    .preview-footer__item {
      min-width: 132px;
      text-align: right;
    }

    .preview-footer__label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: rgba(148, 163, 184, 0.88);
      margin-bottom: 4px;
    }

    .preview-footer__value {
      font-size: 18px;
      font-weight: 800;
      color: #f8fafc;
    }

    .preview-footer__value.is-danger {
      color: #fecaca;
    }

    .preview-footer__value.is-success {
      color: #bbf7d0;
    }

    .section-note {
      font-size: 12px;
      color: rgba(148, 163, 184, 0.92);
    }

    .input-readonly {
      background: rgba(148, 163, 184, 0.08);
    }

    @media (max-width: 1199.98px) {
      .summary-grid,
      .metric-strip,
      .rule-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 767.98px) {
      .setup-tabs,
      .step-selector {
        width: 100%;
        flex-wrap: wrap;
      }

      .setup-tab,
      .step-selector button {
        flex: 1 1 100%;
        min-width: 0;
      }

      .summary-grid,
      .metric-strip,
      .rule-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class Hrm1004Component implements OnInit {
  public model = inject(Hrm1004ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private toastr = inject(ToastrService);

  readonly activeTab = signal<SalarySetupTab>('elements');
  readonly elementSearchTerm = signal('');
  readonly selectedElementId = signal<string | null>('BASIC');
  readonly selectedStepIndex = signal(0);
  readonly stepMasterState = signal<Record<string, StepMasterDraft>>({});

  readonly categoryOptions: Array<{ value: SalaryElementCategory; label: string }> = [
    { value: 'earning', label: 'Earning' },
    { value: 'deduction', label: 'Deduction' },
    { value: 'employer', label: 'Employer Cost' },
  ];

  readonly basisOptions: Array<{ value: SalaryElementBasis; label: string }> = [
    { value: 'basic', label: 'Basic' },
    { value: 'gross', label: 'Gross' },
    { value: 'fixed', label: 'Fixed' },
  ];

  readonly calcModeOptions: Array<{ value: SalaryElementCalcMode; label: string }> = [
    { value: 'manual', label: 'Manual' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'percent', label: 'Percent' },
    { value: 'formula', label: 'Formula' },
  ];

  readonly salaryElements = signal<SalaryElementDraft[]>(defaultSalaryElements());
  readonly savedSalaryElements = signal<SalaryElementDraft[]>(cloneSalaryElements(defaultSalaryElements()));

  readonly filteredSalaryElements = computed(() => {
    const term = this.elementSearchTerm().trim().toLowerCase();
    const rows = this.salaryElements()
      .slice()
      .sort((a, b) => a.order_no - b.order_no);
    if (!term) return rows;
    return rows.filter((row) =>
      `${row.component_id} ${row.component_name} ${row.formula_note}`.toLowerCase().includes(term),
    );
  });

  readonly sidebarTitle = computed(() =>
    this.activeTab() === 'elements' ? 'Salary Elements' : 'Grades & Steps',
  );

  readonly activeElementCount = computed(() =>
    this.filteredSalaryElements().filter((item) => item.is_active).length,
  );

  readonly grossElementCount = computed(() =>
    this.filteredSalaryElements().filter((item) => item.affects_gross).length,
  );

  readonly deductionElementCount = computed(() =>
    this.filteredSalaryElements().filter((item) => item.category === 'deduction').length,
  );

  readonly employerElementCount = computed(() =>
    this.filteredSalaryElements().filter((item) => item.category === 'employer').length,
  );

  readonly pageTitle = computed(() => 'Salary Grade Setup');
  readonly pageSubtitle = computed(() => 'Configure salary elements, grade steps and payroll-ready salary logic');

  readonly recordsCount = computed(() =>
    this.activeTab() === 'elements'
      ? this.filteredSalaryElements().length
      : this.model.filteredGrades().length,
  );

  readonly selectedStep = computed(() => {
    const steps = this.model.steps();
    return steps[this.selectedStepIndex()] ?? null;
  });

  readonly selectedStepStateKey = computed(() => {
    const gradeNo = this.model.selectedGradeNo();
    const step = this.selectedStep();
    return gradeNo && step ? this.makeStepStateKey(gradeNo, step) : null;
  });

  readonly selectedStepConfig = computed(() => {
    const key = this.selectedStepStateKey();
    const step = this.selectedStep();
    if (!step) {
      return this.createDefaultStepConfig(null);
    }
    return key ? this.stepMasterState()[key] ?? this.createDefaultStepConfig(step) : this.createDefaultStepConfig(step);
  });

  readonly payrollPreview = computed<PayrollPreviewSummary>(() => {
    const step = this.selectedStep();
    if (!step) {
      return {
        gross: 0,
        deductions: 0,
        employerCost: 0,
        netPay: 0,
        basic: 0,
        rows: [],
      };
    }

    const config = this.selectedStepConfig();
    const activeRows = this.salaryElements().filter((row) => row.is_active);
    const basicPercentFactor = this.toNumber(config.basic_percent_of_gross) / 100;

    let basic = 0;
    let gross = 0;

    if (config.entry_mode === 'gross') {
      gross = this.toNumber(config.reference_gross ?? step.amount);
      basic = this.toNumber(config.reference_basic);
      if (!basic && basicPercentFactor > 0) {
        basic = gross * basicPercentFactor;
      }
    } else {
      basic = this.toNumber(config.reference_basic ?? step.amount);
      const grossPercentRate = activeRows
        .filter((row) => row.category === 'earning' && row.affects_gross && row.component_id !== 'BASIC' && row.calc_mode === 'percent' && row.basis === 'gross')
        .reduce((sum, row) => sum + this.toNumber(row.value), 0) / 100;

      const knownGrossEarnings = activeRows
        .filter((row) => row.category === 'earning' && row.affects_gross)
        .reduce((sum, row) => sum + this.resolveElementAmount(row, basic, 0), 0);

      gross = grossPercentRate > 0 && grossPercentRate < 1
        ? knownGrossEarnings / (1 - grossPercentRate)
        : knownGrossEarnings;
    }

    if (!gross) {
      gross = activeRows
        .filter((row) => row.category === 'earning' && row.affects_gross)
        .reduce((sum, row) => sum + this.resolveElementAmount(row, basic, 0), 0);
    }

    const rows = activeRows.map((row) => ({
      id: row.id,
      component_id: row.component_id,
      component_name: row.component_name,
      category: row.category,
      basis: row.basis,
      calc_mode: row.calc_mode,
      amount: this.roundTo2(this.resolveElementAmount(row, basic, gross)),
      formula_note: row.formula_note,
      affects_gross: row.affects_gross,
      is_taxable: row.is_taxable,
    }));

    const grossTotal = this.roundTo2(
      rows
        .filter((row) => row.category === 'earning' && row.affects_gross)
        .reduce((sum, row) => sum + row.amount, 0),
    );
    const deductionTotal = this.roundTo2(
      rows
        .filter((row) => row.category === 'deduction')
        .reduce((sum, row) => sum + row.amount, 0),
    );
    const employerTotal = this.roundTo2(
      rows
        .filter((row) => row.category === 'employer')
        .reduce((sum, row) => sum + row.amount, 0),
    );

    return {
      basic: this.roundTo2(basic),
      gross: grossTotal || this.roundTo2(gross),
      deductions: deductionTotal,
      employerCost: employerTotal,
      netPay: this.roundTo2((grossTotal || gross) - deductionTotal),
      rows,
    };
  });

  constructor() {
    effect(
      () => {
        const rows = this.filteredSalaryElements();
        const selected = this.selectedElementId();
        if (rows.length === 0) {
          this.selectedElementId.set(null);
          return;
        }
        if (!selected || !rows.some((row) => row.id === selected)) {
          this.selectedElementId.set(rows[0].id);
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const steps = this.model.steps();
        const index = this.selectedStepIndex();
        if (!steps.length) {
          this.selectedStepIndex.set(0);
          return;
        }
        if (index >= steps.length) {
          this.selectedStepIndex.set(0);
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const key = this.selectedStepStateKey();
        const step = this.selectedStep();
        if (!key || !step) return;
        this.stepMasterState.update((state) =>
          state[key] ? state : { ...state, [key]: this.createDefaultStepConfig(step) },
        );
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => {
      this.permissionService.useLocalPermissions('HRM_1004');
      this.model.loadGrades();
    });
  }

  get formdata() {
    return this.model.form;
  }

  currentSearchTerm(): string {
    return this.activeTab() === 'elements' ? this.elementSearchTerm() : this.model.searchTerm();
  }

  onSortDirectionChange(direction: '' | 'asc' | 'desc'): void {
    if (this.activeTab() !== 'grades') return;
    this.model.sortDirection.set(direction);
    this.model.pager.reset();
  }

  selectTab(tab: SalarySetupTab): void {
    this.activeTab.set(tab);
  }

  onSearchTermChange(val: string): void {
    if (this.activeTab() === 'elements') {
      this.elementSearchTerm.set(val);
      return;
    }
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  onSave(): void {
    if (this.activeTab() === 'elements') {
      this.savedSalaryElements.set(cloneSalaryElements(this.salaryElements()));
      this.toastr.success('Salary element design draft updated');
      return;
    }
    this.model.onSave();
  }

  onNew(): void {
    if (this.activeTab() === 'elements') {
      this.addSalaryElement();
      return;
    }
    this.model.onNew();
  }

  onReset(): void {
    if (this.activeTab() === 'elements') {
      this.salaryElements.set(cloneSalaryElements(this.savedSalaryElements()));
      this.toastr.info('Salary element draft reset');
      return;
    }
    if (this.model.selectedGradeNo()) {
      const original = this.model.grades().find((g) => g.grade_no === this.model.selectedGradeNo());
      if (original) this.model.selectGrade(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (this.activeTab() === 'elements') {
      const selected = this.selectedElementId();
      if (!selected) return;
      this.alertService.deleteConfirm().subscribe((confirmed) => {
        if (confirmed) this.removeSalaryElement(selected);
      });
      return;
    }

    if (!this.model.selectedGradeNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectGrade(grade: Grade, index?: number): void {
    this.model.selectGrade(grade, index);
    this.activeTab.set('grades');
    this.selectedStepIndex.set(0);
  }

  selectStep(index: number): void {
    this.selectedStepIndex.set(index);
  }

  toUpper(controlName: string): void {
    const ctrl = this.formdata.get(controlName);
    if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false });
  }

  toggleActive(event: MatCheckboxChange): void {
    this.formdata.get('is_active')?.setValue(event.checked ? 1 : 0);
  }

  setStepEntryMode(mode: StepEntryMode): void {
    this.updateSelectedStepConfig('entry_mode', mode);
  }

  updateSelectedStepConfig<K extends keyof StepMasterDraft>(field: K, value: StepMasterDraft[K]): void {
    const key = this.selectedStepStateKey();
    const step = this.selectedStep();
    if (!key || !step) return;

    this.stepMasterState.update((state) => {
      const current = state[key] ?? this.createDefaultStepConfig(step);
      return {
        ...state,
        [key]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  addSalaryElement(): void {
    const nextOrder = this.salaryElements().length + 1;
    const id = `ELEMENT_${nextOrder}`;
    const draft: SalaryElementDraft = {
      id,
      component_id: id,
      component_name: 'New Element',
      category: 'earning',
      basis: 'fixed',
      calc_mode: 'fixed',
      value: null,
      formula_note: '',
      affects_gross: true,
      is_taxable: true,
      is_active: true,
      order_no: nextOrder,
    };
    this.salaryElements.update((rows) => [...rows, draft]);
    this.selectedElementId.set(id);
  }

  selectSalaryElement(id: string): void {
    this.selectedElementId.set(id);
  }

  updateSalaryElement<K extends keyof SalaryElementDraft>(id: string, field: K, value: SalaryElementDraft[K]): void {
    this.salaryElements.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  removeSalaryElement(id: string): void {
    this.salaryElements.update((rows) =>
      rows
        .filter((row) => row.id !== id)
        .map((row, index) => ({ ...row, order_no: index + 1 })),
    );
    this.toastr.success('Salary element removed from draft');
  }

  badgeClass(category: SalaryElementCategory): string {
    if (category === 'deduction') return 'badge-soft is-deduction';
    if (category === 'employer') return 'badge-soft is-employer';
    return 'badge-soft';
  }

  categoryLabel(value: SalaryElementCategory): string {
    return this.categoryOptions.find((item) => item.value === value)?.label || value;
  }

  basisLabel(value: SalaryElementBasis): string {
    return this.basisOptions.find((item) => item.value === value)?.label || value;
  }

  calcModeLabel(value: SalaryElementCalcMode): string {
    return this.calcModeOptions.find((item) => item.value === value)?.label || value;
  }

  gradeStepCount(grade: Grade): number {
    if (this.model.selectedGradeNo() === grade.grade_no) {
      return this.model.steps().length;
    }
    return grade.steps?.length ?? 0;
  }

  stepsForGrade(grade: Grade): GradeStep[] {
    if (this.model.selectedGradeNo() === grade.grade_no) {
      return this.model.steps();
    }
    return grade.steps ?? [];
  }

  stepAmountLabel(amount: number | null | undefined): string {
    return this.roundTo2(this.toNumber(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  selectedStepName(): string {
    return this.selectedStep()?.step || 'No step selected';
  }

  selectedStepAmountText(): string {
    return this.stepAmountLabel(this.selectedStep()?.amount);
  }

  private createDefaultStepConfig(step: GradeStep | null): StepMasterDraft {
    const sourceAmount = this.toNumber(step?.amount);
    return {
      entry_mode: 'gross',
      basic_percent_of_gross: 60,
      reference_gross: sourceAmount || null,
      reference_basic: sourceAmount ? this.roundTo2(sourceAmount * 0.6) : null,
      working_days: 30,
      remarks: '',
    };
  }

  private makeStepStateKey(gradeNo: number, step: GradeStep): string {
    return `${gradeNo}:${step.grade_step_no ?? step.step}`;
  }

  private resolveElementAmount(row: SalaryElementDraft, basic: number, gross: number): number {
    if (row.component_id === 'BASIC') {
      return basic;
    }

    if (row.calc_mode === 'manual') {
      return this.toNumber(row.value);
    }

    if (row.calc_mode === 'fixed') {
      return this.toNumber(row.value);
    }

    if (row.calc_mode === 'formula') {
      return this.toNumber(row.value);
    }

    const factor = this.toNumber(row.value) / 100;
    if (row.basis === 'gross') {
      return gross * factor;
    }
    if (row.basis === 'basic') {
      return basic * factor;
    }
    return this.toNumber(row.value);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundTo2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

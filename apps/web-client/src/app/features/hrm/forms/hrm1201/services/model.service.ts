import { Injectable, signal, computed, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1201DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';
import { CommonDataService, EmployeeLookup } from '../../../../../shared/services/common-data.service';

export interface StructureLine {
  structure_dtl_no?: number | null;
  component_no: number | null;
  amount: number | null;
}

export interface SalaryStructure extends BaseEntity {
  salary_structure_no: number;
  employee_no: number;
  effective_from: string;
  effective_to?: string | null;
  gross_salary: number;
  status: number;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
  lines?: StructureLine[];
}

export interface ComponentOption {
  component_no: number;
  component_id: string;
  component_name: string;
  component_type: number;
}

/** State + form (header + lines FormArray) + orchestration for HRM_1201 – Salary Structure. */
@Injectable()
export class Hrm1201ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1201DataService);
  private commApi = inject(CommonDataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  structures    = signal<SalaryStructure[]>([]);
  employees     = signal<EmployeeLookup[]>([]);
  components    = signal<ComponentOption[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  employeeName(employeeNo?: number | null): string {
    if (employeeNo == null) return '';
    const e = this.employees().find((x) => x.employee_no === employeeNo);
    return e ? (e.full_name || `${e.first_name} ${e.last_name ?? ''}`.trim()) : `#${employeeNo}`;
  }

  componentName(componentNo?: number | null): string {
    const c = this.components().find((x) => x.component_no === componentNo);
    return c ? c.component_name : '';
  }

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.structures()
      .filter((s) => this.employeeName(s.employee_no).toLowerCase().includes(term) || (s.effective_from || '').includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.salary_structure_no - a.salary_structure_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      salary_structure_no: [null],
      employee_no:         [null, [Validators.required]],
      effective_from:      [new Date().toISOString().split('T')[0], [Validators.required]],
      effective_to:        [null],
      status:              [1, [Validators.required]],
      remarks:             [''],
      is_active:           [1],
      lines:               this.fb.array([this.makeLine()]),
    });
  }

  get linesArray(): FormArray { return this.form.get('lines') as FormArray; }

  private makeLine(line?: Partial<StructureLine>): FormGroup {
    return this.fb.group({
      structure_dtl_no: [line?.structure_dtl_no ?? null],
      component_no:     [line?.component_no ?? null, [Validators.required]],
      amount:           [line?.amount ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addLine(): void { this.linesArray.push(this.makeLine()); }
  removeLine(i: number): void {
    this.linesArray.removeAt(i);
    if (this.linesArray.length === 0) this.addLine();
  }
  private setLines(lines: StructureLine[]): void {
    this.linesArray.clear();
    (lines.length ? lines : [{ component_no: null, amount: 0 }]).forEach((l) => this.linesArray.push(this.makeLine(l)));
  }

  /** Gross = sum of line amounts (the earning breakdown). Recomputed by the server on save too. */
  grossTotal(): number {
    return this.linesArray.controls.reduce((sum, c) => sum + (Number(c.get('amount')?.value) || 0), 0);
  }

  loadEmployees(): void {
    this.commApi.getEmployeeList({ is_active: 1 }).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.employees.set(res.data); },
    });
  }

  loadComponents(): void {
    this.data.loadComponents().subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.components.set(res.data); },
    });
  }

  loadStructures(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadStructures().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.structures.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((s) => s.salary_structure_no === reselectNo) : null;
            this.selectStructure(target ?? res.data[0]);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load salary structures'),
    });
  }

  selectStructure(item: SalaryStructure): void {
    this.selectedNo.set(item.salary_structure_no);
    this.isLoading.set(true);
    this.data.loadStructureDetail(item.salary_structure_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data;
          this.form.patchValue({
            salary_structure_no: d.salary_structure_no,
            employee_no:         d.employee_no,
            effective_from:      (d.effective_from ?? '').slice(0, 10),
            effective_to:        d.effective_to ? d.effective_to.slice(0, 10) : null,
            status:              d.status ?? 1,
            remarks:             d.remarks,
            is_active:           d.is_active,
          });
          this.setLines(d.lines ?? []);
        }
      },
      error: () => this.toastr.error('Failed to load structure details'),
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();

    const payload = {
      salary_structure_no: val.salary_structure_no,
      employee_no:         val.employee_no,
      effective_from:      val.effective_from,
      effective_to:        val.effective_to,
      status:              val.status,
      branch_no:           this.currentBranchNo,
      remarks:             val.remarks,
      is_active:           val.is_active,
      lines:               (val.lines as StructureLine[]).map((l) => ({ component_no: l.component_no, amount: l.amount })),
    };

    const obs = isUpdate
      ? this.data.updateStructure(this.selectedNo()!, payload)
      : this.data.saveStructure(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Salary structure updated' : 'Salary structure created');
          const savedNo = isUpdate ? this.selectedNo() : (res.data?.salary_structure_no ?? null);
          this.loadStructures(savedNo);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }

  onDelete(callback?: () => void): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.deleteStructure(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Salary structure deleted');
          this.loadStructures(null);
          if (callback) callback();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: () => this.toastr.error('Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({
      effective_from: new Date().toISOString().split('T')[0],
      status: 1,
      is_active: 1,
    });
    this.setLines([]);
  }
}

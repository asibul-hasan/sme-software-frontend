import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1007DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { AuthContextService } from '../../../../../core/services/auth-context.service';

export interface SalaryComponent extends BaseEntity {
  component_no: number;
  component_id: string;
  component_name: string;
  component_type: number;
  calc_type: number;
  calc_value?: number | null;
  is_taxable: number;
  affects_net: number;
  is_statutory: number;
  country_code?: string | null;
  gl_account_code?: string | null;
  display_order?: number | null;
  branch_no?: number | null;
  remarks?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form + orchestration for HRM_1007 – Salary Component Setup. */
@Injectable()
export class Hrm1007ModelService {
  private fb      = inject(FormBuilder);
  private data    = inject(Hrm1007DataService);
  private toastr  = inject(ToastrService);
  private authCtx = inject(AuthContextService);

  private get currentBranchNo(): number | null {
    return this.authCtx.user()?.branch_no ?? null;
  }

  components        = signal<SalaryComponent[]>([]);
  isLoading         = signal(false);
  isSaving          = signal(false);
  searchTerm        = signal('');
  selectedNo        = signal<number | null>(null);
  lastSelectedIndex = 0;
  sortDirection = signal<SortDirection>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.components()
      .filter((c) => c.component_name.toLowerCase().includes(term) || c.component_id.toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.component_id || '').localeCompare(b.component_id || ''));
    return this.sortDirection() === 'asc' ? sorted : [...sorted].reverse();
  });

  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      component_no:    [null],
      component_id:    ['', [Validators.required, Validators.maxLength(20)]],
      component_name:  ['', [Validators.required, Validators.maxLength(100)]],
      component_type:  [1, [Validators.required]],
      calc_type:       [1, [Validators.required]],
      calc_value:      [null, [Validators.min(0)]],
      is_taxable:      [1],
      affects_net:     [1],
      is_statutory:    [0],
      country_code:    [null],
      gl_account_code: [''],
      display_order:   [null],
      remarks:         [''],
      is_active:       [1],
    });
  }

  loadComponents(reselectIndex?: number): void {
    this.isLoading.set(true);
    this.data.loadComponents().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.components.set(res.data);
          if (res.data.length > 0) {
            const index = reselectIndex !== undefined && reselectIndex < res.data.length ? reselectIndex : 0;
            this.selectComponent(res.data[index], index);
          } else {
            this.onNew();
          }
        }
      },
      error: () => this.toastr.error('Failed to load salary components'),
    });
  }

  selectComponent(item: SalaryComponent, index?: number): void {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedNo.set(item.component_no);
    this.isLoading.set(true);
    this.data.loadComponentDetail(item.component_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            component_no:    d['component_no'],
            component_id:    d['component_id'],
            component_name:  d['component_name'],
            component_type:  d['component_type'] ?? 1,
            calc_type:       d['calc_type'] ?? 1,
            calc_value:      d['calc_value'],
            is_taxable:      d['is_taxable'] ?? 1,
            affects_net:     d['affects_net'] ?? 1,
            is_statutory:    d['is_statutory'] ?? 0,
            country_code:    d['country_code'],
            gl_account_code: d['gl_account_code'],
            display_order:   d['display_order'],
            remarks:         d['remarks'],
            is_active:       d['is_active'],
          });
        }
      },
      error: () => this.toastr.error('Failed to load component details'),
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
      component_no:    val.component_no,
      component_id:    val.component_id,
      component_name:  val.component_name,
      component_type:  val.component_type,
      calc_type:       val.calc_type,
      calc_value:      val.calc_value,
      is_taxable:      val.is_taxable ? 1 : 0,
      affects_net:     val.affects_net ? 1 : 0,
      is_statutory:    val.is_statutory ? 1 : 0,
      country_code:    val.country_code,
      gl_account_code: val.gl_account_code,
      display_order:   val.display_order,
      branch_no:       this.currentBranchNo,
      remarks:         val.remarks,
      is_active:       val.is_active,
    };

    const obs = isUpdate
      ? this.data.updateComponent(this.selectedNo()!, payload)
      : this.data.saveComponent(payload);

    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Component updated' : 'Component created');
          this.loadComponents(isUpdate ? this.lastSelectedIndex : 0);
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
    this.data.deleteComponent(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('Component deleted');
          this.loadComponents();
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
      component_type: 1,
      calc_type: 1,
      is_taxable: 1,
      affects_net: 1,
      is_statutory: 0,
      is_active: 1,
    });
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1002DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface AccountGroup extends BaseEntity {
  account_group_no: number;
  account_group_id: string;
  group_name: string;
  parent_group_no?: number | null;
  root_type: number;
  normal_balance?: number | null;
  is_control?: number | null;
  order_sl?: number | null;
  parent_group_name?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for FIN_1002 – Account Group. */
@Injectable()
export class Fin1002ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1002DataService);
  private toastr = inject(ToastrService);

  groups        = signal<AccountGroup[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.groups()
      .filter((g) => (g.account_group_id || '').toLowerCase().includes(term) || (g.group_name || '').toLowerCase().includes(term))
      .sort((a, b) => b.account_group_no - a.account_group_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  /** Live parent options (exclude self). */
  parentOptions = computed(() => this.groups().filter((g) => g.account_group_no !== this.selectedNo()));

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      account_group_no: [null],
      account_group_id: ['', [Validators.required, Validators.maxLength(30)]],
      group_name:       ['', [Validators.required, Validators.maxLength(150)]],
      parent_group_no:  [null],
      root_type:        [1, [Validators.required]],
      normal_balance:   [null],
      is_control:       [0],
      order_sl:         [0],
      is_active:        [1],
    });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadGroups().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.groups.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((g) => g.account_group_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load account groups'),
    });
  }

  select(item: AccountGroup): void {
    this.selectedNo.set(item.account_group_no);
    this.form.patchValue({
      account_group_no: item.account_group_no,
      account_group_id: item.account_group_id,
      group_name:       item.group_name,
      parent_group_no:  item.parent_group_no,
      root_type:        item.root_type,
      normal_balance:   item.normal_balance,
      is_control:       item.is_control ?? 0,
      order_sl:         item.order_sl ?? 0,
      is_active:        item.is_active,
    });
  }

  onSave(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.toastr.warning('Please correct the errors before saving.'); return; }
    this.isSaving.set(true);
    const val = this.form.getRawValue();
    const isUpdate = !!this.selectedNo();
    const obs = isUpdate ? this.data.update(this.selectedNo()!, val) : this.data.save(val);
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(isUpdate ? 'Account group updated' : 'Account group created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.account_group_no ?? null));
        } else { this.toastr.error(res.message || 'Save failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during save'),
    });
  }

  onDelete(): void {
    const no = this.selectedNo();
    if (!no) return;
    this.isLoading.set(true);
    this.data.remove(no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) { this.toastr.success('Account group deleted'); this.load(null); }
        else { this.toastr.error(res.message || 'Delete failed'); }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ root_type: 1, is_control: 0, order_sl: 0, is_active: 1 });
  }
}

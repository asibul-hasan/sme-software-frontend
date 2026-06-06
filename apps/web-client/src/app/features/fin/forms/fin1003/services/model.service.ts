import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1003DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface VoucherType extends BaseEntity {
  voucher_type_no: number;
  voucher_type_id: string;
  type_name: string;
  base_kind: number;
  number_prefix?: string | null;
  default_dr_account_no?: number | null;
  default_cr_account_no?: number | null;
  is_system?: number | null;
  order_sl?: number | null;
  is_active: number;
  row_version: number;
}

/** State + form for FIN_1003 – Voucher Type. */
@Injectable()
export class Fin1003ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1003DataService);
  private toastr = inject(ToastrService);

  types         = signal<VoucherType[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.types()
      .filter((t) => (t.voucher_type_id || '').toLowerCase().includes(term) || (t.type_name || '').toLowerCase().includes(term))
      .sort((a, b) => b.voucher_type_no - a.voucher_type_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      voucher_type_no: [null],
      voucher_type_id: ['', [Validators.required, Validators.maxLength(20)]],
      type_name:       ['', [Validators.required, Validators.maxLength(100)]],
      base_kind:       [1, [Validators.required]],
      number_prefix:   [''],
      order_sl:        [0],
      is_active:       [1],
    });
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadTypes().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.types.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((t) => t.voucher_type_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load voucher types'),
    });
  }

  select(item: VoucherType): void {
    this.selectedNo.set(item.voucher_type_no);
    this.form.patchValue({
      voucher_type_no: item.voucher_type_no,
      voucher_type_id: item.voucher_type_id,
      type_name:       item.type_name,
      base_kind:       item.base_kind,
      number_prefix:   item.number_prefix,
      order_sl:        item.order_sl ?? 0,
      is_active:       item.is_active,
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
          this.toastr.success(isUpdate ? 'Voucher type updated' : 'Voucher type created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.voucher_type_no ?? null));
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Voucher type deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ base_kind: 1, order_sl: 0, is_active: 1 });
  }
}

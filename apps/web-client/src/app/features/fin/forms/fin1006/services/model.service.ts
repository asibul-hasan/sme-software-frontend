import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Fin1006DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';

export interface AccountLite { account_no: number; account_code: string; account_name: string; }

export interface GlMap extends BaseEntity {
  gl_map_no: number;
  event_type: string;
  leg_key: string;
  sub_key?: string | null;
  account_no: number | null;
  account_code?: string | null;
  account_name?: string | null;
  is_active: number;
  row_version: number;
}

/** State + form for FIN_1006 – GL Account Mapping. */
@Injectable()
export class Fin1006ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Fin1006DataService);
  private toastr = inject(ToastrService);

  maps          = signal<GlMap[]>([]);
  accounts      = signal<AccountLite[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const sorted = this.maps()
      .filter((m) => (m.event_type || '').toLowerCase().includes(term) || (m.leg_key || '').toLowerCase().includes(term))
      .sort((a, b) => b.gl_map_no - a.gl_map_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      gl_map_no:  [null],
      event_type: ['', [Validators.required, Validators.maxLength(60)]],
      leg_key:    ['', [Validators.required, Validators.maxLength(60)]],
      sub_key:    [''],
      account_no: [null, [Validators.required]],
      is_active:  [1],
    });
  }

  loadAccounts(): void { this.data.loadAccounts().subscribe({ next: (r) => { if (isSuccess(r) && r.data) this.accounts.set(r.data); } }); }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadMaps().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.maps.set(res.data);
          if (res.data.length > 0) {
            const target = reselectNo != null ? res.data.find((m) => m.gl_map_no === reselectNo) : null;
            this.select(target ?? res.data[0]);
          } else { this.onNew(); }
        }
      },
      error: () => this.toastr.error('Failed to load mappings'),
    });
  }

  select(item: GlMap): void {
    this.selectedNo.set(item.gl_map_no);
    this.form.patchValue({
      gl_map_no:  item.gl_map_no,
      event_type: item.event_type,
      leg_key:    item.leg_key,
      sub_key:    item.sub_key,
      account_no: item.account_no,
      is_active:  item.is_active,
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
          this.toastr.success(isUpdate ? 'Mapping updated' : 'Mapping created');
          this.load(isUpdate ? this.selectedNo() : (res.data?.gl_map_no ?? null));
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
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Mapping deleted'); this.load(null); } else { this.toastr.error(res.message || 'Delete failed'); } },
      error: (err) => this.toastr.error(err?.error?.message || 'Server error during delete'),
    });
  }

  onNew(): void {
    this.selectedNo.set(null);
    this.form?.reset({ is_active: 1 });
  }
}

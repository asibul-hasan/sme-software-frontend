import { Injectable, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { Fin1003DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';

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
  private data      = inject(Fin1003DataService);
  private toastr    = inject(ToastrService);
  private translate = inject(TranslateService);

  types         = signal<VoucherType[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.types()
      .filter((t) => (t.voucher_type_id || '').toLowerCase().includes(term) || (t.type_name || '').toLowerCase().includes(term));
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.voucher_type_no - a.voucher_type_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);

  initForm(): void {
    // No longer using FormGroup, using inline table editing instead
  }

  addRow(): void {
    const newRow = {
      voucher_type_no: 0, // 0 denotes a new unsaved row
      voucher_type_id: '',
      type_name: '',
      base_kind: 1,
      number_prefix: '',
      order_sl: 0,
      is_active: 1,
      row_version: 0
    } as VoucherType;
    
    // Add to top of the list
    this.types.update(list => [newRow, ...list]);
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadTypes().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.types.set(res.data);
        }
      },
      error: () => this.toastr.error('Failed to load voucher types'),
    });
  }

  saveRow(row: VoucherType): void {
    if (!row.voucher_type_id || !row.type_name) {
      if (!row.voucher_type_id) { this.toastr.warning(this.translate.instant('voucherTypeIdMissing')); }
      else if (!row.type_name) { this.toastr.warning(this.translate.instant('voucherTypeNameMissing')); }
      return;
    }
    
    this.isSaving.set(true);
    const isUpdate = !!row.voucher_type_no;
    const obs = isUpdate ? this.data.update(row.voucher_type_no, row) : this.data.save(row);
    
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(this.translate.instant(isUpdate ? 'common.updateSuccess' : 'common.saveSuccess'));
          // Update the specific row in the list with the server response (gets new ID/version)
          this.types.update(list => {
            const index = list.findIndex(t => t === row || t.voucher_type_no === res.data!.voucher_type_no);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = res.data!;
              return newList;
            }
            return [res.data!, ...list.filter(t => t !== row)]; // fallback
          });
        } else {
          this.toastr.error(res.message || this.translate.instant('common.saveFail'));
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || this.translate.instant('common.saveFail')),
    });
  }

  saveAll(): void {
    const types = this.types();
    const toSave = types.filter(t => t.voucher_type_no === 0 || (t as any).__dirty);
    
    if (toSave.length === 0) {
      this.toastr.info('No changes to save');
      return;
    }

    const invalid = toSave.find(t => !t.voucher_type_id || !t.type_name);
    if (invalid) {
      if (!invalid.voucher_type_id) { this.toastr.warning(this.translate.instant('voucherTypeIdMissing') || 'Type ID is required'); }
      else if (!invalid.type_name) { this.toastr.warning(this.translate.instant('voucherTypeNameMissing') || 'Type Name is required'); }
      return;
    }

    this.isSaving.set(true);

    const requests = toSave.map(row => {
      const isUpdate = !!row.voucher_type_no;
      return isUpdate ? this.data.update(row.voucher_type_no, row) : this.data.save(row);
    });

    forkJoin(requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          const hasError = results.some(r => !isSuccess(r));
          if (hasError) {
            this.toastr.error(this.translate.instant('common.saveFail') || 'Some rows failed to save');
          } else {
            this.toastr.success(this.translate.instant('common.saveSuccess') || 'Saved successfully');
          }
          this.load(); // reload to get updated states and remove __dirty flags
        },
        error: () => this.toastr.error(this.translate.instant('common.saveFail') || 'Failed to save changes')
      });
  }

  deleteRow(row: VoucherType): void {
    if (!row.voucher_type_no) {
      // It's a newly added row that hasn't been saved yet, just remove from local list
      this.types.update(list => list.filter(t => t !== row));
      return;
    }
    
    this.isLoading.set(true);
    this.data.remove(row.voucher_type_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(this.translate.instant('common.deleteSuccess'));
          this.types.update(list => list.filter(t => t.voucher_type_no !== row.voucher_type_no));
        } else {
          this.toastr.error(res.message || this.translate.instant('common.deleteFail'));
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || this.translate.instant('common.deleteFail')),
    });
  }
}

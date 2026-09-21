import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { Fin1003DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { GridLookupOption } from '../../../../../shared/ag-grid';
import { FormUtilService } from '../../../../../core/services/form-util.service';

export interface VoucherType extends BaseEntity {
  voucher_type_no: number;
  voucher_type_id: string;
  voucher_type_code?: string;
  type_name: string;
  voucher_type_name?: string;
  base_kind: number;
  number_prefix?: string | null;
  prefix?: string | null;
  default_dr_account_no?: number | null;
  default_cr_account_no?: number | null;
  default_dr_account_name?: string | null;
  default_cr_account_name?: string | null;
  is_system?: number | null;
  order_sl?: number | null;
  is_active: number;
  row_version: number;
}

const IGNORED_VOUCHER_TYPE_KEYS = [
  'default_dr_account_name',
  'default_cr_account_name',
  '__dirty',
  '__uid',
  '__sqlState',
  '__errors',
];

/** State + form for FIN_1003 – Voucher Type. */
@Injectable()
export class Fin1003ModelService {
  private data      = inject(Fin1003DataService);
  private toastr    = inject(ToastrService);
  private translate = inject(TranslateService);
  private formUtil  = inject(FormUtilService);

  private backupMap = new Map<number, VoucherType>();

  types          = signal<VoucherType[]>([]);
  accountOptions = signal<GridLookupOption[]>([]);
  isLoading      = signal(false);
  isSaving       = signal(false);
  searchTerm     = signal('');
  selectedNo     = signal<number | null>(null);
  sortDirection  = signal<SortDirection>('');

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const filtered = this.types()
      .filter((t) =>
        (t.voucher_type_id || t.voucher_type_code || '').toLowerCase().includes(term) ||
        (t.type_name || t.voucher_type_name || '').toLowerCase().includes(term) ||
        (t.number_prefix || t.prefix || '').toLowerCase().includes(term)
      );
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => (a.order_sl ?? 0) - (b.order_sl ?? 0));
    return this.sortDirection() === 'desc' ? [...sorted].reverse() : sorted;
  });
  pager = makePaginator(this.filtered);

  addRow(): void {
    const nextOrder = (this.types().length > 0
      ? Math.max(...this.types().map(t => t.order_sl || 0))
      : 0) + 1;

    const newRow = {
      voucher_type_no: 0, // 0 denotes a new unsaved row
      voucher_type_id: '',
      voucher_type_code: '',
      type_name: '',
      voucher_type_name: '',
      base_kind: 1,
      number_prefix: '',
      prefix: '',
      default_dr_account_no: null,
      default_cr_account_no: null,
      is_system: 0,
      order_sl: nextOrder,
      is_active: 1,
      row_version: 0
    } as VoucherType;
    
    // Add to end of the list
    this.types.update(list => [...list, newRow]);
  }

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      types: this.data.loadTypes(),
      lookups: this.data.loadLookups()
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: ({ types, lookups }) => {
        if (isSuccess(lookups) && lookups.data) {
          const opts: GridLookupOption[] = (lookups.data.accounts || []).map(a => ({
            value: a.account_no,
            label: `${a.account_code} - ${a.account_name}`
          }));
          this.accountOptions.set(opts);
        }
        if (isSuccess(types) && types.data) {
          this.types.set(types.data);
          this.backupMap.clear();
          for (const t of types.data) {
            this.backupMap.set(t.voucher_type_no, this.formUtil.clone(t));
          }
        }
      },
      error: () => this.toastr.error('Failed to load voucher types'),
    });
  }

  saveRow(row: VoucherType): void {
    const typeId = (row.voucher_type_id || row.voucher_type_code || '').trim();
    const typeName = (row.type_name || row.voucher_type_name || '').trim();

    if (!typeId || !typeName) {
      if (!typeId) { this.toastr.warning(this.translate.instant('voucherTypeIdMissing') || 'Voucher Type ID is required'); }
      else if (!typeName) { this.toastr.warning(this.translate.instant('voucherTypeNameMissing') || 'Type Name is required'); }
      return;
    }

    row.voucher_type_id = typeId.toUpperCase();
    row.voucher_type_code = typeId.toUpperCase();
    row.type_name = typeName;
    row.voucher_type_name = typeName;
    row.prefix = row.number_prefix || row.prefix || row.voucher_type_id;
    row.number_prefix = row.prefix;

    const isUpdate = !!row.voucher_type_no;
    if (isUpdate) {
      const backup = this.backupMap.get(row.voucher_type_no);
      const hasChanges = this.formUtil.hasChanges(backup, row, IGNORED_VOUCHER_TYPE_KEYS);
      if (!hasChanges) {
        this.toastr.info('No changes found');
        return;
      }
    }
    
    this.isSaving.set(true);
    const diffPayload = isUpdate
      ? this.prepareDiffPayload(this.backupMap.get(row.voucher_type_no), row)
      : row;

    const obs = isUpdate
      ? this.data.update(row.voucher_type_no, diffPayload as Partial<VoucherType>)
      : this.data.save(row);
    
    obs.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.toastr.success(this.translate.instant(isUpdate ? 'common.updateSuccess' : 'common.saveSuccess'));
          this.types.update(list => {
            const index = list.findIndex(t => t === row || t.voucher_type_no === res.data!.voucher_type_no);
            if (index !== -1) {
              const newList = [...list];
              newList[index] = res.data!;
              return newList;
            }
            return [res.data!, ...list.filter(t => t !== row)];
          });
          this.backupMap.set(res.data.voucher_type_no, this.formUtil.clone(res.data));
        } else {
          this.toastr.error(res.message || this.translate.instant('common.saveFail'));
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || this.translate.instant('common.saveFail')),
    });
  }

  updateRow(row: VoucherType): void {
    this.types.update(list => {
      const index = list.findIndex(t => 
        (row.voucher_type_no > 0 && t.voucher_type_no === row.voucher_type_no) ||
        (row.voucher_type_no === 0 && t.voucher_type_no === 0 && t.order_sl === row.order_sl) ||
        t === row
      );
      if (index !== -1) {
        const next = [...list];
        next[index] = { ...next[index], ...row };
        return next;
      }
      return list;
    });
  }

  saveAll(customRows?: VoucherType[]): void {
    const types = customRows ?? this.types();
    const toSave = types.filter(t => {
      if (t.voucher_type_no === 0) return true;
      const backup = this.backupMap.get(t.voucher_type_no);
      return this.formUtil.hasChanges(backup, t, IGNORED_VOUCHER_TYPE_KEYS);
    });
    
    if (toSave.length === 0) {
      this.toastr.info('No changes to save');
      return;
    }

    for (const row of toSave) {
      const typeId = (row.voucher_type_id || row.voucher_type_code || '').trim();
      const typeName = (row.type_name || row.voucher_type_name || '').trim();

      if (!typeId || !typeName) {
        if (!typeId) { this.toastr.warning(this.translate.instant('voucherTypeIdMissing') || 'Type ID is required'); }
        else if (!typeName) { this.toastr.warning(this.translate.instant('voucherTypeNameMissing') || 'Type Name is required'); }
        return;
      }

      row.voucher_type_id = typeId.toUpperCase();
      row.voucher_type_code = typeId.toUpperCase();
      row.type_name = typeName;
      row.voucher_type_name = typeName;
      row.prefix = row.number_prefix || row.prefix || row.voucher_type_id;
      row.number_prefix = row.prefix;
    }

    this.isSaving.set(true);

    const requests = toSave.map(row => {
      const isUpdate = !!row.voucher_type_no;
      if (isUpdate) {
        const diffPayload = this.prepareDiffPayload(this.backupMap.get(row.voucher_type_no), row);
        return this.data.update(row.voucher_type_no, diffPayload as Partial<VoucherType>);
      }
      return this.data.save(row);
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
          this.load();
        },
        error: () => this.toastr.error(this.translate.instant('common.saveFail') || 'Failed to save changes')
      });
  }

  private prepareDiffPayload(backup?: VoucherType, current?: VoucherType): Partial<VoucherType> {
    const diff = this.formUtil.getDiffPayload(
      backup,
      current,
      'voucher_type_no',
      ['row_version'],
      IGNORED_VOUCHER_TYPE_KEYS
    ) as any;

    if ('default_dr_account_no' in diff && (diff.default_dr_account_no === null || diff.default_dr_account_no === undefined)) {
      diff.default_dr_account_no = 0;
    }
    if ('default_cr_account_no' in diff && (diff.default_cr_account_no === null || diff.default_cr_account_no === undefined)) {
      diff.default_cr_account_no = 0;
    }
    return diff;
  }

  deleteRow(row: VoucherType): void {
    if (!row.voucher_type_no) {
      this.types.update(list => list.filter(t => t !== row && (row.order_sl == null || t.order_sl !== row.order_sl)));
      return;
    }

    if (row.is_system === 1) {
      this.toastr.warning('System voucher types cannot be deleted');
      return;
    }
    
    this.isLoading.set(true);
    this.data.remove(row.voucher_type_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(this.translate.instant('common.deleteSuccess'));
          this.types.update(list => list.filter(t => t.voucher_type_no !== row.voucher_type_no));
          this.backupMap.delete(row.voucher_type_no);
        } else {
          this.toastr.error(res.message || this.translate.instant('common.deleteFail'));
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || this.translate.instant('common.deleteFail')),
    });
  }
}

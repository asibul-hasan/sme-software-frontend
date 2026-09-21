import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { Fin1006DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';
import { FormUtilService } from '../../../../../core/services/form-util.service';

export interface AccountLite { account_no: number; account_code: string; account_name: string; is_active?: number | null; is_postable?: number | null; }

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

const IGNORED_GL_MAP_KEYS = ['account_code', 'account_name'];

/** State + form for FIN_1006 – GL Account Mapping. */
@Injectable()
export class Fin1006ModelService {
  private data      = inject(Fin1006DataService);
  private toastr    = inject(ToastrService);
  private translate = inject(TranslateService);
  private formUtil  = inject(FormUtilService);

  maps          = signal<GlMap[]>([]);
  accounts      = signal<AccountLite[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  eventTypeFilter = signal<string | null>(null);
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

  private backupMap = new Map<number, GlMap>();

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const eventType = this.eventTypeFilter();
    const filtered = this.maps()
      .filter((m) => {
        const matchesTerm = (m.event_type || '').toLowerCase().includes(term) || (m.leg_key || '').toLowerCase().includes(term);
        const matchesEvent = eventType ? m.event_type === eventType : true;
        return matchesTerm && matchesEvent;
      });
    if (this.sortDirection() === '') return filtered;
    const sorted = [...filtered].sort((a, b) => b.gl_map_no - a.gl_map_no);
    return this.sortDirection() === 'desc' ? sorted : [...sorted].reverse();
  });
  pager = makePaginator(this.filtered);
  
  accountOptions = computed(() => 
    this.accounts()
      .filter((a) => (a.is_active ?? 1) === 1 && (a.is_postable ?? 1) !== 0)
      .map(a => ({ label: `${a.account_code} ${a.account_name}`, value: a.account_no }))
  );

  addRow(): void {
    const newRow = {
      gl_map_no: 0,
      event_type: this.eventTypeFilter() || '', // default to filter if set
      leg_key: '',
      sub_key: '',
      account_no: null,
      is_active: 1,
      row_version: 0
    } as GlMap;
    
    this.maps.update(list => [...list, newRow]);
  }

  updateRow(row: GlMap): void {
    this.maps.update((list) => {
      if (row.gl_map_no > 0) {
        return list.map((item) => (item.gl_map_no === row.gl_map_no ? { ...item, ...row } : item));
      }
      const idx = list.findIndex((item) => item === row || (item.gl_map_no === 0 && item.leg_key === row.leg_key));
      if (idx !== -1) {
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...row };
        return copy;
      }
      return list;
    });
  }

  loadAccounts(): void { 
    this.data.loadAccounts().subscribe({ 
      next: (r) => { if (isSuccess(r) && r.data) this.accounts.set(r.data); } 
    }); 
  }

  load(reselectNo?: number | null): void {
    this.isLoading.set(true);
    this.data.loadMaps().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.backupMap.clear();
          for (const item of res.data) {
            this.backupMap.set(item.gl_map_no, { ...item });
          }
          this.maps.set(res.data);
        }
      },
      error: () => this.toastr.error(this.translate.instant('common.loadFail') || 'Failed to load mappings'),
    });
  }

  saveAll(customRows?: GlMap[]): void {
    const maps = customRows ?? this.maps();
    
    const toSave: { isUpdate: boolean; row: GlMap; payload: any }[] = [];

    for (const row of maps) {
      if (!row.gl_map_no) {
        toSave.push({ isUpdate: false, row, payload: row });
      } else {
        const backup = this.backupMap.get(row.gl_map_no);
        if (this.formUtil.hasChanges(backup, row, IGNORED_GL_MAP_KEYS)) {
          const diffPayload = this.formUtil.getDiffPayload(
            backup,
            row,
            'gl_map_no',
            ['row_version'],
            IGNORED_GL_MAP_KEYS
          );
          toSave.push({ isUpdate: true, row, payload: diffPayload });
        }
      }
    }
    
    if (toSave.length === 0) {
      this.toastr.info(this.translate.instant('common.noChanges') || 'No changes found');
      return;
    }

    const invalid = toSave.find(item => !item.row.event_type || !item.row.leg_key || !item.row.account_no);
    if (invalid) {
      if (!invalid.row.event_type) { this.toastr.warning('Event Type is required'); }
      else if (!invalid.row.leg_key) { this.toastr.warning('Leg Key is required'); }
      else if (!invalid.row.account_no) { this.toastr.warning('GL Account is required'); }
      return;
    }

    this.isSaving.set(true);

    const requests = toSave.map(item => {
      return item.isUpdate ? this.data.update(item.row.gl_map_no, item.payload) : this.data.save(item.payload);
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

  deleteRow(row: GlMap): void {
    if (!row.gl_map_no) {
      this.maps.update(list => list.filter(m => m !== row));
      return;
    }
    
    this.isLoading.set(true);
    this.data.remove(row.gl_map_no).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success(this.translate.instant('common.deleteSuccess') || 'Mapping deleted');
          this.typesFilter(row.gl_map_no);
        } else {
          this.toastr.error(res.message || this.translate.instant('common.deleteFail') || 'Delete failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || this.translate.instant('common.deleteFail') || 'Delete failed'),
    });
  }

  private typesFilter(deletedNo: number): void {
    this.maps.update(list => list.filter(m => m.gl_map_no !== deletedNo));
    this.backupMap.delete(deletedNo);
  }
}

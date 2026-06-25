import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';
import { Fin1006DataService } from './data.service';
import { BaseEntity } from '../../../../../core/models/base-entity.model';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator, SortDirection } from '../../../../../core/utils/paginator';

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

/** State + form for FIN_1006 – GL Account Mapping. */
@Injectable()
export class Fin1006ModelService {
  private data   = inject(Fin1006DataService);
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);

  maps          = signal<GlMap[]>([]);
  accounts      = signal<AccountLite[]>([]);
  isLoading     = signal(false);
  isSaving      = signal(false);
  searchTerm    = signal('');
  eventTypeFilter = signal<string | null>(null);
  selectedNo    = signal<number | null>(null);
  sortDirection = signal<SortDirection>('');

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

  initForm(): void {
    // using inline table editing instead
  }

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
    
    this.maps.update(list => [newRow, ...list]);
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
          this.maps.set(res.data);
        }
      },
      error: () => this.toastr.error('Failed to load mappings'),
    });
  }

  saveAll(): void {
    const maps = this.maps();
    const toSave = maps.filter(m => m.gl_map_no === 0 || (m as any).__dirty);
    
    if (toSave.length === 0) {
      this.toastr.info('No changes to save');
      return;
    }

    const invalid = toSave.find(m => !m.event_type || !m.leg_key || !m.account_no);
    if (invalid) {
      if (!invalid.event_type) { this.toastr.warning('Event Type is required'); }
      else if (!invalid.leg_key) { this.toastr.warning('Leg Key is required'); }
      else if (!invalid.account_no) { this.toastr.warning('GL Account is required'); }
      return;
    }

    this.isSaving.set(true);

    const requests = toSave.map(row => {
      const isUpdate = !!row.gl_map_no;
      return isUpdate ? this.data.update(row.gl_map_no, row) : this.data.save(row);
    });

    forkJoin(requests)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (results) => {
          const hasError = results.some(r => !isSuccess(r));
          if (hasError) {
            this.toastr.error('Some rows failed to save');
          } else {
            this.toastr.success('Saved successfully');
          }
          this.load();
        },
        error: () => this.toastr.error('Failed to save changes')
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
          this.toastr.success('Mapping deleted');
          this.maps.update(list => list.filter(m => m.gl_map_no !== row.gl_map_no));
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: (err) => this.toastr.error(err?.error?.message || 'Delete failed'),
    });
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../../core/models/response.model';
import { makePaginator } from '../../../../../core/utils/paginator';
import { resolvePostReloadSelection } from '../../../../../core/utils/list-selection.utils';
import { ICount, ICountLine, Inv2006DataService, Option } from './data.service';

export const COUNT_TYPES = [
  { value: 1, label: 'Full count' },
  { value: 2, label: 'Cycle count' },
  { value: 3, label: 'Spot check' },
] as const;

export const COUNT_STATUS: Record<number, string> = {
  1: 'Draft', 2: 'Counting', 3: 'Review', 4: 'Posted', 5: 'Cancelled',
};

/**
 * INV_2006 Physical Count.
 *
 * The screen's one job is to make the variance obvious before anyone posts it —
 * a stocktake that silently writes off stock is worse than no stocktake.
 */
@Injectable()
export class Inv2006ModelService {
  private data = inject(Inv2006DataService);
  private toastr = inject(ToastrService);

  sheets = signal<ICount[]>([]);
  warehouses = signal<Option[]>([]);
  current = signal<ICount | null>(null);
  lines = signal<ICountLine[]>([]);
  searchTerm = signal('');

  isLoading = signal(false);
  isSaving = signal(false);
  onlyVariances = signal(false);

  // ── new sheet ─────────────────────────────────────────────────────────────
  newWarehouseNo = signal<number | null>(null);
  newCountType = signal(1);
  newFreezeStock = signal(0);

  readonly isOpen = computed(() => {
    const status = this.current()?.status ?? 0;
    return status === 1 || status === 2 || status === 3;
  });

  filtered = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.sheets();
    const list = term
      ? data.filter(
          (s) =>
            (s.count_id || '').toLowerCase().includes(term) ||
            (s.warehouse_name || '').toLowerCase().includes(term),
        )
      : data;
    return [...list].sort((a, b) => (b.count_no ?? 0) - (a.count_no ?? 0));
  });

  pager = makePaginator<ICount>(this.filtered);

  readonly visibleLines = computed(() =>
    this.onlyVariances() ? this.lines().filter((l) => l.variance_qty !== 0) : this.lines(),
  );

  readonly varianceCount = computed(() => this.lines().filter((l) => l.variance_qty !== 0).length);

  readonly varianceValue = computed(() =>
    this.lines().reduce((sum, l) => sum + (l.counted_qty - l.system_qty) * (l.unit_cost || 0), 0),
  );

  loadWarehouses(): void {
    this.data.warehouseOptions().subscribe((res) => {
      if (isSuccess(res) && res.data) this.warehouses.set(res.data);
    });
  }

  loadList(reselect: number | null = null): void {
    this.isLoading.set(true);
    this.data
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.sheets.set(res.data);
        const resolved = resolvePostReloadSelection(res.data, (s: ICount) => s.count_no, reselect ?? this.current()?.count_no ?? null);
        if (resolved) {
          this.select(resolved.item.count_no);
        } else if (res.data.length > 0 && res.data[0]) {
          this.select(res.data[0].count_no);
        } else {
          this.current.set(null);
          this.lines.set([]);
        }
      });
  }

  select(countNo: number): void {
    this.isLoading.set(true);
    this.data
      .detail(countNo)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (!isSuccess(res) || !res.data) return;
        this.current.set(res.data);
        const lines = (res.data.lines ?? []).map((l) => ({
          ...l,
          variance_qty: l.variance_qty ?? (l.counted_qty - l.system_qty),
          variance_value: l.variance_value ?? ((l.counted_qty - l.system_qty) * (l.unit_cost || 0)),
        }));
        this.lines.set(lines);
      });
  }

  start(): void {
    const warehouseNo = this.newWarehouseNo();
    if (!warehouseNo) {
      this.toastr.warning('Pick a warehouse to count');
      return;
    }

    this.isSaving.set(true);
    this.data
      .start({
        warehouse_no: warehouseNo,
        count_date: new Date().toISOString().substring(0, 10),
        count_type: this.newCountType(),
        freeze_stock: this.newFreezeStock(),
        product_nos: [],
        remarks: null,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (!isSuccess(res) || !res.data) return;
          this.toastr.success(`Sheet ${res.data.count_id} opened with ${res.data.line_count} lines`);
          this.loadList(res.data.count_no);
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not open the count sheet')),
      });
  }

  onLineChange(row: ICountLine): void {
    const counted = Number(row.counted_qty) || 0;
    const variance_qty = counted - row.system_qty;
    const variance_value = variance_qty * (row.unit_cost || 0);
    this.lines.update((ls) =>
      ls.map((l) =>
        l.count_dtl_no === row.count_dtl_no
          ? { ...l, ...row, counted_qty: counted, variance_qty, variance_value }
          : l,
      ),
    );
  }

  saveCounts(): void {
    const sheet = this.current();
    if (!sheet) return;

    this.isSaving.set(true);
    this.data
      .saveCounts(sheet.count_no, this.lines())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (!isSuccess(res) || !res.data) return;
          this.toastr.success('Counts saved');
          this.current.set(res.data);
          const lines = (res.data.lines ?? []).map((l) => ({
            ...l,
            variance_qty: l.variance_qty ?? (l.counted_qty - l.system_qty),
            variance_value: l.variance_value ?? ((l.counted_qty - l.system_qty) * (l.unit_cost || 0)),
          }));
          this.lines.set(lines);
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not save the counts')),
      });
  }

  post(): void {
    const sheet = this.current();
    if (!sheet) return;

    this.isSaving.set(true);
    this.data
      .post(sheet.count_no)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (!isSuccess(res) || !res.data) return;
          const adjustment = res.data.variance_adjustment_no;
          this.toastr.success(adjustment
            ? `Count posted — adjustment #${adjustment} created`
            : 'Count posted — no variance to adjust');
          this.loadList(sheet.count_no);
        },
        error: (err) => this.toastr.error(apiMessage(err, 'Could not post the count')),
      });
  }

  cancel(): void {
    const sheet = this.current();
    if (!sheet) return;

    this.data.cancel(sheet.count_no).subscribe({
      next: () => {
        this.toastr.success('Count cancelled');
        this.loadList(sheet.count_no);
      },
      error: (err) => this.toastr.error(apiMessage(err, 'Could not cancel the count')),
    });
  }

  statusLabel(status: number): string {
    return COUNT_STATUS[status] ?? `#${status}`;
  }
}

function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { error?: { message?: string } })?.error?.message;
  return message?.trim() ? message : fallback;
}

import { Injectable, signal } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

import type { GridRowData } from '../models/grid-types';

/**
 * Row selection for one grid.
 *
 * Selection is exposed as a signal so a form can drive buttons off it declaratively
 * (`[disabled]="!selection.hasSelection()"`) instead of subscribing and mirroring state.
 *
 * Provided per grid instance.
 */
@Injectable()
export class GridSelectionService {
  private api: GridApi | null = null;

  private readonly _selected = signal<GridRowData[]>([]);

  /** Currently selected rows, in the grid's display order. */
  readonly selected = this._selected.asReadonly();

  /** First selected row — the common single-select case. */
  readonly selectedRow = signal<GridRowData | null>(null);

  readonly count = signal(0);

  init(api: GridApi): void {
    this.api = api;
  }

  /** Called by the grid on AG Grid's `selectionChanged`. */
  sync(): void {
    const rows = (this.api?.getSelectedRows() ?? []) as GridRowData[];
    this._selected.set(rows);
    this.selectedRow.set(rows[0] ?? null);
    this.count.set(rows.length);
  }

  hasSelection(): boolean {
    return this.count() > 0;
  }

  clear(): void {
    this.api?.deselectAll();
    this.sync();
  }

  selectAll(): void {
    // Filter-aware on purpose: "select all" while a filter is applied means the rows the user
    // can actually see, not the hidden remainder they would then act on unknowingly.
    this.api?.selectAllFiltered();
    this.sync();
  }
}

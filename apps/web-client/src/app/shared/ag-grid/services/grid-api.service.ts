import { Injectable, signal } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

import type { GridCounts, GridId, GridRowData } from '../models/grid-types';

/**
 * The public handle on a live grid.
 *
 * A form obtains this from `(ready)` and uses it for the few things that are genuinely
 * imperative — refresh, scroll to a row, open a row for editing. Everything declarative
 * (columns, data, height) stays in bindings.
 *
 * Deliberately narrow: exposing AG Grid's `GridApi` directly would let forms reach past the
 * framework, and every such call becomes a migration problem the day AG Grid's API shifts.
 *
 * Provided per grid instance.
 */
@Injectable()
export class GridApiService {
  private api: GridApi | null = null;

  /** Set once the grid is live; guards a form calling in too early. */
  readonly isReady = signal(false);

  /** Total / filtered / selected counts, for the status bar and for form logic. */
  readonly counts = signal<GridCounts>({ total: 0, filtered: 0, selected: 0 });

  gridId: GridId | null = null;

  init(api: GridApi, gridId: GridId): void {
    this.api = api;
    this.gridId = gridId;
    this.isReady.set(true);
  }

  destroy(): void {
    this.api = null;
    this.isReady.set(false);
  }

  /**
   * Escape hatch to the raw AG Grid API.
   *
   * Present because no wrapper can anticipate everything, but every call site is a place the
   * framework is not doing its job — prefer adding a method here over reaching through it.
   */
  raw(): GridApi | null {
    return this.api;
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  /** Recomputes counts. Called on data, filter and selection changes. */
  syncCounts(selected: number): void {
    if (!this.api) return;

    let filtered = 0;
    this.api.forEachNodeAfterFilter(() => filtered++);

    let total = 0;
    this.api.forEachNode(() => total++);

    this.counts.set({ total, filtered, selected });
  }

  // ── Common operations ──────────────────────────────────────────────────────

  refreshCells(): void {
    this.api?.refreshCells({ force: true });
  }

  /** Scrolls a row into view by its row-id value. Does nothing if the row is not loaded. */
  scrollTo(rowId: string): void {
    const node = this.api?.getRowNode(rowId);
    if (node?.rowIndex != null) this.api?.ensureIndexVisible(node.rowIndex);
  }

  /** Opens a row for editing on its first editable column. */
  startEdit(rowId: string): void {
    const node = this.api?.getRowNode(rowId);
    if (node?.rowIndex == null) return;

    const firstEditable = this.api
      ?.getColumnDefs()
      ?.find((def) => (def as { editable?: unknown }).editable);

    this.api?.startEditingCell({
      rowIndex: node.rowIndex,
      colKey: (firstEditable as { colId?: string })?.colId ?? '',
    });
  }

  stopEdit(cancel = false): void {
    this.api?.stopEditing(cancel);
  }

  /** Appends a row and returns it, so the caller can seed and then edit it. */
  addRow(row: GridRowData): GridRowData {
    this.api?.applyTransaction({ add: [row] });
    return row;
  }

  removeRow(row: GridRowData): void {
    this.api?.applyTransaction({ remove: [row] });
  }

  setLoading(loading: boolean): void {
    this.api?.setGridOption('loading', loading);
  }
}

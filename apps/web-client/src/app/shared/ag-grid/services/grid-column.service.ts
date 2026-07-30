import { Injectable, signal } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

import { GRID_INTERNAL_COLUMNS } from '../constants/grid-defaults';
import type { GridColumn } from '../models/grid-types';

/** A column as the chooser sees it. */
export interface GridColumnToggle {
  field: string;
  title: string;
  visible: boolean;
}

/**
 * Column visibility, sizing and layout for one grid.
 *
 * Backs the column chooser and the auto-fit / reset actions. Internal columns (the `#` counter)
 * are filtered out of everything user-facing — offering to hide the row number is noise, and
 * letting it be reordered breaks the "always first" contract.
 *
 * Provided per grid instance.
 */
@Injectable()
export class GridColumnService {
  private api: GridApi | null = null;
  private columns: GridColumn[] = [];

  /** Toggle list for the chooser, kept in sync with the grid. */
  readonly toggles = signal<GridColumnToggle[]>([]);

  init(api: GridApi, columns: GridColumn[]): void {
    this.api = api;
    this.columns = columns;
    this.sync();
  }

  /** Refreshes the chooser after any visibility change, wherever it originated. */
  sync(): void {
    if (!this.api) return;

    const state = this.api.getColumnState();

    this.toggles.set(
      state
        .filter((s) => !isInternal(s.colId))
        .map((s) => ({
          field: s.colId,
          title: this.columns.find((c) => c.field === s.colId)?.title ?? s.colId,
          visible: !s.hide,
        })),
    );
  }

  setVisible(field: string, visible: boolean): void {
    this.api?.setColumnsVisible([field], visible);
    this.sync();
  }

  toggle(field: string): void {
    const current = this.toggles().find((t) => t.field === field);
    this.setVisible(field, !current?.visible);
  }

  showAll(): void {
    this.api?.setColumnsVisible(
      this.columns.map((c) => c.field),
      true,
    );
    this.sync();
  }

  /**
   * Widens columns to fill the viewport.
   *
   * `sizeColumnsToFit` distributes the available width; `autoSizeAllColumns` sizes to content
   * and can leave a large gap or overflow. Filling reads better in an ERP list, where a ragged
   * right edge looks broken.
   */
  autoFit(): void {
    this.api?.sizeColumnsToFit();
  }

  /** Sizes each column to its widest cell — useful when content matters more than filling. */
  autoSizeToContent(): void {
    if (!this.api) return;
    const ids = this.api
      .getColumnState()
      .map((s) => s.colId)
      .filter((id) => !isInternal(id));
    this.api.autoSizeColumns(ids);
  }

  /** Returns columns to their declared widths, order and visibility. */
  resetLayout(): void {
    this.api?.resetColumnState();
    this.sync();
  }
}

function isInternal(colId: string): boolean {
  return (Object.values(GRID_INTERNAL_COLUMNS) as string[]).includes(colId);
}

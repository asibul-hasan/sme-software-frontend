import { Injectable, InjectionToken, inject } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

import { GRID_STATE_VERSION, gridStateStorageKey } from '../constants/grid-defaults';
import type { GridDensity } from '../enums/grid-enums';
import type { GridId, GridPersistedState, GridStatePersistence } from '../models/grid-types';

/**
 * Where grid preferences live.
 *
 * Defaults to localStorage. Override the token to move preferences server-side (so a user's
 * layout follows them between machines) without touching the grid or a single form:
 *
 * ```ts
 * { provide: GRID_STATE_PERSISTENCE, useClass: ServerGridStateStore }
 * ```
 */
export const GRID_STATE_PERSISTENCE = new InjectionToken<GridStatePersistence>(
  'GRID_STATE_PERSISTENCE',
  {
    providedIn: 'root',
    factory: () => new LocalStorageGridState(),
  },
);

/** Default persistence: per-browser, keyed by {@link GridId}. */
export class LocalStorageGridState implements GridStatePersistence {
  load(gridId: GridId): GridPersistedState | null {
    try {
      const raw = localStorage.getItem(gridStateStorageKey(gridId));
      if (!raw) return null;

      const parsed = JSON.parse(raw) as GridPersistedState;

      // A layout saved against an older schema may reference columns that no longer exist.
      // Discarding it costs the user their customisation once; applying it can leave a grid
      // with missing or duplicated columns and no obvious way back.
      if (parsed?.version !== GRID_STATE_VERSION) {
        this.clear(gridId);
        return null;
      }

      return parsed;
    } catch {
      // Corrupt or unreadable (private mode, quota, hand-edited) — behave as if unsaved.
      return null;
    }
  }

  save(gridId: GridId, state: GridPersistedState): void {
    try {
      localStorage.setItem(gridStateStorageKey(gridId), JSON.stringify(state));
    } catch {
      // Storage full or blocked. A lost layout preference must never break the grid.
    }
  }

  clear(gridId: GridId): void {
    try {
      localStorage.removeItem(gridStateStorageKey(gridId));
    } catch {
      /* nothing useful to do */
    }
  }
}

/** What {@link GridStateService.restore} applied, and what the grid must apply itself. */
export interface GridRestoreResult {
  density: GridDensity | null;
  pageSize: number | null;
  columnsRestored: boolean;
}

/**
 * Saves and restores one grid's layout: column widths, order, visibility, pinning, sort,
 * filters, density and page size.
 *
 * Provided per grid instance (not in root) so two grids on the same screen never share state —
 * SYS1108 alone has three.
 */
@Injectable()
export class GridStateService {
  private readonly store = inject(GRID_STATE_PERSISTENCE);

  private gridId: GridId | null = null;
  private api: GridApi | null = null;
  private enabled = true;

  /** Non-column preferences, which AG Grid does not own. */
  private density: GridDensity | null = null;
  private pageSize: number | null = null;

  init(gridId: GridId, api: GridApi, enabled: boolean): void {
    this.gridId = gridId;
    this.api = api;
    this.enabled = enabled;
  }

  /**
   * Applies any saved layout and reports what the grid must still apply itself.
   *
   * `columnsRestored` matters: a restored layout must not then be overwritten by the initial
   * auto-fit pass, or the user's column widths silently revert on every visit.
   */
  restore(): GridRestoreResult {
    const none: GridRestoreResult = { density: null, pageSize: null, columnsRestored: false };
    if (!this.enabled || !this.gridId || !this.api) return none;

    const saved = this.store.load(this.gridId);
    if (!saved) return none;

    if (Array.isArray(saved.columns) && saved.columns.length) {
      // `applyOrder` matters: without it a restored layout keeps the declared order and only
      // widths/visibility come back, which reads as a half-applied restore.
      this.api.applyColumnState({ state: saved.columns as never, applyOrder: true });
    }

    if (saved.filters) this.api.setFilterModel(saved.filters as never);

    this.density = saved.density;
    this.pageSize = saved.pageSize;

    return {
      density: saved.density,
      pageSize: saved.pageSize,
      columnsRestored: Array.isArray(saved.columns) && saved.columns.length > 0,
    };
  }

  /** Captures the current layout. Cheap enough to call on every column/sort/filter change. */
  save(): void {
    if (!this.enabled || !this.gridId || !this.api) return;

    this.store.save(this.gridId, {
      version: GRID_STATE_VERSION,
      columns: this.api.getColumnState(),
      filters: this.api.getFilterModel() as Record<string, unknown>,
      density: this.density,
      pageSize: this.pageSize,
    });
  }

  setDensity(density: GridDensity): void {
    this.density = density;
    this.save();
  }

  setPageSize(size: number): void {
    this.pageSize = size;
    this.save();
  }

  /**
   * Returns the grid to its declared layout and forgets the saved one.
   *
   * Both halves matter: resetting the live grid without clearing storage means the old layout
   * returns on the next visit, which looks like the reset silently failed.
   */
  reset(): void {
    if (!this.gridId || !this.api) return;

    this.api.resetColumnState();
    this.api.setFilterModel(null);
    this.density = null;
    this.pageSize = null;
    this.store.clear(this.gridId);
  }
}

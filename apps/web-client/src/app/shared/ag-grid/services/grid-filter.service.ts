import { Injectable, signal } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

/**
 * Quick search and column filters for one grid.
 *
 * Quick search runs through AG Grid's `quickFilterText`, which matches against each column's
 * quick-filter text — and the column factory points that at the *logical* value. So searching
 * "Approved" finds rows whose stored value is `3`, which is the whole point of having a
 * resolved value in the first place.
 *
 * Provided per grid instance.
 */
@Injectable()
export class GridFilterService {
  private api: GridApi | null = null;

  readonly searchText = signal('');

  /** True when a quick search or any column filter is narrowing the view. */
  readonly hasActiveFilters = signal(false);

  init(api: GridApi): void {
    this.api = api;
  }

  search(text: string): void {
    this.searchText.set(text);
    this.api?.setGridOption('quickFilterText', text);
    this.syncActive();
  }

  clearSearch(): void {
    this.search('');
  }

  /** Clears the quick search and every column filter in one action. */
  clearAll(): void {
    this.searchText.set('');
    this.api?.setGridOption('quickFilterText', '');
    this.api?.setFilterModel(null);
    this.syncActive();
  }

  /** Called on AG Grid's `filterChanged`, so column filters count too. */
  syncActive(): void {
    const model = this.api?.getFilterModel() ?? {};
    this.hasActiveFilters.set(!!this.searchText() || Object.keys(model).length > 0);
  }
}

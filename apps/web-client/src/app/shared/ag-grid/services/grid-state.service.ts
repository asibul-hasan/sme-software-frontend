import { Injectable } from '@angular/core';
import { ColumnState, GridApi } from 'ag-grid-community';

@Injectable({ providedIn: 'root' })
export class GridStateService {
  private getStorageKey(gridKey: string): string {
    return `aidly_grid_state_${gridKey}`;
  }

  saveState(gridKey: string, api: GridApi): void {
    if (!gridKey || !api) return;
    try {
      const state = api.getColumnState();
      localStorage.setItem(this.getStorageKey(gridKey), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  restoreState(gridKey: string, api: GridApi): void {
    if (!gridKey || !api) return;
    try {
      const saved = localStorage.getItem(this.getStorageKey(gridKey));
      if (saved) {
        const state: ColumnState[] = JSON.parse(saved);
        api.applyColumnState({ state, applyOrder: true });
      }
    } catch {
      /* ignore */
    }
  }

  resetState(gridKey: string, api: GridApi): void {
    if (!gridKey || !api) return;
    localStorage.removeItem(this.getStorageKey(gridKey));
    api.resetColumnState();
  }
}

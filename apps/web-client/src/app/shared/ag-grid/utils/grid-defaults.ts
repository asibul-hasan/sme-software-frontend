import { GridOptions, GetRowIdParams } from 'ag-grid-community';
import { GridDensity } from '../models/grid-config.model';

/**
 * Header / row heights per density. ERP grids are dense by default — an operator
 * scanning line items wants rows on screen, not padding.
 */
export const GRID_DENSITY_HEIGHTS: Record<GridDensity, { headerHeight: number; rowHeight: number }> = {
  compact: { headerHeight: 30, rowHeight: 26 },
  comfortable: { headerHeight: 34, rowHeight: 30 },
  spacious: { headerHeight: 42, rowHeight: 38 },
};

export const DEFAULT_GRID_DENSITY: GridDensity = 'comfortable';

export const DEFAULT_ERP_GRID_OPTIONS: GridOptions = {
  ...GRID_DENSITY_HEIGHTS[DEFAULT_GRID_DENSITY],
  getRowId: (params: GetRowIdParams) => params.data?.__uid ?? String(params.data?.id ?? Math.random()),
  rowSelection: {
    mode: 'multiRow',
    headerCheckbox: true,
    checkboxes: true,
    // SINGLE CLICK SELECTS THE ROW. Several forms drive a child grid off the
    // selected parent row, so selection must not require hitting the checkbox.
    enableClickSelection: true,
    // Plain click replaces the selection; ctrl/shift still extend it.
    enableSelectionWithoutKeys: false,
  },
  // DOUBLE CLICK EDITS, and it opens the WHOLE row — a line item is one
  // transaction, not a set of independent cells.
  singleClickEdit: false,
  editType: 'fullRow',
  animateRows: true,
  // Off deliberately: text selection swallows the double-click that starts editing.
  enableCellTextSelection: false,
  suppressCellFocus: false,
  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 20,
  stopEditingWhenCellsLoseFocus: true,
  // Our own pager lives in the status bar; AG Grid's built-in panel is suppressed.
  pagination: false,
  suppressPaginationPanel: true,
  tabToNextCell: (params) => {
    return params.nextCellPosition || false;
  },
};

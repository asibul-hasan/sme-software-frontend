import type { AgGridConfig, GridId, GridToolbarConfig } from '../models/grid-types';

/**
 * Framework-wide defaults.
 *
 * A form should have to state only what makes it different. Everything here is chosen so the
 * common case — "show me these rows" — needs no configuration at all.
 */

/** ERP lists are long; 50 balances scroll length against render cost. */
export const GRID_DEFAULT_PAGE_SIZE = 50;

export const GRID_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

/**
 * Fallback height, used only when a form gives the component no `[height]`.
 *
 * Height is deliberately a per-screen decision — a grid in a split card and a grid on a full
 * page want different sizes, and a framework cannot know which it is in. But a grid with no
 * height at all renders invisible, so this keeps a forgotten input from looking like a bug.
 */
export const GRID_FALLBACK_HEIGHT = '480px';

/** Layout state schema version. Bump to invalidate every saved layout after a breaking change. */
export const GRID_STATE_VERSION = 1;

/** localStorage namespace. One prefix so grid state is greppable and clearable in bulk. */
export const GRID_STATE_STORAGE_PREFIX = 'aidly.grid.v1';

export const gridStateStorageKey = (gridId: GridId): string =>
  `${GRID_STATE_STORAGE_PREFIX}.${gridId}`;

/** Toolbar: useful things on, destructive/rare things off. */
export const GRID_DEFAULT_TOOLBAR: Required<Omit<GridToolbarConfig, 'title'>> = {
  enabled: true,
  search: true,
  refresh: true,
  exportExcel: true,
  exportCsv: true,
  print: true,
  columnChooser: true,
  autoFit: true,
  resetLayout: true,
  density: true,
  fullScreen: true,
};

/**
 * Defaults merged under every builder result. `gridId` and `columns` are absent on purpose —
 * they have no sensible default and the builder requires both.
 */
export const GRID_DEFAULT_CONFIG: Omit<AgGridConfig, 'gridId' | 'columns'> = {
  pagination: true,
  pageSize: GRID_DEFAULT_PAGE_SIZE,
  pageSizeOptions: GRID_PAGE_SIZE_OPTIONS,

  selectionMode: 'single',

  defaultHeight: GRID_FALLBACK_HEIGHT,
  density: 'comfortable',
  autoFitColumns: true,

  showRowNumbers: true,
  statusBar: true,
  toolbar: GRID_DEFAULT_TOOLBAR,
  persistState: true,
  suppressMovable: false,

  editable: false,
};

/** Internal column ids. Prefixed so they can never collide with a backend field name. */
export const GRID_INTERNAL_COLUMNS = {
  rowNumber: '__row_no',
  selection: '__select',
  actions: '__actions',
} as const;

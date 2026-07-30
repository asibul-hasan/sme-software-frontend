import type { TemplateRef } from '@angular/core';
import type { GridDensity, GridExportFormat, GridSelectionMode } from '../enums/grid-enums';

/**
 * Unique, stable identity of a grid instance — `{MODULE}_{ENTITY}_GRID`.
 *
 * Everything persisted (column layout, filters, sort, preferences) is keyed off this id,
 * never off a component name: components get renamed, moved and reused, and each of those
 * would silently orphan the user's saved layout. The `_GRID` suffix is enforced by the
 * type so an id can't be confused with any other storage key.
 *
 * Examples: `INV_ITEM_GRID`, `PURCHASE_ORDER_GRID`, `SYS_APPROVAL_SCOPE_GRID`.
 */
export type GridId = `${string}_GRID`;

/** One row. Field names are the backend DTO's snake_case names — the single data contract. */
export type GridRowData = Record<string, unknown>;

/** Option for a select column: displays `label`, stores `value` (the code the backend persists). */
export interface GridSelectOption {
  value: unknown;
  label: string;
}

/** Cell renderers available without writing a component. */
export type GridCellType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'select'
  | 'badge'
  | 'template';

export interface GridBadge {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
}

/**
 * Column definition — the only column vocabulary forms use. AG Grid's `ColDef` never leaks
 * into a form; the mapping lives in one place (`utils/column-factory.ts`) so grid behaviour
 * is defined once, not re-invented per screen.
 */
export interface GridColumn {
  /** Backend DTO field, snake_case. Search, sort, export and editing all key off it. */
  field: string;
  title: string;
  cellType?: GridCellType;

  // ── Sizing ────────────────────────────────────────────────────────────────
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;

  // ── Behaviour ─────────────────────────────────────────────────────────────
  sortable?: boolean;
  /** Per-column filter (quick search always works regardless). */
  filter?: boolean;
  resizable?: boolean;
  hidden?: boolean;
  pinned?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  editable?: boolean | ((row: GridRowData) => boolean);
  /** Fired when an editable cell commits. */
  onChange?: (value: unknown, row: GridRowData, column: GridColumn) => void;

  // ── Display ───────────────────────────────────────────────────────────────
  /**
   * Logical value accessor — what search, sort and export operate on when the display
   * differs from `row[field]`.
   *
   * Do NOT set this on `select` columns: the grid already resolves the stored code to its
   * option label, and on a read-only column an accessor would replace the stored value.
   */
  value?: (row: GridRowData) => unknown;
  /** `date`/`datetime` display format (dayjs tokens). */
  dateFormat?: string;
  /** Decimal places for numeric types; defaults to the app-wide setting. */
  precision?: number;
  /** Options for a `select` column. A function re-reads per row, so lookups can be reactive. */
  options?: GridSelectOption[] | ((row: GridRowData) => GridSelectOption[]);
  badge?: (value: unknown, row: GridRowData) => GridBadge | null;
  /** Template name registered via `*appGridCell="'name'"` for `cellType: 'template'`. */
  templateName?: string;
  /** Sum the column into the pinned footer row. */
  footerSum?: boolean;
  /** Static footer text (e.g. `'Total'`) or a computed footer value over the visible rows. */
  footer?: string | ((rows: GridRowData[]) => unknown);
  tooltip?: string;
  excludeFromExport?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────────────────────

/** Built-in toolbar actions. Each is a boolean switch; all default sensibly. */
export interface GridToolbarConfig {
  enabled?: boolean;
  title?: string;
  search?: boolean;
  refresh?: boolean;
  exportExcel?: boolean;
  exportCsv?: boolean;
  print?: boolean;
  columnChooser?: boolean;
  autoFit?: boolean;
  resetLayout?: boolean;
  density?: boolean;
  fullScreen?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full grid configuration. Produced by {@link GridBuilder} — forms should not assemble this
 * literal by hand, the builder is the API and validates the parts that matter.
 *
 * Deliberately does NOT carry row data. Config is static; data is reactive and flows through
 * the component's `[data]` input so changing rows never rebuilds the grid.
 */
export interface AgGridConfig {
  /** See {@link GridId}. Mandatory — state persistence and diagnostics key off it. */
  readonly gridId: GridId;
  columns: GridColumn[];

  // ── Paging ────────────────────────────────────────────────────────────────
  pagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];

  // ── Selection ─────────────────────────────────────────────────────────────
  selectionMode: GridSelectionMode;
  /** Stable row identity (field name). Keeps selection across refreshes; strongly recommended. */
  rowIdField?: string;

  // ── Layout ────────────────────────────────────────────────────────────────
  /**
   * Height is per-screen, set via the component's `[height]` input rather than here,
   * so one config can serve differently-sized placements. This value is only the
   * fallback when the input is absent.
   */
  defaultHeight: string;
  density: GridDensity;
  /** Stretch columns to fill the viewport width on first render. */
  autoFitColumns: boolean;

  // ── Features ──────────────────────────────────────────────────────────────
  showRowNumbers: boolean;
  statusBar: boolean;
  toolbar: GridToolbarConfig;
  /** Persist column layout / sort / filters under the gridId and restore on init. */
  persistState: boolean;
  suppressMovable: boolean;

  // ── Editing ───────────────────────────────────────────────────────────────
  editable: boolean;
  /** Row-wide recalculation hook, run after any cell of the row commits. */
  recalculate?: (row: GridRowData) => void;
  newRowDefaults?: () => GridRowData;

  // ── Reserved (AG Grid Enterprise; typed now so adoption is a flag, not a rewrite) ──
  /** Requires AG Grid Enterprise. Ignored under the Community build. */
  grouping?: never;
  /** Requires AG Grid Enterprise. Ignored under the Community build. */
  treeData?: never;
  /** Requires AG Grid Enterprise. Ignored under the Community build. */
  masterDetail?: never;
}

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────

/** Everything the grid persists per {@link GridId}. */
export interface GridPersistedState {
  version: number;
  /** AG Grid `ColumnState[]` — width, order, visibility, pin, sort. */
  columns: unknown[];
  filters: Record<string, unknown> | null;
  density: GridDensity | null;
  pageSize: number | null;
}

/**
 * Pluggable persistence. Default is localStorage; swap the injection token to move grid
 * preferences server-side without touching the grid.
 */
export interface GridStatePersistence {
  load(gridId: GridId): GridPersistedState | null;
  save(gridId: GridId, state: GridPersistedState): void;
  clear(gridId: GridId): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────

export interface GridCellEdit {
  row: GridRowData;
  column: GridColumn;
  oldValue: unknown;
  newValue: unknown;
}

/** Counters the status bar displays. */
export interface GridCounts {
  total: number;
  filtered: number;
  selected: number;
}

/** A named cell template collected from content projection. */
export interface GridCellTemplate {
  name: string;
  template: TemplateRef<unknown>;
}

export type { GridExportFormat };

import { TemplateRef } from '@angular/core';
import type { ColDef, GridApi, GridOptions, IRowNode } from 'ag-grid-community';

/**
 * Public contract for `<app-data-grid>` — the AG Grid based ERP grid.
 *
 * <p>The vocabulary deliberately mirrors the legacy `ColumnDef` / `TableConfig`
 * (`title`, `field`, `cellType`, `align`, `pin`, `badgeConfig`, `value`, …) so a
 * developer who knows `<app-common-table>` already knows this, and so migrating a
 * form later is a mechanical rename rather than a rewrite. Anything the wrapper
 * does not model is reachable through the {@link GridColumnDef.agOptions} /
 * {@link GridConfig.agOptions} escape hatches — the wrapper never blocks AG Grid.</p>
 */

// ─── Row shape ────────────────────────────────────────────────────────────────
/** A grid row. Rows are plain API DTOs (snake_case fields), never view models. */
export type GridRow = Record<string, unknown>;

// ─── Cell types ───────────────────────────────────────────────────────────────
/**
 * Rendering contract for a column. Matches the legacy table's `CellType` list so
 * column definitions port across unchanged.
 */
export type GridCellType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'select'
  | 'checkbox'
  | 'badge'
  | 'icon'
  | 'button'
  | 'actions'
  /** Single red ✕ that removes the row (line-item grids). */
  | 'delete'
  | 'serial'
  | 'custom-template';

export type GridPinDirection = 'left' | 'right' | null;

export type GridBadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface GridBadgeConfig {
  label: string;
  variant: GridBadgeVariant;
  solid?: boolean;
}

export interface GridSelectOption {
  label: string;
  value: unknown;
}

// ─── Column definition ────────────────────────────────────────────────────────
export interface GridColumnDef {
  /** Header text. */
  title: string;
  /** Row field (snake_case, matching the backend DTO). */
  field: string;

  /** Rendering type. Defaults to `'text'`. */
  cellType?: GridCellType;

  /**
   * Logical value accessor for SEARCH, SORT and EXPORT when the displayed value
   * cannot be read straight from `row[field]` — e.g. an id column that renders a
   * looked-up label. Return the human-readable value.
   *
   * <p>Same rule as the legacy table: any column whose display differs from
   * `row[field]` MUST set this, or quick-search and exports operate on raw ids.</p>
   */
  value?: (row: GridRow) => unknown;

  // Layout
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Take the remaining horizontal space (AG Grid `flex`). */
  flex?: number;
  align?: 'left' | 'center' | 'right';
  pin?: GridPinDirection;
  /** Drag-to-resize. Defaults to the grid-level `resizableColumns`. */
  resizable?: boolean;
  /** Allow drag-to-reorder this column. Defaults to the grid-level setting. */
  movable?: boolean;
  /** Wrap long text onto multiple lines instead of truncating. */
  wrapText?: boolean;

  // Behaviour
  sortable?: boolean;
  /** Column filter. `true` uses the type-appropriate default filter. */
  filter?: boolean;
  /** Hidden by default (still listed in the column-visibility menu). */
  hidden?: boolean;
  /** Exclude from the column-visibility menu (always visible). */
  lockVisible?: boolean;
  /** Exclude from exports. */
  excludeFromExport?: boolean;

  // Editing
  editable?: boolean | ((row: GridRow) => boolean);
  onChange?: (value: unknown, row: GridRow, column: GridColumnDef) => void;

  /**
   * Marks this column as DERIVED — its value is calculated from the rest of the
   * row (line total = qty × rate). A computed column is never editable and is
   * recalculated automatically after every edit.
   *
   * <p>For cascades that touch several fields at once (total → discount → net →
   * VAT), prefer the row-level {@link GridConfig.recalculate} hook instead.</p>
   */
  compute?: (row: GridRow) => unknown;

  // Type-specific
  dateFormat?: string;
  /** Decimal places. Omit on `currency`/`decimal` to use the app currency precision. */
  precision?: number;
  options?: GridSelectOption[] | ((row: GridRow) => GridSelectOption[]);
  badgeConfig?: (value: unknown, row: GridRow) => GridBadgeConfig | null;
  iconConfig?: (value: unknown, row: GridRow) => { icon: string; color?: string; tooltip?: string } | null;
  /** Row actions rendered in this column (`cellType: 'actions'`). */
  actions?: GridRowAction[];
  customTemplate?: TemplateRef<unknown>;

  // Footer (pinned bottom row)
  /** Sum this numeric column into the pinned bottom row. */
  bottomTotal?: boolean;
  /** Static label in the pinned bottom row (e.g. `'Total'`). */
  footerLabel?: string;
  /** Computed pinned-bottom value from the currently visible rows. */
  footerValue?: (rows: GridRow[]) => unknown;

  tooltip?: string;
  headerClass?: string;
  cellClass?: string;

  /** Raw AG Grid `ColDef` overrides — merged last, always wins. */
  agOptions?: Partial<ColDef>;
}

// ─── Row actions ──────────────────────────────────────────────────────────────
/**
 * A per-row action. `kind` pulls the standard icon/label/tooltip/variant from the
 * shared ERP action catalog so Edit looks like Edit in every module; anything set
 * explicitly here overrides the catalog entry.
 */
export interface GridRowAction {
  kind: ErpActionKind | 'custom';
  /** Overrides the catalog label. */
  label?: string;
  /** Overrides the catalog icon. */
  icon?: string;
  tooltip?: string;
  variant?: ErpActionVariant;
  visible?: (row: GridRow) => boolean;
  disabled?: (row: GridRow) => boolean;
  /** Ask for confirmation before running. `true` uses the catalog default copy. */
  confirm?: boolean | { title?: string; message?: string; tone?: 'primary' | 'warn' | 'danger' };
  onClick: (row: GridRow) => void;
}

// ─── Standard ERP actions ─────────────────────────────────────────────────────
/**
 * The canonical ERP action vocabulary. Every button in the app should name one of
 * these rather than re-inventing an icon/label pair, so Approve/Reject/Post/Delete
 * read identically in FIN, HRM, INV and SAL.
 */
export type ErpActionKind =
  | 'add'
  | 'edit'
  | 'view'
  | 'delete'
  | 'save'
  | 'update'
  | 'cancel'
  | 'submit'
  | 'approve'
  | 'reject'
  | 'print'
  | 'export'
  | 'import'
  | 'refresh'
  | 'search'
  | 'filter'
  | 'reset'
  | 'download'
  | 'duplicate'
  | 'post'
  | 'close';

export type ErpActionVariant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'secondary'
  | 'ghost';

// ─── Bulk actions ─────────────────────────────────────────────────────────────
/** A toolbar action that operates on the checked rows. */
export interface GridBulkAction {
  kind: ErpActionKind | 'custom';
  label?: string;
  icon?: string;
  variant?: ErpActionVariant;
  /** Minimum checked rows before the action enables. Defaults to 1. */
  minSelection?: number;
  disabled?: (rows: GridRow[]) => boolean;
  confirm?: boolean | { title?: string; message?: string; tone?: 'primary' | 'warn' | 'danger' };
  onClick: (rows: GridRow[]) => void;
}

// ─── Export ───────────────────────────────────────────────────────────────────
export type GridExportFormat = 'excel' | 'csv' | 'pdf' | 'print';

// ─── Grid configuration ───────────────────────────────────────────────────────
export interface GridConfig {
  // Toolbar
  /** Toolbar title. Omit when the surrounding card header already names the grid. */
  title?: string;
  showToolbar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showExport?: boolean;
  exportFormats?: GridExportFormat[];
  /** Base filename for exports (no extension). Defaults to the title or `'export'`. */
  exportFileName?: string;
  showColumnToggle?: boolean;
  showRefresh?: boolean;
  /** Show the "clear filters/search" control. */
  showClearFilters?: boolean;

  // Selection
  /** Checkbox selection. `'single'` radio-style, `'multiple'` with a header check-all. */
  selection?: 'none' | 'single' | 'multiple';
  bulkActions?: GridBulkAction[];
  /**
   * Single click selects (and highlights) a row. Defaults to ON for editable
   * grids — where click = select and double-click = edit — and OFF for read-only
   * master-detail lists, where a click already means "open this record".
   */
  clickToSelect?: boolean;

  // ── Editing ────────────────────────────────────────────────────────────────
  /**
   * Turns the grid into an editable line-item grid: double-click a row to edit,
   * `Enter`/click-away to commit, `Esc` to cancel.
   */
  editable?: boolean;

  /**
   * `'fullRow'` (default) — double-clicking any editable cell opens the WHOLE row
   * for editing; read-only columns stay read-only within it. Derived values settle
   * when the row is committed.
   *
   * `'cell'` — edits one cell at a time. Choose this when calculations must update
   * the instant a field is left, since each cell commits on its own.
   */
  editMode?: 'fullRow' | 'cell';

  /**
   * Row recalculation — the ERP calculation hook. Runs after every committed edit
   * and on every newly added row, BEFORE the row is written back to the grid.
   * Mutate the row in place.
   *
   * ```ts
   * recalculate: (row) => {
   *   const gross = Number(row['qty'] || 0) * Number(row['rate'] || 0);
   *   row['amount'] = gross - Number(row['discount'] || 0);
   *   row['vat']    = row['amount'] * 0.15;
   *   row['total']  = row['amount'] + row['vat'];
   * }
   * ```
   */
  recalculate?: (row: GridRow) => void;

  /** Values applied to a row created by the toolbar Add button / `addRow()`. */
  newRowDefaults?: () => GridRow;

  /** Show the toolbar Add-row button (implied by `editable`). */
  showAdd?: boolean;

  /**
   * Append the red ✕ delete column. Clicking it HIDES the row immediately and
   * records it as a pending deletion; nothing is destroyed until the caller
   * persists {@link GridChanges}. Implied by `editable`.
   */
  showDelete?: boolean;

  /** Confirm before hiding a row with the ✕. Off by default — deletion is undoable. */
  confirmDelete?: boolean;

  // Numbering
  /** Prepend the serial-number (`#`) column. See {@link GridConfig.serialTitle}. */
  showSerial?: boolean;
  serialTitle?: string;
  /**
   * `'continuous'` numbers across pages (page 2 starts at 11) — the ERP default.
   * `'per-page'` restarts at 1 on each page.
   */
  serialMode?: 'continuous' | 'per-page';

  // Paging & sizing
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Row height in px. Defaults to the dense/normal preset. */
  rowHeight?: number;
  headerHeight?: number;
  dense?: boolean;
  striped?: boolean;
  /**
   * Grid height. Defaults to `'auto'`, which sizes to the row count up to
   * `maxAutoHeight`. Pass `'100%'` inside a flex-filled card (see CLAUDE.md —
   * never viewport math).
   */
  height?: string;
  maxAutoHeight?: string;

  // Columns
  resizableColumns?: boolean;
  movableColumns?: boolean;
  /** Per-column filter row/menu. */
  columnFilters?: boolean;
  /** Auto-fit columns to the grid width on first render. */
  autoSizeColumns?: boolean;

  // State
  loading?: boolean;
  /** Error message; when set the grid shows its error state instead of rows. */
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: string;

  // Identity
  /**
   * Stable row identity — a field name or accessor. Strongly recommended: it keeps
   * selection, sort position and edit state stable across refreshes.
   */
  rowKey?: string | ((row: GridRow) => unknown);

  /**
   * Persist column widths/order/visibility under this key (localStorage).
   * Omit to disable persistence.
   */
  stateKey?: string;

  /** Raw AG Grid `GridOptions` overrides — merged last, always wins. */
  agOptions?: Partial<GridOptions>;
}

// ─── Events ───────────────────────────────────────────────────────────────────
export interface GridCellChange {
  row: GridRow;
  field: string;
  value: unknown;
  previousValue: unknown;
}

/**
 * Everything the grid has pending, for the form's Save handler.
 *
 * <p>The grid never talks to an API itself — it records intent and the owning form
 * persists it. That keeps the save in ONE place (the form's existing save flow,
 * with its validation and toasts) instead of splitting writes across components.</p>
 */
export interface GridChanges {
  /** Rows created in the grid and not yet persisted. */
  added: GridRow[];
  /** Existing rows whose values were edited. */
  updated: GridRow[];
  /** Rows the user removed with the ✕ — hidden, but not yet deleted anywhere. */
  deleted: GridRow[];
  /** True when anything is pending — wire this to the Save button's enabled state. */
  dirty: boolean;
}

/** Imperative handle emitted by `(gridReady)` for callers that need direct control. */
export interface GridReadyEvent {
  api: GridApi;
  /** Re-run the pinned bottom (totals) row — call after mutating rows in place. */
  refreshFooter: () => void;
  /** Append a row and open it for editing. */
  addRow: (seed?: GridRow) => void;
  /**
   * Start editing a row that already exists in the grid (added via `[data]` binding).
   * Pass the row's `rowKey` value. Opens the first editable column.
   */
  startEdit: (rowKeyValue: unknown) => void;
  /** Pending adds / updates / deletes. */
  getChanges: () => GridChanges;
  /** Forget all pending changes and un-hide deleted rows (call after a successful save). */
  resetChanges: () => void;
}

export type GridNode = IRowNode<GridRow>;

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_GRID_CONFIG: Required<
  Pick<
    GridConfig,
    | 'showToolbar'
    | 'showSearch'
    | 'searchPlaceholder'
    | 'showExport'
    | 'exportFormats'
    | 'showColumnToggle'
    | 'showRefresh'
    | 'showClearFilters'
    | 'selection'
    | 'showSerial'
    | 'serialTitle'
    | 'serialMode'
    | 'pagination'
    | 'pageSize'
    | 'pageSizeOptions'
    | 'dense'
    | 'striped'
    | 'height'
    | 'maxAutoHeight'
    | 'resizableColumns'
    | 'movableColumns'
    | 'columnFilters'
    | 'autoSizeColumns'
    | 'loading'
    | 'emptyMessage'
    | 'emptyIcon'
    | 'editMode'
  >
> = {
  showToolbar: true,
  showSearch: true,
  searchPlaceholder: 'Search...',
  showExport: true,
  exportFormats: ['excel', 'csv', 'pdf', 'print'],
  showColumnToggle: true,
  showRefresh: false,
  showClearFilters: true,
  selection: 'none',
  showSerial: true,
  serialTitle: '#',
  serialMode: 'continuous',
  pagination: true,
  pageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  dense: true,
  striped: true,
  height: 'auto',
  maxAutoHeight: '520px',
  resizableColumns: true,
  movableColumns: true,
  columnFilters: false,
  autoSizeColumns: false,
  loading: false,
  emptyMessage: 'No data available',
  emptyIcon: 'inbox',
  // Full-row editing is the ERP norm for line items — a whole line is one logical
  // unit, so it commits (and recalculates) as one.
  editMode: 'fullRow',
};

import { ColDef } from 'ag-grid-community';
import { SqlRowState } from './grid-row-state.enum';

export type GridDensity = 'compact' | 'comfortable' | 'spacious';
export type GridEditMode = 'cell' | 'row' | 'batch';
export type GridSelectionMode = 'single' | 'multiple' | 'none';

export interface GridLookupOption {
  value: any;
  label: string;
  data?: any;
}

export interface GridValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, row: T) => string | null | Promise<string | null>;
}

export interface GridColumnConfig<T = any> {
  field: keyof T | string;
  headerName: string;
  type?: 'text' | 'number' | 'decimal' | 'currency' | 'date' | 'select' | 'lookup' | 'checkbox' | 'status' | 'action';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  editable?: boolean | ((row: T) => boolean);
  readOnly?: boolean;
  hidden?: boolean;
  pinned?: 'left' | 'right' | null;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  precision?: number;
  options?: GridLookupOption[] | ((row: T) => GridLookupOption[]);
  validation?: GridValidationRule<T>;
  valueFormatter?: (value: any, row: T) => string;
  valueParser?: (value: any, row: T) => any;
  /** Custom AG Grid cell renderer function. Used for columns that need DOM-level control (e.g. checkbox with conditional disable). */
  cellRenderer?: (params: any) => HTMLElement | string;
  onChange?: (newValue: any, oldValue: any, row: T) => void;
  cellClassRules?: Record<string, (params: any) => boolean>;

  // ── Pinned bottom (footer) row ────────────────────────────────────────────
  // Same vocabulary as <app-common-table> so forms read the same either way.
  // The footer always reflects the CURRENT FILTER, not the raw input rows.

  /** Sum this numeric column into the pinned bottom row. */
  bottomTotal?: boolean;
  /** Static text to show under this column (e.g. `'Total'`). */
  footerLabel?: string;
  /** Computed footer value from the currently visible rows. Wins over `bottomTotal`. */
  footerValue?: (rows: T[]) => unknown;
}

export interface GridToolbarConfig {
  showAdd?: boolean;
  showDelete?: boolean;
  showDuplicate?: boolean;
  showExport?: boolean;
  showImport?: boolean;
  showSearch?: boolean;
  showColumnChooser?: boolean;
  showDensity?: boolean;
  showReset?: boolean;
  title?: string;
  searchPlaceholder?: string;
}

export interface GridConfig<T = any> {
  gridKey: string; // Unique identifier for localStorage state persistence
  columns: GridColumnConfig<T>[];
  editMode?: GridEditMode;
  selectionMode?: GridSelectionMode;
  density?: GridDensity;
  pageSize?: number;
  pageSizeOptions?: number[];
  rowIdField?: keyof T | string;
  toolbar?: GridToolbarConfig;
  showStatusBar?: boolean;
  showPagination?: boolean;
  enableExcelCopyPaste?: boolean;
  autoCalculateFooters?: boolean;
  /** Seed values for a row created by the toolbar's Add Row button. */
  newRowDefaults?: () => Partial<T>;
  /**
   * The FORM owns the rows: the grid stops mutating its own list on add/delete and
   * emits `(addRow)` / `(rowRemove)` instead, with edits reported via `(rowChange)`.
   * Use whenever rows live somewhere the grid cannot see — a chained master/detail
   * form, for instance, where a child grid renders a filtered slice of a bigger list
   * and switching parents would otherwise throw away unsaved edits.
   */
  externalRowState?: boolean;
  /**
   * Keep the first row selected whenever nothing else is, emitting `(rowClick)` so a
   * chained form loads that row's children. Without it a freshly loaded grid shows
   * rows with none highlighted and the grid below it empty.
   */
  autoSelectFirstRow?: boolean;
  /**
   * Fallback height, used when the component's `[height]` input is not supplied —
   * so a grid's size can live beside the rest of its config in TS instead of being
   * split across the template. Never viewport math.
   */
  height?: string;

  // ── Permissions ───────────────────────────────────────────────────────────
  // FUNCTIONS, not booleans: permissions resolve after the config is built (the
  // form calls `useLocalPermissions()` in ngOnInit), so a captured boolean would
  // freeze the pre-load value. Read as signals, these stay live without ever
  // rebuilding the columns.

  /** Gates the toolbar's Add button. Default: allowed. */
  canAdd?: () => boolean;
  /** Gates ALL cell editing — ANDed with each column's own `editable`. Default: allowed. */
  canEdit?: () => boolean;
  /**
   * Per-row delete. Return false to hide the row's delete button entirely — use it
   * for permission AND for rows that still have children, so a parent cannot be
   * removed while its detail grid is populated.
   */
  canDeleteRow?: (row: T) => boolean;
}

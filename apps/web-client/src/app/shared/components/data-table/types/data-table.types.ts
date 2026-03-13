// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Types & Interfaces
// ═══════════════════════════════════════════════════════════════════

export enum SqlState {
  UNCHANGED = 0,
  INSERT = 1,
  UPDATE = 2,
  DELETE = 3,
}

// ── Row ─────────────────────────────────────────────────────────────
export interface RowData {
  sqlState: SqlState;
  _rowId?: string; // internal unique id (auto-assigned)
  _original?: Record<string, any>; // snapshot before first edit
  [key: string]: any;
}

// ── Column ───────────────────────────────────────────────────────────
export type ColumnType =
  | 'text'
  | 'number'
  | 'select'
  | 'date'
  | 'boolean'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'link'
  | 'badge'
  | 'rating'
  | 'progress'
  | 'avatar'
  | 'action'
  | 'custom';

export interface SelectOption {
  label: string;
  value: any;
  color?: string; // optional badge color override
  icon?: string; // optional material icon
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, row: RowData) => string | null; // returns error msg or null
}

export interface ColumnDef {
  key: string;
  header: string;
  type: ColumnType;
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  required?: boolean; // cannot be hidden via column picker
  width?: string; // e.g. '160px'
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  pinned?: 'left' | 'right';
  options?: SelectOption[];
  validation?: ValidationRule;
  cellClass?: (row: RowData) => string;
  format?: (value: any, row: RowData) => string;
  action?: (row: RowData) => void;
  tooltip?: (row: RowData) => string;
  summarize?: 'sum' | 'avg' | 'min' | 'max' | 'count' | false;
  // For 'progress' type: value 0-100
  // For 'rating' type:   value 0-5
  // For 'link' type:     { label: string, url: string } or plain string url
  // For 'avatar' type:   { name: string, src?: string }
  // For 'currency' type: raw number, formatted with currencyCode
  currencyCode?: string; // default 'USD'
  prefix?: string;
  suffix?: string;
}

// ── Config ───────────────────────────────────────────────────────────
export interface TableConfig {
  uniqueId: string;

  // Data mutations
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowDuplicate?: boolean;

  // Column features
  allowColumnVisibility?: boolean;
  allowColumnFilter?: boolean;
  allowColumnResize?: boolean;
  allowColumnReorder?: boolean; // drag columns (future)

  // Row features
  allowRowSelection?: boolean;
  allowRowReorder?: boolean; // drag rows (future)
  allowInlineEdit?: boolean; // click-to-edit cells (default true)
  clickToSelect?: boolean; // single-click selects row

  // Search
  allowGlobalSearch?: boolean;

  // Export
  allowExport?: boolean;
  exportFilename?: string;
  exportTitle?: string;

  // Display
  height?: string; // e.g. '400px'
  allowFullscreen?: boolean;
  stickyHeader?: boolean;
  showRowNumbers?: boolean;
  showFooterSummary?: boolean;
  highlightChanges?: boolean;
  stripedRows?: boolean;
  compactActions?: boolean; // only show actions on hover
  emptyMessage?: string;
  emptyIcon?: string;

  // Pagination
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  hideAddButton?: boolean;

  // Auto-save
  autoSave?: boolean;
}

// ── Pagination ───────────────────────────────────────────────────────
export interface PaginationState {
  page: number;
  pageSize: number;
}

// ── Sort ─────────────────────────────────────────────────────────────
export interface SortState {
  column: string;
  direction: 'asc' | 'desc' | '';
}

// ── Full table state ─────────────────────────────────────────────────
export interface TableState {
  sort: SortState;
  pagination: PaginationState;
  globalFilter: string;
  columnFilters: Record<string, string>;
}

// ── Events ───────────────────────────────────────────────────────────
export interface RowEvent {
  type: 'add' | 'edit' | 'delete' | 'duplicate' | 'revert';
  row: RowData;
  column?: string;
  value?: any;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  title?: string;
  onlySelected?: boolean;
  onlyVisible?: boolean;
}

// ── Validation result ─────────────────────────────────────────────────
export interface CellValidation {
  valid: boolean;
  message: string | null;
}

export type ValidationMap = Record<string, Record<string, CellValidation>>;

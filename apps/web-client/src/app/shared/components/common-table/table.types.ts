import { TemplateRef } from '@angular/core';

// ─── Cell Types ───────────────────────────────────────────────────────────────
export type CellType =
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'date'
  | 'datepipe'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'badge'
  | 'icon'
  | 'button'
  | 'readonly'
  | 'custom-template';

export type PinDirection = 'left' | 'right' | null;
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface BadgeConfig {
  label: string;
  variant: BadgeVariant;
  solid?: boolean;
}

export interface SelectOption {
  label: string;
  value: unknown;
}

export interface CellButtonConfig {
  label: string;
  icon?: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  onClick?: (row: Record<string, unknown>, column: ColumnDef) => void;
}

// ─── Column Definition ────────────────────────────────────────────────────────
export interface ColumnDef {
  title: string;
  field: string;
  width?: string;
  minWidth?: string;
  sort?: boolean;
  cellType?: CellType;
  /**
   * Logical value accessor used for SEARCH, SORT and EXPORT when the displayed value can't be
   * read straight from `row[field]` — e.g. a `custom-template` column that shows a label for an
   * id, or any computed cell. Return the human-readable value (string or number).
   * Falls back to `row[field]` (with `select`/`badge`/`checkbox` resolution) when omitted.
   */
  value?: (row: Record<string, unknown>) => unknown;
  pin?: PinDirection;
  bottomTotal?: boolean;
  footerValue?: (rows: Record<string, unknown>[]) => unknown;
  editable?: boolean | ((row: Record<string, unknown>, column: ColumnDef) => boolean);
  onChange?: (value: unknown, row: Record<string, unknown>, column: ColumnDef) => void;
  align?: 'left' | 'center' | 'right';
  dateFormat?: string;
  precision?: number;
  currencyCode?: string;
  options?: SelectOption[] | ((row: Record<string, unknown>) => SelectOption[]);
  labelKey?: string;
  valueKey?: string;
  badgeConfig?: (value: unknown, row: Record<string, unknown>) => BadgeConfig | null;
  buttonConfig?: CellButtonConfig | ((row: Record<string, unknown>) => CellButtonConfig);
  customTemplate?: TemplateRef<unknown>;
  tooltip?: string;
  visible?: boolean;
  hideable?: boolean;
  headerClass?: string;
  cellClass?: string;
  footerLabel?: string;
}

// ─── Table Configuration ──────────────────────────────────────────────────────
export type ExportFormat = 'excel' | 'pdf' | 'csv' | 'print';

export type TableActionType = 'view' | 'edit' | 'delete' | 'custom';

export interface TableAction {
  type: TableActionType;
  icon: string;
  tooltip?: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'ghost';
  visible?: (row: Record<string, unknown>) => boolean;
  disabled?: (row: Record<string, unknown>) => boolean;
  onClick?: (row: Record<string, unknown>) => void;
  label?: string;
}

export interface TableConfig {
  showSearch?: boolean;
  searchPlaceholder?: string;
  showExport?: boolean;
  exportFormats?: ExportFormat[];
  showColumnToggle?: boolean;
  showActions?: boolean;
  actions?: TableAction[];
  pagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  showFooterTotal?: boolean;
  virtualScroll?: boolean;
  rowHeight?: number;
  title?: string;
  showTitle?: boolean;
  selectable?: boolean;
  loading?: boolean;
  hoverEffect?: boolean;
  dense?: boolean;
  compact?: boolean;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  serverSide?: boolean;
  striped?: boolean;
  showRowNumbers?: boolean;
}

export interface SortState {
  active: string;
  direction: 'asc' | 'desc' | '';
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

// ─── Default Config ──────────────────────────────────────────────────────────
export const DEFAULT_TABLE_CONFIG: TableConfig = {
  showSearch: true,
  searchPlaceholder: 'Search...',
  showExport: true,
  exportFormats: ['excel', 'pdf', 'csv', 'print'],
  showColumnToggle: true,
  showActions: true,
  actions: [
    { type: 'view', icon: 'visibility', tooltip: 'View', variant: 'ghost' },
    { type: 'delete', icon: 'delete', tooltip: 'Delete', variant: 'ghost' },
  ],
  pagination: true,
  pageSizeOptions: [10, 25, 50, 100],
  defaultPageSize: 10,
  showFooterTotal: false,
  virtualScroll: false,
  rowHeight: 48,
  title: '',
  showTitle: false,
  selectable: false,
  loading: false,
  hoverEffect: true,
  dense: false,
  compact: false,
  height: '',
  minHeight: '20vh',
  maxHeight: 'calc(100vh - 320px)',
  serverSide: false,
  striped: true,
  showRowNumbers: false,
};

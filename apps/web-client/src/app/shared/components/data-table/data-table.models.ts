export enum SqlState {
  UNCHANGED = 0,
  INSERT = 1,
  UPDATE = 2,
  DELETE = 3,
}

export interface RowData {
  sqlState: SqlState;
  _rowId?: string; // internal unique id for tracking
  [key: string]: any;
}

export interface ColumnDef {
  key: string;
  header: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'action' | 'custom';
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  required?: boolean; // cannot be hidden
  width?: string; // e.g. '160px'
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  pinned?: 'left' | 'right';
  options?: { label: string; value: any }[];
  cellClass?: (row: RowData) => string;
  format?: (value: any, row: RowData) => string; // custom display formatter
  action?: (row: RowData) => void;
  tooltip?: (row: RowData) => string;
}

export interface TableConfig {
  uniqueId: string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowExport?: boolean; // CSV + XLSX + PDF
  allowColumnVisibility?: boolean;
  allowRowSelection?: boolean;
  allowGlobalSearch?: boolean;
  allowColumnFilter?: boolean; // per-column header filters
  allowColumnResize?: boolean;
  allowRowReorder?: boolean;
  allowFullscreen?: boolean;
  pageSizeOptions?: number[];
  rowHeight?: 'compact' | 'normal' | 'comfortable'; // density
  stickyHeader?: boolean;
  showRowNumbers?: boolean;
  showFooterSummary?: boolean; // count / sum row at bottom
  highlightChanges?: boolean; // color INSERT/UPDATE rows
  autoSave?: boolean; // emit dataChange on every edit
  hideAddButton?: boolean; // hide the built-in add button in toolbar
}

export interface TableState {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | '';
  page: number;
  pageSize: number;
  globalFilter: string;
  columnFilters: Record<string, string>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filename?: string;
  title?: string;
  onlySelected?: boolean;
}

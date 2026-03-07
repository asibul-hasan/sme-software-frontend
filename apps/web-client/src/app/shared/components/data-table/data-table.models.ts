export enum SqlState {
  UNCHANGED = 0,
  INSERT = 1,
  UPDATE = 2,
  DELETE = 3
}

export interface RowData {
  sqlState: SqlState;
  [key: string]: any;
}

export interface ColumnDef {
  key: string;
  header: string;
  type: 'text' | 'number' | 'select' | 'action' | 'custom' | 'date' | 'boolean';
  editable?: boolean;
  options?: { label: string; value: any }[]; // For select type
  action?: (row: any) => void; // For button clicks
  hidden?: boolean;
  required?: boolean; // If true, cannot be hidden
}

export interface TableConfig {
  uniqueId: string; // For saving column preferences
  allowAdd?: boolean;
  allowDelete?: boolean; // Soft delete (state 3)
  allowExport?: boolean;
  allowColumnVisibility?: boolean;
  allowRowSelection?: boolean;
  pageSizeOptions?: number[];
}

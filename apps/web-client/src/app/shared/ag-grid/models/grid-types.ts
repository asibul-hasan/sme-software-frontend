import { TemplateRef } from '@angular/core';
import { GridToolbarConfig } from './grid-config.model';

export type GridId = `${string}_GRID`;
export type GridRowData = Record<string, unknown>;

export interface ActionItemConfig {
  kind: 'view' | 'edit' | 'delete' | 'custom';
  label?: string;
  icon?: string;
  confirm?: boolean;
  onClick: (row: GridRowData) => void;
}

export interface ColumnConfig {
  field: string;
  headerName: string;
  type?: 'text' | 'number' | 'decimal' | 'currency' | 'date' | 'datetime' | 'check' | 'select' | 'badge' | 'status' | 'template' | 'actions' | 'remove';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  pinned?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  isEditable?: boolean | ((value: unknown, row: GridRowData) => void);
  options?: any[] | ((row: GridRowData) => any[]);
  templateName?: string;
  badgeMapper?: (val: unknown) => { label: string; variant?: string };
  actions?: ActionItemConfig[];
  removeHandler?: (row: GridRowData) => void;
  removeTooltip?: string;
  isSum?: boolean;
  footerFn?: (rows: GridRowData[]) => string | number;
  valueFn?: (row: GridRowData) => string;
}

export class ColumnBuilderChain {
  private colDef: ColumnConfig;

  constructor(field: string, headerName: string, type: ColumnConfig['type'] = 'text') {
    this.colDef = {
      field,
      headerName,
      type,
      align: type === 'number' || type === 'decimal' || type === 'currency' ? 'right' : type === 'check' || type === 'badge' || type === 'status' || type === 'actions' || type === 'remove' ? 'center' : 'left',
    };
  }

  width(w: number): this {
    this.colDef.width = w;
    return this;
  }

  minWidth(w: number): this {
    this.colDef.minWidth = w;
    return this;
  }

  maxWidth(w: number): this {
    this.colDef.maxWidth = w;
    return this;
  }

  flex(f: number): this {
    this.colDef.flex = f;
    return this;
  }

  pin(p: 'left' | 'right'): this {
    this.colDef.pinned = p;
    return this;
  }

  align(a: 'left' | 'center' | 'right'): this {
    this.colDef.align = a;
    return this;
  }

  editable(handler?: boolean | ((value: unknown, row: GridRowData) => void)): this {
    this.colDef.isEditable = handler ?? true;
    return this;
  }

  sum(): this {
    this.colDef.isSum = true;
    return this;
  }

  footer(fn: (rows: GridRowData[]) => string | number): this {
    this.colDef.footerFn = fn;
    return this;
  }

  value(fn: (row: GridRowData) => string): this {
    this.colDef.valueFn = fn;
    return this;
  }

  done(): ColumnConfig {
    return { ...this.colDef };
  }
}

export const col = {
  text: (field: string, header: string) => new ColumnBuilderChain(field, header, 'text'),
  number: (field: string, header: string) => new ColumnBuilderChain(field, header, 'number'),
  decimal: (field: string, header: string) => new ColumnBuilderChain(field, header, 'decimal'),
  currency: (field: string, header: string) => new ColumnBuilderChain(field, header, 'currency'),
  date: (field: string, header: string) => new ColumnBuilderChain(field, header, 'date'),
  datetime: (field: string, header: string) => new ColumnBuilderChain(field, header, 'datetime'),
  check: (field: string, header: string) => new ColumnBuilderChain(field, header, 'check'),
  select: (field: string, header: string, options: any[] | ((row: GridRowData) => any[])) => {
    const b = new ColumnBuilderChain(field, header, 'select');
    (b as any).colDef.options = options;
    return b;
  },
  badge: (field: string, header: string, mapper?: (val: unknown) => { label: string; variant?: string }) => {
    const b = new ColumnBuilderChain(field, header, 'badge');
    (b as any).colDef.badgeMapper = mapper;
    return b;
  },
  status: (field = '__sqlState', header = 'Status') => {
    return new ColumnBuilderChain(field, header, 'status').pin('left').width(110);
  },
  template: (field: string, header: string, templateName: string) => {
    const b = new ColumnBuilderChain(field, header, 'template');
    (b as any).colDef.templateName = templateName;
    return b;
  },
  actions: (items: ActionItemConfig[]) => {
    const b = new ColumnBuilderChain('__actions', 'Actions', 'actions');
    (b as any).colDef.actions = items;
    return b.pin('right').width(100);
  },
  remove: (handler: (row: GridRowData) => void, tooltip = 'Remove row') => {
    const b = new ColumnBuilderChain('__remove', 'Actions', 'remove');
    (b as any).colDef.removeHandler = handler;
    (b as any).colDef.removeTooltip = tooltip;
    return b.pin('right').width(70);
  },
};

export interface GridEditableConfig {
  mode?: 'row' | 'cell';
  singleClick?: boolean;
  recalculate?: (row: GridRowData) => void;
  newRowDefaults?: () => GridRowData;
}



export interface GridFullConfig {
  gridId: GridId;
  columns: ColumnConfig[];
  rowIdField: string;
  selectionMode: 'single' | 'multiple' | 'none';
  editableConfig?: GridEditableConfig;
  pageSize: number;
  pageSizeOptions: number[];
  hideRowNumbers?: boolean;
  toolbarConfig?: GridToolbarConfig;
}

export class GridBuilder {
  private config: GridFullConfig;

  private constructor(gridId: GridId) {
    this.config = {
      gridId,
      columns: [],
      rowIdField: '__uid',
      selectionMode: 'single',
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    };
  }

  static create(gridId: GridId): GridBuilder {
    return new GridBuilder(gridId);
  }

  columns(cols: ColumnConfig[]): this {
    this.config.columns = cols;
    return this;
  }

  rowId(field: string): this {
    this.config.rowIdField = field;
    return this;
  }

  selection(mode: 'single' | 'multiple' | 'none'): this {
    this.config.selectionMode = mode;
    return this;
  }

  editable(cfg: GridEditableConfig): this {
    this.config.editableConfig = cfg;
    return this;
  }

  pageSize(sz: number): this {
    this.config.pageSize = sz;
    return this;
  }

  pageSizeOptions(opts: number[]): this {
    this.config.pageSizeOptions = opts;
    return this;
  }

  hideRowNumbers(hide = true): this {
    this.config.hideRowNumbers = hide;
    return this;
  }

  toolbar(cfg: GridToolbarConfig): this {
    this.config.toolbarConfig = cfg;
    return this;
  }

  build(): GridFullConfig {
    return { ...this.config };
  }
}

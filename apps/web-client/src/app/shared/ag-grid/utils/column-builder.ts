import { GridColumnConfig, GridLookupOption, GridValidationRule } from '../models/grid-config.model';

export class ColumnBuilder<T = any> {
  private config: GridColumnConfig<T>;

  constructor(field: keyof T | string, headerName: string, type: GridColumnConfig<T>['type'] = 'text') {
    this.config = {
      field,
      headerName,
      type,
      sortable: true,
      filterable: true,
      editable: true,
      align: type === 'number' || type === 'decimal' || type === 'currency' ? 'right' : type === 'checkbox' || type === 'status' || type === 'action' ? 'center' : 'left',
    };
  }

  width(w: number): this {
    this.config.width = w;
    return this;
  }

  minWidth(w: number): this {
    this.config.minWidth = w;
    return this;
  }

  maxWidth(w: number): this {
    this.config.maxWidth = w;
    return this;
  }

  flex(f: number): this {
    this.config.flex = f;
    return this;
  }

  editable(edit: boolean | ((row: T) => boolean) = true): this {
    this.config.editable = edit;
    return this;
  }

  readOnly(): this {
    this.config.editable = false;
    this.config.readOnly = true;
    return this;
  }

  hidden(h = true): this {
    this.config.hidden = h;
    return this;
  }

  pinned(p: 'left' | 'right' | null): this {
    this.config.pinned = p;
    return this;
  }

  align(a: 'left' | 'center' | 'right'): this {
    this.config.align = a;
    return this;
  }

  precision(p: number): this {
    this.config.precision = p;
    return this;
  }

  options(opts: GridLookupOption[] | ((row: T) => GridLookupOption[])): this {
    this.config.options = opts;
    return this;
  }

  required(errMsg = 'Field is required'): this {
    if (!this.config.validation) this.config.validation = {};
    this.config.validation.required = true;
    return this;
  }

  min(minVal: number): this {
    if (!this.config.validation) this.config.validation = {};
    this.config.validation.min = minVal;
    return this;
  }

  max(maxVal: number): this {
    if (!this.config.validation) this.config.validation = {};
    this.config.validation.max = maxVal;
    return this;
  }

  pattern(regex: RegExp): this {
    if (!this.config.validation) this.config.validation = {};
    this.config.validation.pattern = regex;
    return this;
  }

  onChange(handler: (newValue: any, oldValue: any, row: T) => void): this {
    this.config.onChange = handler;
    return this;
  }

  valueFormatter(fn: (value: any, row: T) => string): this {
    this.config.valueFormatter = fn;
    return this;
  }

  cellRenderer(fn: (params: any) => HTMLElement | string): this {
    this.config.cellRenderer = fn;
    return this;
  }

  /** Sum this column into the pinned bottom row (respects the active filter). */
  sum(): this {
    this.config.bottomTotal = true;
    return this;
  }

  /** Static text under this column in the pinned bottom row, e.g. `.footer('Total')`. */
  footer(label: string): this {
    this.config.footerLabel = label;
    return this;
  }

  /** Computed pinned-bottom value derived from the currently visible rows. */
  footerValue(fn: (rows: T[]) => unknown): this {
    this.config.footerValue = fn;
    return this;
  }

  build(): GridColumnConfig<T> {
    return { ...this.config };
  }
}

/**
 * Reusable Column Builders for Aidly ERP.
 * Standardizes grid definitions across all ERP forms.
 */
export const GridColumns = {
  text: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'text'),
  number: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'number'),
  decimal: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'decimal'),
  currency: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'currency'),
  date: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'date'),
  lookup: <T = any>(field: keyof T | string, headerName: string, options?: GridLookupOption[] | ((row: T) => GridLookupOption[])) => {
    const builder = new ColumnBuilder<T>(field, headerName, 'lookup');
    if (options) builder.options(options);
    return builder;
  },
  select: <T = any>(field: keyof T | string, headerName: string, options?: GridLookupOption[] | ((row: T) => GridLookupOption[])) => {
    const builder = new ColumnBuilder<T>(field, headerName, 'select');
    if (options) builder.options(options);
    return builder;
  },
  checkbox: <T = any>(field: keyof T | string, headerName: string) => new ColumnBuilder<T>(field, headerName, 'checkbox'),
  status: <T = any>(field: keyof T | string = '__sqlState', headerName = 'Status') => new ColumnBuilder<T>(field, headerName, 'status').readOnly().width(110).pinned('left'),
  action: <T = any>(headerName = '') => new ColumnBuilder<T>('__actions', headerName, 'action').readOnly().width(48).pinned('right'),
};

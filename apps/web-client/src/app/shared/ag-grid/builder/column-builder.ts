import type {
  GridBadge,
  GridCellType,
  GridColumn,
  GridRowData,
  GridSelectOption,
} from '../models/grid-types';

/**
 * Fluent column builder. Each factory on {@link col} starts a column of a given type; chain the
 * modifiers you need and finish with `.done()`.
 *
 * ```ts
 * col.text('item_name', 'Item').flex(1).minWidth(180).done()
 * col.currency('amount', 'Amount').sum().done()
 * col.select('status', 'Status', invConstants.statuses).width(140).editable(onStatus).done()
 * ```
 *
 * The type decides the sensible defaults — numeric columns right-align, dates format, select
 * columns resolve their label for search and sort — so a form states intent, not mechanics.
 */
class ColumnBuilder {
  private readonly column: GridColumn;

  constructor(field: string, title: string, cellType: GridCellType, seed?: Partial<GridColumn>) {
    this.column = { field, title, cellType, ...seed };
  }

  // ── Sizing ─────────────────────────────────────────────────────────────────
  width(px: number): this {
    this.column.width = px;
    return this;
  }

  minWidth(px: number): this {
    this.column.minWidth = px;
    return this;
  }

  maxWidth(px: number): this {
    this.column.maxWidth = px;
    return this;
  }

  /** Share of the leftover width. Use on the one column that should absorb slack. */
  flex(value = 1): this {
    this.column.flex = value;
    return this;
  }

  // ── Placement ──────────────────────────────────────────────────────────────
  pin(side: 'left' | 'right' = 'left'): this {
    this.column.pinned = side;
    return this;
  }

  align(align: 'left' | 'center' | 'right'): this {
    this.column.align = align;
    return this;
  }

  hidden(): this {
    this.column.hidden = true;
    return this;
  }

  // ── Behaviour ──────────────────────────────────────────────────────────────
  noSort(): this {
    this.column.sortable = false;
    return this;
  }

  /** Adds a per-column filter. Quick search covers every column regardless. */
  filterable(): this {
    this.column.filter = true;
    return this;
  }

  /**
   * Makes the column editable.
   *
   * @param onChange Called when the cell commits. This is where a form writes the value back
   *   into its own model — the grid never mutates form state on its own.
   */
  editable(onChange?: (value: unknown, row: GridRowData, column: GridColumn) => void): this {
    this.column.editable = true;
    if (onChange) this.column.onChange = onChange;
    return this;
  }

  /** Editable only for rows satisfying a predicate (e.g. drafts, but not posted documents). */
  editableWhen(predicate: (row: GridRowData) => boolean): this {
    this.column.editable = predicate;
    return this;
  }

  // ── Display ────────────────────────────────────────────────────────────────

  /**
   * Logical value for search, sort and export when the display differs from `row[field]`.
   *
   * Not needed on `select` columns — those resolve their option label automatically.
   */
  value(accessor: (row: GridRowData) => unknown): this {
    this.column.value = accessor;
    return this;
  }

  precision(digits: number): this {
    this.column.precision = digits;
    return this;
  }

  format(dateFormat: string): this {
    this.column.dateFormat = dateFormat;
    return this;
  }

  tooltip(text: string): this {
    this.column.tooltip = text;
    return this;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  /** Sum this column into the pinned footer row. Reflects the current filter, not raw input. */
  sum(): this {
    this.column.footerSum = true;
    return this;
  }

  /** Footer text (e.g. `'Total'`) or a value computed from the visible rows. */
  footer(value: string | ((rows: GridRowData[]) => unknown)): this {
    this.column.footer = value;
    return this;
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  noExport(): this {
    this.column.excludeFromExport = true;
    return this;
  }

  /** Finishes the column. */
  done(): GridColumn {
    return this.column;
  }
}

/**
 * Column factories.
 *
 * `field` comes first everywhere because it is the identity — the backend DTO's snake_case name
 * that search, sort, export and editing all key off.
 */
export const col = {
  text: (field: string, title: string) => new ColumnBuilder(field, title, 'text'),

  /** Integer. Right-aligned automatically. */
  number: (field: string, title: string) => new ColumnBuilder(field, title, 'number'),

  /** Decimal at the app-wide precision unless `.precision()` overrides it. */
  decimal: (field: string, title: string) => new ColumnBuilder(field, title, 'decimal'),

  /** Money. Precision follows the active currency — never hard-code it. */
  currency: (field: string, title: string) => new ColumnBuilder(field, title, 'currency'),

  date: (field: string, title: string) => new ColumnBuilder(field, title, 'date'),

  datetime: (field: string, title: string) => new ColumnBuilder(field, title, 'datetime'),

  /** Numeric `1`/`0` flag rendered as a tick. */
  check: (field: string, title: string) => new ColumnBuilder(field, title, 'checkbox'),

  /**
   * Dropdown. Displays the option `label`, stores the option `value` — the code the backend
   * persists. Options come from the module's constants file, never an inline array.
   */
  select: (
    field: string,
    title: string,
    options: GridSelectOption[] | ((row: GridRowData) => GridSelectOption[]),
  ) => new ColumnBuilder(field, title, 'select', { options }),

  /** Coloured pill. Pass a mapper from the stored value to label + variant. */
  badge: (
    field: string,
    title: string,
    badge: (value: unknown, row: GridRowData) => GridBadge | null,
  ) => new ColumnBuilder(field, title, 'badge', { badge }),

  /**
   * Renders a named template declared in the form:
   * `<ng-template appGridCell="actions" let-row>…</ng-template>`
   */
  template: (field: string, title: string, templateName: string) =>
    new ColumnBuilder(field, title, 'template', { templateName }),
};

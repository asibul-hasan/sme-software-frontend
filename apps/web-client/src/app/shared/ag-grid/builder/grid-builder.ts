import type { GridDensity, GridSelectionMode } from '../enums/grid-enums';
import { GRID_DEFAULT_CONFIG, GRID_DEFAULT_TOOLBAR } from '../constants/grid-defaults';
import type {
  AgGridConfig,
  GridColumn,
  GridId,
  GridRowData,
  GridToolbarConfig,
} from '../models/grid-types';

/**
 * Fluent builder for {@link AgGridConfig} — the API forms use.
 *
 * ```ts
 * readonly grid = GridBuilder.create('INV_ITEM_GRID')
 *   .columns([
 *     col.text('item_code', 'Item Code').width(140).pin('left').done(),
 *     col.text('item_name', 'Name').flex(1).done(),
 *     col.currency('unit_price', 'Unit Price').sum().done(),
 *   ])
 *   .pageSize(100)
 *   .selection('multiple')
 *   .build();
 * ```
 *
 * ### Why a builder rather than an object literal
 *
 * A literal spreads defaults across every form: one turns pagination off, another forgets the
 * row id, a third invents its own page size. The builder makes the default path the shortest
 * one to type, keeps the required parts (`gridId`, `columns`) impossible to omit, and gives
 * one place to validate and to evolve the config shape without editing hundreds of forms.
 *
 * Build once and hold it in a `readonly` field. The config is static; row data flows separately
 * through the component's `[data]` input, so new rows never rebuild the grid.
 */
export class GridBuilder {
  private readonly config: AgGridConfig;

  private constructor(gridId: GridId) {
    this.config = {
      ...GRID_DEFAULT_CONFIG,
      gridId,
      columns: [],
      toolbar: { ...GRID_DEFAULT_TOOLBAR },
    };
  }

  /**
   * Starts a config for one grid.
   *
   * @param gridId Stable `{MODULE}_{ENTITY}_GRID` identity. Persisted layout, filters and sort
   *   are all keyed off it, so it must not change once released — renaming it silently discards
   *   every user's saved layout. Never derive it from a component or file name.
   */
  static create(gridId: GridId): GridBuilder {
    return new GridBuilder(gridId);
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  columns(columns: GridColumn[]): this {
    this.config.columns = columns;
    return this;
  }

  addColumn(column: GridColumn): this {
    this.config.columns = [...this.config.columns, column];
    return this;
  }

  // ── Paging ─────────────────────────────────────────────────────────────────

  /** Rows per page. Defaults to 50. */
  pageSize(size: number): this {
    this.config.pageSize = size;
    return this;
  }

  pageSizeOptions(options: number[]): this {
    this.config.pageSizeOptions = options;
    return this;
  }

  /** Turn paging off — only for genuinely short, bounded sets (a handful of line items). */
  noPagination(): this {
    this.config.pagination = false;
    return this;
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  selection(mode: GridSelectionMode): this {
    this.config.selectionMode = mode;
    return this;
  }

  /**
   * Field holding a stable row identity. Strongly recommended: without it AG Grid falls back to
   * row index, so selection and edit state jump whenever the data is refreshed or re-sorted.
   */
  rowId(field: string): this {
    this.config.rowIdField = field;
    return this;
  }

  // ── Layout ─────────────────────────────────────────────────────────────────

  /**
   * Fallback height, used only when the component gets no `[height]`. Prefer setting height on
   * the component — the same config may be placed in cards of different sizes.
   */
  height(height: string): this {
    this.config.defaultHeight = height;
    return this;
  }

  density(density: GridDensity): this {
    this.config.density = density;
    return this;
  }

  /** Stop columns stretching to fill the width; keeps declared widths instead. */
  noAutoFit(): this {
    this.config.autoFitColumns = false;
    return this;
  }

  // ── Features ───────────────────────────────────────────────────────────────

  hideRowNumbers(): this {
    this.config.showRowNumbers = false;
    return this;
  }

  hideStatusBar(): this {
    this.config.statusBar = false;
    return this;
  }

  /** Override individual toolbar buttons; unlisted ones keep their default. */
  toolbar(toolbar: GridToolbarConfig): this {
    this.config.toolbar = { ...this.config.toolbar, ...toolbar };
    return this;
  }

  noToolbar(): this {
    this.config.toolbar = { ...this.config.toolbar, enabled: false };
    return this;
  }

  /** Opt out of remembering column layout, sort and filters for this grid. */
  noStatePersistence(): this {
    this.config.persistState = false;
    return this;
  }

  lockColumnOrder(): this {
    this.config.suppressMovable = true;
    return this;
  }

  // ── Editing ────────────────────────────────────────────────────────────────

  /**
   * Turn the grid into an editable line-item grid.
   *
   * @param options.recalculate Row-wide cascade run after any cell of the row commits — the
   *   normal ERP case (quantity × rate → amount → tax → total).
   * @param options.newRowDefaults Values applied to a row created via `addRow()`.
   */
  editable(options?: {
    recalculate?: (row: GridRowData) => void;
    newRowDefaults?: () => GridRowData;
  }): this {
    this.config.editable = true;
    if (options?.recalculate) this.config.recalculate = options.recalculate;
    if (options?.newRowDefaults) this.config.newRowDefaults = options.newRowDefaults;
    return this;
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  /**
   * Produces the frozen config.
   *
   * Validates the two things that fail silently and confusingly at runtime rather than loudly
   * at startup: a grid with no columns renders an empty shell, and duplicate fields make AG Grid
   * drop all but one column with no error.
   */
  build(): AgGridConfig {
    if (!this.config.columns.length) {
      throw new Error(`[${this.config.gridId}] GridBuilder: at least one column is required.`);
    }

    const duplicates = this.config.columns
      .map((c) => c.field)
      .filter((field, index, all) => all.indexOf(field) !== index);

    if (duplicates.length) {
      throw new Error(
        `[${this.config.gridId}] GridBuilder: duplicate column field(s): ${[...new Set(duplicates)].join(', ')}.`,
      );
    }

    return Object.freeze({ ...this.config });
  }
}

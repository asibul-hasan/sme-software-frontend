import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import dayjs from 'dayjs';

import { GridBadgeCellComponent } from './cell-renderers/badge-cell.component';
import { GridActionsCellComponent } from './cell-renderers/actions-cell.component';
import { GridIconCellComponent } from './cell-renderers/icon-cell.component';
import { GridTemplateCellComponent } from './cell-renderers/template-cell.component';
import { GridDeleteCellComponent } from './cell-renderers/delete-cell.component';
import type { GridColumnDef, GridConfig, GridRow, GridSelectOption } from './grid.types';

/**
 * Translates the ERP {@link GridColumnDef} contract into AG Grid `ColDef`s.
 *
 * <p>This is the whole adapter layer: forms describe columns in the app's own
 * vocabulary and never import AG Grid types, so the grid engine stays swappable and
 * the 200+ existing column definitions port across with a rename.</p>
 */

/** Number formatting taken from app settings — never hard-code precision. */
export interface NumberFormatContext {
  precision: number;
  numberStyle: 'international' | 'indian';
}

const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';

// ─── Value resolution ─────────────────────────────────────────────────────────

/**
 * The logical value of a cell — what search, sort and export must operate on.
 * Honours the column's `value` accessor, then resolves `select` options to their
 * label so a dropdown column searches by the text the user actually sees.
 */
export function logicalValue(column: GridColumnDef, row: GridRow): unknown {
  if (column.value) return column.value(row);

  const raw = row?.[column.field];
  if (column.cellType === 'select' && column.options) {
    const options = typeof column.options === 'function' ? column.options(row) : column.options;
    return options.find((o: GridSelectOption) => o.value === raw || (raw != null && String(o.value) === String(raw)))?.label ?? raw;
  }
  if (column.cellType === 'checkbox') {
    return raw === 1 || raw === true || raw === '1' ? 'Yes' : 'No';
  }
  if (column.cellType === 'badge' && column.badgeConfig) {
    return column.badgeConfig(raw, row)?.label ?? raw;
  }
  return raw;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatNumber(value: unknown, decimals: number, style: 'international' | 'indian'): string {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(style === 'indian' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatDate(value: unknown, format: string): string {
  if (value == null || value === '') return '';
  const d = dayjs(value as string);
  return d.isValid() ? d.format(format) : String(value);
}

/** dayjs uses different tokens than Angular's DatePipe — translate the common ones. */
function toDayjsFormat(format?: string): string {
  if (!format) return DEFAULT_DATE_FORMAT;
  return format
    .replace(/dd/g, 'DD')
    .replace(/\by\b/g, 'YYYY')
    .replace(/yyyy/g, 'YYYY')
    .replace(/yy/g, 'YY');
}

// ─── Column building ──────────────────────────────────────────────────────────

export function buildColDef(
  column: GridColumnDef,
  config: GridConfig,
  numberCtx: () => NumberFormatContext,
): ColDef {
  const cellType = column.cellType ?? 'text';
  const isNumeric = cellType === 'number' || cellType === 'decimal' || cellType === 'currency';

  const colDef: ColDef = {
    colId: column.field,
    field: column.field,
    headerName: column.title,
    // Carry the original definition so renderers can read badgeConfig/actions/etc.
    context: { column },

    hide: column.hidden ?? false,
    lockVisible: column.lockVisible ?? false,
    pinned: column.pin ?? null,
    resizable: column.resizable ?? config.resizableColumns ?? true,
    suppressMovable: !(column.movable ?? config.movableColumns ?? true),
    sortable: column.sortable ?? true,
    wrapText: column.wrapText ?? false,
    autoHeight: column.wrapText ?? false,
    headerTooltip: column.tooltip ?? column.title,
    headerClass: column.headerClass,
  };

  if (column.width != null) colDef.width = column.width;
  if (column.minWidth != null) colDef.minWidth = column.minWidth;
  if (column.maxWidth != null) colDef.maxWidth = column.maxWidth;
  if (column.flex != null) colDef.flex = column.flex;

  // ── Alignment ──────────────────────────────────────────────────────────────
  // Numeric columns are right-aligned by default (CLAUDE.md currency rule).
  const align = column.align ?? (isNumeric ? 'right' : 'left');
  const alignClass =
    align === 'right' ? 'ag-right-aligned-cell'
    : align === 'center' ? 'grid-cell--center'
    : '';
  colDef.cellClass = [alignClass, column.cellClass].filter(Boolean).join(' ') || undefined;
  if (align === 'right') colDef.headerClass = [colDef.headerClass, 'ag-right-aligned-header'].filter(Boolean).join(' ');
  if (align === 'center') colDef.headerClass = [colDef.headerClass, 'grid-header--center'].filter(Boolean).join(' ');

  // ── Filtering ──────────────────────────────────────────────────────────────
  if (column.filter ?? config.columnFilters) {
    colDef.filter = isNumeric ? 'agNumberColumnFilter'
      : cellType === 'date' || cellType === 'datetime' ? 'agDateColumnFilter'
      : 'agTextColumnFilter';
    colDef.floatingFilter = false;
  } else {
    colDef.filter = false;
  }

  // ── Logical value for sort / quick-search / export ─────────────────────────
  // A `valueGetter` REPLACES the stored value, so it must never be used on an
  // editable column: AG Grid would then have nothing to write back to (it needs a
  // matching valueSetter) and the edit is silently lost. Editable columns keep
  // their raw value and expose the human-readable text through
  // `valueFormatter` / `getQuickFilterText` instead, which leaves the underlying
  // code — the value the backend persists — untouched.
  const isEditable = !!column.editable && !column.compute;

  if (column.value && !isEditable) {
    colDef.valueGetter = (p: ValueGetterParams) =>
      p.data ? logicalValue(column, p.data as GridRow) : null;
  } else if (column.value) {
    colDef.getQuickFilterText = (p) =>
      p.data ? String(logicalValue(column, p.data as GridRow) ?? '') : '';
  }

  // Columns whose display differs from the stored code search and sort on the
  // TEXT the user can see, not on the code.
  if (cellType === 'select' || cellType === 'checkbox' || cellType === 'badge') {
    if (!colDef.valueGetter) {
      colDef.getQuickFilterText = (p) =>
        p.data ? String(logicalValue(column, p.data as GridRow) ?? '') : '';
      colDef.comparator = (_a, _b, nodeA, nodeB) => {
        const la = String(logicalValue(column, (nodeA?.data ?? {}) as GridRow) ?? '');
        const lb = String(logicalValue(column, (nodeB?.data ?? {}) as GridRow) ?? '');
        return la.localeCompare(lb);
      };
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────────────
  switch (cellType) {
    case 'currency':
    case 'decimal':
      colDef.valueFormatter = (p: ValueFormatterParams) => {
        const ctx = numberCtx();
        return formatNumber(p.value, column.precision ?? ctx.precision, ctx.numberStyle);
      };
      break;

    case 'number':
      colDef.valueFormatter = (p: ValueFormatterParams) =>
        formatNumber(p.value, column.precision ?? 0, numberCtx().numberStyle);
      break;

    case 'date':
      colDef.valueFormatter = (p: ValueFormatterParams) =>
        formatDate(p.value, toDayjsFormat(column.dateFormat));
      break;

    case 'datetime':
      colDef.valueFormatter = (p: ValueFormatterParams) =>
        formatDate(p.value, toDayjsFormat(column.dateFormat ?? 'DD/MM/YYYY HH:mm'));
      break;

    case 'select':
      // Shows the label, stores the code. Without this the cell would render the
      // raw enum value (`3` instead of `Approved`).
      colDef.valueFormatter = (p: ValueFormatterParams) =>
        p.data ? String(logicalValue(column, p.data as GridRow) ?? '') : '';
      break;

    case 'badge':
      colDef.cellRenderer = GridBadgeCellComponent;
      break;

    case 'icon':
    case 'checkbox':
      colDef.cellRenderer = GridIconCellComponent;
      break;

    case 'actions':
      colDef.cellRenderer = GridActionsCellComponent;
      colDef.sortable = false;
      colDef.filter = false;
      colDef.resizable = false;
      colDef.suppressMovable = true;
      colDef.pinned = column.pin ?? 'right';
      colDef.width = column.width ?? 110;
      colDef.minWidth = column.minWidth ?? 90;
      colDef.headerName = column.title ?? '';
      break;

    case 'delete':
      colDef.cellRenderer = GridDeleteCellComponent;
      colDef.sortable = false;
      colDef.filter = false;
      colDef.resizable = false;
      colDef.suppressMovable = true;
      colDef.editable = false;
      colDef.pinned = column.pin ?? 'right';
      colDef.width = column.width ?? 56;
      colDef.headerName = column.title ?? '';
      break;

    case 'custom-template':
      colDef.cellRenderer = GridTemplateCellComponent;
      break;
  }

  // ── Editing ────────────────────────────────────────────────────────────────
  // A computed column is owned by the calculation engine — making it typeable
  // would let a user enter a total that the next recalculation silently discards.
  if (column.compute) {
    colDef.editable = false;
    colDef.cellClass = [colDef.cellClass, 'grid-cell--computed'].filter(Boolean).join(' ');
  } else if (column.editable) {
    colDef.editable = typeof column.editable === 'function'
      ? (p) => (p.data ? (column.editable as (r: GridRow) => boolean)(p.data as GridRow) : false)
      : true;

    if (cellType === 'select' && column.options) {
      colDef.cellEditor = 'agSelectCellEditor';
      colDef.cellEditorParams = (p: { data?: GridRow }) => {
        const options = typeof column.options === 'function'
          ? column.options((p.data ?? {}) as GridRow)
          : column.options ?? [];
        return {
          // VALUES, not labels. The editor returns exactly what it is given, so
          // feeding it labels writes 'Approved' into a numeric status column and
          // breaks the DB-first value contract.
          values: options.map((o) => o.value),
          // …and this renders each code as its label in the list.
          formatValue: (v: unknown) =>
            options.find((o) => o.value === v)?.label ?? String(v ?? ''),
        };
      };
    } else if (isNumeric) {
      colDef.cellEditor = 'agNumberCellEditor';
    } else if (cellType === 'date') {
      colDef.cellEditor = 'agDateStringCellEditor';
    }
  }

  // Raw AG Grid overrides always win.
  return { ...colDef, ...(column.agOptions ?? {}) };
}

// ─── Serial (#) column ────────────────────────────────────────────────────────

/**
 * The standard ERP serial column. Numbers follow the CURRENT sort/filter order
 * and, in `'continuous'` mode, keep counting across pages (page 2 starts at 11)
 * — which is what users expect when they cross-reference a printed list.
 */
export function buildSerialColDef(config: GridConfig): ColDef {
  return {
    colId: '__serial',
    headerName: config.serialTitle ?? '#',
    width: 64,
    minWidth: 52,
    maxWidth: 90,
    pinned: 'left',
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    lockVisible: true,
    cellClass: 'grid-cell--center grid-cell--serial',
    headerClass: 'grid-header--center',
    // Excluded from exports — a serial is a view artefact, not data.
    context: { serial: true },
    valueGetter: (p: ValueGetterParams) => {
      if (p.node?.rowPinned) return '';
      // `rowIndex` is the position in the full sorted+filtered set, so it already
      // counts continuously across pages.
      const index = p.node?.rowIndex ?? 0;
      if ((config.serialMode ?? 'continuous') === 'per-page') {
        const size = p.api.paginationGetPageSize();
        return size > 0 ? (index % size) + 1 : index + 1;
      }
      return index + 1;
    },
  };
}

// ─── Delete (✕) column ────────────────────────────────────────────────────────

/** The auto-appended red ✕ column for editable line-item grids. */
export function buildDeleteColDef(onDelete: (row: GridRow) => void): ColDef {
  return {
    colId: '__delete',
    headerName: '',
    width: 56,
    minWidth: 48,
    maxWidth: 56,
    pinned: 'right',
    sortable: false,
    filter: false,
    resizable: false,
    editable: false,
    suppressMovable: true,
    lockVisible: true,
    cellClass: 'grid-cell--center',
    cellRenderer: GridDeleteCellComponent,
    cellRendererParams: { onDelete },
  };
}

// ─── Calculation engine ───────────────────────────────────────────────────────

/**
 * Recalculate one row in place.
 *
 * <p>Order matters: the row-level {@link GridConfig.recalculate} hook runs FIRST so
 * it sees the raw edited values, then per-column `compute` functions run in column
 * order. That lets a column derive from something the row hook just produced
 * (e.g. `net` computed by the hook, then a per-column `vat` off it).</p>
 */
export function recalculateRow(
  row: GridRow,
  columns: GridColumnDef[],
  recalculate?: (row: GridRow) => void,
): GridRow {
  recalculate?.(row);
  for (const column of columns) {
    if (column.compute) row[column.field] = column.compute(row);
  }
  return row;
}

// ─── Pinned bottom (totals) row ───────────────────────────────────────────────

/**
 * Build the pinned bottom row from the currently VISIBLE rows, or `null` when no
 * column asks for a footer. Totals reflect the active filter/search — a total that
 * ignored the filter would contradict the rows above it.
 */
export function buildFooterRow(columns: GridColumnDef[], rows: GridRow[]): GridRow | null {
  const wanted = columns.filter((c) => c.bottomTotal || c.footerLabel || c.footerValue);
  if (!wanted.length) return null;

  const footer: GridRow = {};
  for (const column of wanted) {
    if (column.footerValue) {
      footer[column.field] = column.footerValue(rows);
    } else if (column.bottomTotal) {
      footer[column.field] = rows.reduce((sum, r) => {
        const n = Number(r?.[column.field]);
        return Number.isNaN(n) ? sum : sum + n;
      }, 0);
    } else if (column.footerLabel) {
      footer[column.field] = column.footerLabel;
    }
  }
  return footer;
}

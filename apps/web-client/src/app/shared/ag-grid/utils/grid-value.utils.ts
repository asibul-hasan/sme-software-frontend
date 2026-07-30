import type { GridColumn, GridRowData, GridSelectOption } from '../models/grid-types';

/**
 * Value resolution — the single definition of "what is this cell, logically?".
 *
 * Search, sort, the footer and every export format all read through here, so a dropdown column
 * searches by the text on screen rather than the numeric code behind it, and an export never
 * dumps raw ids. Getting this wrong per-form is the classic table bug; there is one implementation.
 */

/** Resolves a `select` column's stored code to its option label. */
export function resolveSelectLabel(column: GridColumn, row: GridRowData): unknown {
  const raw = row?.[column.field];
  if (!column.options) return raw;

  const options: GridSelectOption[] =
    typeof column.options === 'function' ? column.options(row) : column.options;

  // Loose match as well as strict: ids arrive as numbers from the API but as strings from
  // form controls and query params, and a dropdown must not lose its label over that.
  const hit = options.find(
    (o) => o.value === raw || (raw != null && String(o.value) === String(raw)),
  );

  return hit?.label ?? raw;
}

/**
 * The cell's logical value.
 *
 * Order matters: an explicit `value` accessor always wins, then per-type resolution, then the
 * raw field.
 */
export function logicalValue(column: GridColumn, row: GridRowData): unknown {
  if (column.value) return column.value(row);

  const raw = row?.[column.field];

  switch (column.cellType) {
    case 'select':
      return resolveSelectLabel(column, row);
    case 'checkbox':
      return raw === 1 || raw === true || raw === '1' ? 'Yes' : 'No';
    case 'badge':
      return column.badge?.(raw, row)?.label ?? raw;
    default:
      return raw;
  }
}

/** Numeric cell types — used for alignment, footer sums and formatting. */
export function isNumericColumn(column: GridColumn): boolean {
  return (
    column.cellType === 'number' ||
    column.cellType === 'decimal' ||
    column.cellType === 'currency'
  );
}

/**
 * Effective horizontal alignment. Numbers right-align unless told otherwise, so digits line up
 * — a readability rule that should never be restated per form.
 */
export function resolveAlign(column: GridColumn): 'left' | 'center' | 'right' {
  return column.align ?? (isNumericColumn(column) ? 'right' : 'left');
}

/** Coerces to a number for footer aggregation; anything unparseable counts as zero. */
export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Builds the pinned footer row from the columns that declare one.
 *
 * Sums are computed over the rows passed in — the caller supplies the *visible* rows, so the
 * total reflects the current filter rather than the unfiltered input.
 */
export function buildFooterRow(
  columns: GridColumn[],
  visibleRows: GridRowData[],
): GridRowData | null {
  const participating = columns.filter((c) => c.footerSum || c.footer);
  if (!participating.length) return null;

  const footer: GridRowData = {};

  for (const column of participating) {
    if (typeof column.footer === 'function') {
      footer[column.field] = column.footer(visibleRows);
    } else if (column.footer) {
      footer[column.field] = column.footer;
    } else if (column.footerSum) {
      footer[column.field] = visibleRows.reduce((sum, row) => sum + toNumber(row[column.field]), 0);
    }
  }

  return footer;
}

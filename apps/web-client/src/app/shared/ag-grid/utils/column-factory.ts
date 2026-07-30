import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import type { TemplateRef } from '@angular/core';

import { GridBadgeCellComponent } from '../components/cells/badge-cell.component';
import {
  GridTemplateCellComponent,
  type GridCellContext,
} from '../components/cells/template-cell.component';
import { GRID_INTERNAL_COLUMNS } from '../constants/grid-defaults';
import type { AgGridConfig, GridColumn, GridRowData, GridSelectOption } from '../models/grid-types';
import {
  formatDate,
  formatNumber,
  GRID_DEFAULT_DATE_FORMAT,
  GRID_DEFAULT_DATETIME_FORMAT,
  toDayjsFormat,
  type NumberStyle,
} from './grid-format.utils';
import { isNumericColumn, logicalValue, resolveAlign } from './grid-value.utils';

/**
 * Translates our {@link GridColumn} vocabulary into AG Grid `ColDef`s.
 *
 * This is the only file in the application that knows AG Grid's column API. Forms describe what
 * a column *is*; every mechanical consequence — alignment, formatting, editors, search text,
 * comparators — is decided once here. Adding a cell type means editing this file, not auditing
 * hundreds of forms.
 */

/** Number formatting context, read lazily so a settings change re-renders without a rebuild. */
export type NumberContext = () => { precision: number; numberStyle: NumberStyle };

/** Templates projected by the form, looked up by a column's `templateName`. */
export type TemplateMap = Map<string, TemplateRef<GridCellContext>>;

export function buildColumnDefs(
  config: AgGridConfig,
  numberContext: NumberContext,
  templates: TemplateMap,
): ColDef[] {
  const defs = config.columns.map((column) =>
    buildColumnDef(column, config, numberContext, templates),
  );

  if (config.showRowNumbers) defs.unshift(buildRowNumberDef(config));

  return defs;
}

/**
 * The `#` column. Continuous across pages — a per-page 1..n restart makes a paginated list
 * impossible to talk about ("row 3" is ambiguous).
 *
 * Never exported: it is a view aid, not data.
 */
function buildRowNumberDef(config: AgGridConfig): ColDef {
  return {
    colId: GRID_INTERNAL_COLUMNS.rowNumber,
    headerName: '#',
    width: 56,
    minWidth: 56,
    maxWidth: 72,
    pinned: 'left',
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    lockPosition: 'left',
    cellClass: 'grid-cell--row-number',
    valueGetter: (params: ValueGetterParams) => {
      if (params.node?.rowPinned) return '';
      const index = params.node?.rowIndex;
      return index == null ? '' : index + 1;
    },
    context: { internal: true },
  };
}

function buildColumnDef(
  column: GridColumn,
  config: AgGridConfig,
  numberContext: NumberContext,
  templates: TemplateMap,
): ColDef {
  const align = resolveAlign(column);

  const def: ColDef = {
    colId: column.field,
    field: column.field,
    headerName: column.title,
    hide: column.hidden ?? false,
    pinned: column.pinned,
    sortable: column.sortable ?? true,
    filter: column.filter ?? false,
    resizable: column.resizable ?? true,
    suppressMovable: config.suppressMovable,
    headerTooltip: column.tooltip,
    cellClass: align === 'left' ? undefined : `grid-cell--${align}`,
    // Column context carries our definition through to cell renderers and editors, so they
    // never need a second lookup path back to the form.
    context: { column, templates },
  };

  if (column.width != null) def.width = column.width;
  if (column.minWidth != null) def.minWidth = column.minWidth;
  if (column.maxWidth != null) def.maxWidth = column.maxWidth;
  if (column.flex != null) def.flex = column.flex;

  applyEditing(def, column, config);
  applyRenderer(def, column, numberContext);
  applySearchAndSort(def, column);

  return def;
}

/**
 * Editing.
 *
 * A column with a `value` accessor is only given a `valueGetter` when it is NOT editable: a
 * getter replaces the stored value, so on an editable column AG Grid would have nothing to write
 * back to and the edit would vanish silently. Editable columns get quick-filter text instead —
 * searchable, still writable.
 */
function applyEditing(def: ColDef, column: GridColumn, config: AgGridConfig): void {
  const editable = column.editable ?? false;
  if (!editable || !config.editable) return;

  def.editable =
    typeof editable === 'function'
      ? (params) => (editable as (row: GridRowData) => boolean)(params.data as GridRowData)
      : true;

  if (column.cellType === 'select' && column.options) {
    def.cellEditor = 'agSelectCellEditor';
    def.cellEditorParams = (params: { data?: GridRowData }) => {
      const options = resolveOptions(column, (params.data ?? {}) as GridRowData);
      return {
        values: options.map((o) => o.value),
        // Editor shows labels while the row keeps the code the backend persists.
        formatValue: (value: unknown) =>
          options.find((o) => o.value === value)?.label ?? String(value ?? ''),
      };
    };
  } else if (isNumericColumn(column)) {
    def.cellEditor = 'agNumberCellEditor';
  }
}

function resolveOptions(column: GridColumn, row: GridRowData): GridSelectOption[] {
  if (!column.options) return [];
  return typeof column.options === 'function' ? column.options(row) : column.options;
}

/** Cell rendering and display formatting. */
function applyRenderer(def: ColDef, column: GridColumn, numberContext: NumberContext): void {
  switch (column.cellType) {
    case 'badge':
      def.cellRenderer = GridBadgeCellComponent;
      break;

    case 'template':
      def.cellRenderer = GridTemplateCellComponent;
      def.sortable = column.sortable ?? false;
      break;

    case 'number':
      def.valueFormatter = (p) => formatNumber(p.value, column.precision ?? 0, numberContext().numberStyle);
      break;

    case 'decimal':
    case 'currency': {
      def.valueFormatter = (p) => {
        const ctx = numberContext();
        return formatNumber(p.value, column.precision ?? ctx.precision, ctx.numberStyle);
      };
      break;
    }

    case 'date':
      def.valueFormatter = (p) =>
        formatDate(p.value, toDayjsFormat(column.dateFormat, GRID_DEFAULT_DATE_FORMAT));
      break;

    case 'datetime':
      def.valueFormatter = (p) =>
        formatDate(p.value, toDayjsFormat(column.dateFormat, GRID_DEFAULT_DATETIME_FORMAT));
      break;

    case 'checkbox':
      def.valueFormatter = (p) => (p.value === 1 || p.value === true || p.value === '1' ? '✓' : '');
      def.cellClass = 'grid-cell--center';
      break;

    case 'select':
      // Display resolves through the shared value logic below; no formatter needed here.
      break;

    default:
      break;
  }
}

/**
 * Search and sort operate on the logical value — the text on screen — not the raw field, so a
 * dropdown of numeric codes is searchable by its labels and sorts alphabetically rather than by
 * id.
 */
function applySearchAndSort(def: ColDef, column: GridColumn): void {
  const displayDiffers =
    !!column.value ||
    column.cellType === 'select' ||
    column.cellType === 'checkbox' ||
    column.cellType === 'badge';

  if (!displayDiffers) return;

  const isEditable = !!def.editable;

  if (column.value && !isEditable) {
    def.valueGetter = (params: ValueGetterParams) =>
      params.data ? logicalValue(column, params.data as GridRowData) : null;
  }

  if (!def.valueGetter) {
    def.getQuickFilterText = (params) =>
      params.data ? String(logicalValue(column, params.data as GridRowData) ?? '') : '';

    def.comparator = (_a, _b, nodeA, nodeB) => {
      const left = String(logicalValue(column, (nodeA?.data ?? {}) as GridRowData) ?? '');
      const right = String(logicalValue(column, (nodeB?.data ?? {}) as GridRowData) ?? '');
      return left.localeCompare(right);
    };
  }
}

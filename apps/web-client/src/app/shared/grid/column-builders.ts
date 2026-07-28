import type { GridColumnDef, GridRow, GridRowAction, GridSelectOption } from './grid.types';

/**
 * Small builders for the column shapes that repeat in every editable grid.
 *
 * They exist to remove boilerplate that is easy to get subtly wrong — chiefly the `value:`
 * accessor people add to `select` columns. The grid already resolves a select's stored code to
 * its option label for search, sort and export (see `logicalValue`), so a hand-written
 * `value: (r) => options.find(o => o.value === r[field])?.label ?? ''` duplicates built-in
 * behaviour and has to be kept in step with the options list by hand.
 *
 * ```ts
 * readonly columns: GridColumnDef[] = [
 *   col.text('Step Name', 'step_name', { flex: 1, onChange: this.patch('step_name') }),
 *   col.select('Step Type', 'step_type', () => sysConstants.approvalStepTypes,
 *              { width: 150, onChange: this.patch('step_type') }),
 *   col.remove((row) => this.model.removeStep(row['__uid'] as number), 'Remove Step'),
 * ];
 * ```
 */

/** Options accepted by every builder — the parts of a column a caller usually varies. */
type ColumnOptions = Partial<
  Pick<
    GridColumnDef,
    | 'width' | 'minWidth' | 'maxWidth' | 'flex' | 'align' | 'pin' | 'hidden'
    | 'editable' | 'onChange' | 'tooltip' | 'sortable' | 'filter' | 'cellClass'
  >
>;

/** Editable by default: these builders exist for editable detail grids. */
function base(title: string, field: string, options: ColumnOptions): GridColumnDef {
  return { title, field, editable: true, ...options };
}

export const col = {
  /** Free-text column. */
  text(title: string, field: string, options: ColumnOptions = {}): GridColumnDef {
    return base(title, field, options);
  },

  /** Numeric column — right-aligned by the grid automatically. */
  number(title: string, field: string, options: ColumnOptions = {}): GridColumnDef {
    return { ...base(title, field, options), cellType: 'number' };
  },

  /**
   * Dropdown column. Displays the option `label` and stores the option `value` — the code the
   * backend persists.
   *
   * Deliberately sets no `value:` accessor: adding one duplicates the grid's own label
   * resolution, and on a read-only column it would additionally install a `valueGetter` that
   * replaces the stored code.
   */
  select(
    title: string,
    field: string,
    options: GridSelectOption[] | ((row: GridRow) => GridSelectOption[]),
    columnOptions: ColumnOptions = {},
  ): GridColumnDef {
    return { ...base(title, field, columnOptions), cellType: 'select', options };
  },

  /**
   * Dropdown with a leading "all / none" choice, for a nullable foreign key.
   * `col.selectNullable('Branch', 'branch_no', opts, '-- All Branches --')`
   */
  selectNullable(
    title: string,
    field: string,
    options: () => GridSelectOption[],
    emptyLabel: string,
    columnOptions: ColumnOptions = {},
  ): GridColumnDef {
    return col.select(title, field, () => [{ value: null, label: emptyLabel }, ...options()], columnOptions);
  },

  /** Checkbox column over the numeric `1/0` flag contract. */
  check(title: string, field: string, options: ColumnOptions = {}): GridColumnDef {
    return { ...base(title, field, options), cellType: 'checkbox', width: options.width ?? 90 };
  },

  /** Pinned action column. */
  actions(actions: GridRowAction[], options: ColumnOptions = {}): GridColumnDef {
    return {
      title: '',
      field: '__actions',
      cellType: 'actions',
      width: 60,
      pin: 'right',
      editable: false,
      sortable: false,
      filter: false,
      ...options,
      actions,
    };
  },

  /** The single-✕ remove column every editable detail grid ends with. Confirms before firing. */
  remove(onRemove: (row: GridRow) => void, tooltip = 'Remove row', options: ColumnOptions = {}): GridColumnDef {
    return col.actions([{ kind: 'delete', tooltip, onClick: onRemove }], options);
  },
};

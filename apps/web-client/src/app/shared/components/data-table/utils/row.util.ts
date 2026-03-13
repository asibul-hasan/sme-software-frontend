// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Row Utility
// ═══════════════════════════════════════════════════════════════════

import { ColumnDef, RowData, SqlState } from '../types/data-table.types';

let _counter = 0;

/** Generate a stable unique row ID */
export function newRowId(prefix = 'row'): string {
  return `${prefix}-${++_counter}-${Date.now()}`;
}

/** Stamp every row with a _rowId and default sqlState */
export function stampRows(rows: RowData[]): RowData[] {
  return rows.map((r, i) => ({
    ...r,
    _rowId: r['_rowId'] || newRowId(),
    sqlState: r['sqlState'] ?? SqlState.UNCHANGED,
    _original: r['_original'] || undefined,
  }));
}

/** Create a blank new row from column definitions */
export function createBlankRow(columns: ColumnDef[]): RowData {
  const row: RowData = {
    _rowId: newRowId('new'),
    sqlState: SqlState.INSERT,
  };
  for (const col of columns) {
    row[col.key] =
      col.type === 'boolean'
        ? false
        : col.type === 'number'
          ? 0
          : col.type === 'select'
            ? (col.options?.[0]?.value ?? '')
            : '';
  }
  return row;
}

/** Deep-clone a row as a duplicate insert */
export function duplicateRow(row: RowData): RowData {
  const dup = { ...row };
  dup['_rowId'] = newRowId('dup');
  dup['sqlState'] = SqlState.INSERT;
  delete dup['_original'];
  return dup;
}

/** Mark a row for deletion or remove if it was a new (INSERT) row */
export function markRowDeleted(rows: RowData[], rowId: string): RowData[] {
  return rows.reduce<RowData[]>((acc, r) => {
    if (r['_rowId'] !== rowId) {
      acc.push(r);
      return acc;
    }
    if (r['sqlState'] === SqlState.INSERT) return acc; // drop entirely
    acc.push({ ...r, sqlState: SqlState.DELETE });
    return acc;
  }, []);
}

/** Revert a row to its original values (UNCHANGED) */
export function revertRow(rows: RowData[], rowId: string): RowData[] {
  return rows.map((r) => {
    if (r['_rowId'] !== rowId || !r['_original']) return r;
    return {
      ...r['_original'],
      _rowId: rowId,
      sqlState: SqlState.UNCHANGED,
      _original: undefined,
    };
  });
}

/** Apply an edit to a row, storing _original on first edit */
export function applyEdit(
  rows: RowData[],
  rowId: string,
  key: string,
  value: any,
): RowData[] {
  return rows.map((r) => {
    if (r['_rowId'] !== rowId) return r;
    const original = r['_original'] || { ...r };
    return {
      ...r,
      [key]: value,
      _original: original,
      sqlState:
        r['sqlState'] === SqlState.INSERT ? SqlState.INSERT : SqlState.UPDATE,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Validation Utility
// ═══════════════════════════════════════════════════════════════════

import {
  ColumnDef,
  RowData,
  CellValidation,
  ValidationMap,
} from '../types/data-table.types';

/**
 * Validates a single cell value against a column's validation rules.
 * Returns { valid, message }.
 */
export function validateCell(
  col: ColumnDef,
  value: any,
  row: RowData,
): CellValidation {
  const rules = col.validation;
  if (!rules) return { valid: true, message: null };

  const strVal = value === null || value === undefined ? '' : String(value);

  if (rules.required && strVal.trim() === '') {
    return { valid: false, message: `${col.header} is required` };
  }

  if (rules.minLength !== undefined && strVal.length < rules.minLength) {
    return {
      valid: false,
      message: `${col.header} must be at least ${rules.minLength} characters`,
    };
  }

  if (rules.maxLength !== undefined && strVal.length > rules.maxLength) {
    return {
      valid: false,
      message: `${col.header} must be at most ${rules.maxLength} characters`,
    };
  }

  if (
    col.type === 'number' ||
    col.type === 'currency' ||
    col.type === 'percentage'
  ) {
    const num = Number(value);
    if (isNaN(num))
      return { valid: false, message: `${col.header} must be a number` };
    if (rules.min !== undefined && num < rules.min) {
      return { valid: false, message: `${col.header} must be ≥ ${rules.min}` };
    }
    if (rules.max !== undefined && num > rules.max) {
      return { valid: false, message: `${col.header} must be ≤ ${rules.max}` };
    }
  }

  if (rules.pattern && !rules.pattern.test(strVal)) {
    return { valid: false, message: `${col.header} format is invalid` };
  }

  if (rules.custom) {
    const msg = rules.custom(value, row);
    if (msg) return { valid: false, message: msg };
  }

  return { valid: true, message: null };
}

/**
 * Validates an entire row against all column rules.
 * Returns a ValidationMap keyed by rowId → colKey → CellValidation.
 */
export function validateRow(
  rowId: string,
  row: RowData,
  columns: ColumnDef[],
): ValidationMap {
  const result: ValidationMap = { [rowId]: {} };
  for (const col of columns) {
    if (col.validation) {
      result[rowId][col.key] = validateCell(col, row[col.key], row);
    }
  }
  return result;
}

/** Returns true if there are NO invalid cells across the entire map. */
export function isValidationMapClean(map: ValidationMap): boolean {
  return Object.values(map).every((rowMap) =>
    Object.values(rowMap).every((cell) => cell.valid),
  );
}

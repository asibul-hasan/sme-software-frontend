import { GridLookupOption } from '../models/grid-config.model';

/**
 * Resolves a column's `options` (static list or row-dependent function) to a plain list.
 */
export function resolveLookupOptions<T = any>(
  options: GridLookupOption[] | ((row: T) => GridLookupOption[]) | undefined,
  row: T,
): GridLookupOption[] {
  if (!options) return [];
  const resolved = typeof options === 'function' ? options(row) : options;
  return resolved ?? [];
}

/**
 * Matches a raw cell value against the option list.
 *
 * Falls back to a string comparison so a numeric enum persisted as `"1"` still
 * resolves against an option declared as `1` (and vice versa) — otherwise the
 * cell shows a raw code and the editor opens with nothing selected.
 */
export function matchLookupOption(
  options: GridLookupOption[],
  value: unknown,
): GridLookupOption | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return (
    options.find((o) => o.value === value) ??
    options.find((o) => String(o.value) === String(value))
  );
}

/**
 * Compares two grid cell values for semantic equality.
 *
 * Prevents false-positive cell change events when entering/exiting edit mode
 * with equivalent values (e.g. null vs undefined vs empty string, number vs numeric string, boolean vs 1/0).
 */
export function areGridValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // Handle null / undefined / empty string equivalence
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA && emptyB) return true;
  if (emptyA !== emptyB) return false;

  // Numbers vs numeric strings (e.g. 1 === "1", 100.0 === "100")
  if (typeof a === 'number' && typeof b === 'string') {
    const numB = Number(b);
    return !isNaN(numB) && a === numB;
  }
  if (typeof a === 'string' && typeof b === 'number') {
    const numA = Number(a);
    return !isNaN(numA) && numA === b;
  }

  // Boolean vs 1/0 numeric representation
  if (
    (typeof a === 'boolean' || typeof a === 'number') &&
    (typeof b === 'boolean' || typeof b === 'number')
  ) {
    return (a ? 1 : 0) === (b ? 1 : 0);
  }

  // Trimmed string comparison
  if (typeof a === 'string' && typeof b === 'string') {
    return a.trim() === b.trim();
  }

  return false;
}

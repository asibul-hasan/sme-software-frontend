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

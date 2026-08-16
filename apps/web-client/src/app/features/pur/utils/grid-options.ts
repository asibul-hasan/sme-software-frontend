import { GridLookupOption } from '../../../shared/ag-grid/models/grid-config.model';

/**
 * Lookup rows across PUR arrive as `{ no, name }` — from `CommonLookupService` and from the
 * form-scoped `/lookups` endpoints alike — while the grid speaks `{ value, label }`.
 *
 * Pass this INSIDE a column's options function (`() => toGridOptions(this.products())`) so the
 * list stays reactive as the lookup loads. Mapping it once at build time would freeze an empty
 * array and the column would silently render raw codes.
 */
export function toGridOptions(
  list: readonly { no: number; name: string }[] | null | undefined,
): GridLookupOption[] {
  return (list ?? []).map((o) => ({ value: o.no, label: o.name }));
}

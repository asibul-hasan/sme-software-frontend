import type { GridConfig, GridRow } from './grid.types';

/**
 * Ready-made {@link GridConfig} shapes for the grid archetypes that recur across the ERP.
 *
 * A preset exists so a form states its *intent* ("this is an editable detail grid") instead of
 * re-declaring a dozen chrome flags. Every form that hand-rolls the same twenty lines is a form
 * that will drift — one turns pagination on, another forgets `rowKey`, and the grids stop
 * behaving alike. Spread a preset and override only what genuinely differs.
 */

/**
 * An editable detail grid living inside a card in a master-detail form.
 *
 * Chrome off (the card header owns the title and the Add button), dense, and
 * keyed by `__uid` — the client-side row identity used before rows have a server primary key.
 *
 * ```ts
 * readonly stepGridConfig = detailGridConfig({
 *   newRowDefaults: () => ({ step_number: 1, is_active: 1 }),
 * });
 * ```
 */
export function detailGridConfig(overrides: Partial<GridConfig> = {}): Partial<GridConfig> {
  return {
    showToolbar: false,
    showSearch: false,
    showExport: false,
    showColumnToggle: false,
    showAdd: false,
    showDelete: false,
    showSerial: true,
    pagination: false,
    dense: true,
    rowKey: '__uid',
    editable: true,
    ...overrides,
  };
}

/**
 * A read-only list grid: full toolbar, search, export and pagination.
 * The default for "browse these records" screens.
 */
export function listGridConfig(overrides: Partial<GridConfig> = {}): Partial<GridConfig> {
  return {
    showToolbar: true,
    showSearch: true,
    showExport: true,
    showColumnToggle: true,
    showSerial: true,
    pagination: true,
    dense: true,
    ...overrides,
  };
}

/** Row shape used by the detail grids — a client-side uid plus arbitrary fields. */
export type UidRow = GridRow & { __uid: number };

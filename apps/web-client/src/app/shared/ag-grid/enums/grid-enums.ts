/**
 * Row density. Kept as string unions (not TS enums) to match the rest of the codebase —
 * they serialise straight into persisted grid state with no conversion.
 */
export type GridDensity = 'compact' | 'comfortable' | 'spacious';

export type GridExportFormat = 'excel' | 'csv' | 'pdf' | 'print';

export type GridSelectionMode = 'none' | 'single' | 'multiple';

/**
 * Pixel metrics per density — one source, so a density change moves rows and header
 * together instead of leaving the header out of proportion with the body.
 */
export const GRID_DENSITY_METRICS: Readonly<
  Record<GridDensity, { rowHeight: number; headerHeight: number }>
> = {
  compact: { rowHeight: 30, headerHeight: 34 },
  comfortable: { rowHeight: 38, headerHeight: 40 },
  spacious: { rowHeight: 46, headerHeight: 46 },
};

export const GRID_DENSITY_ORDER: readonly GridDensity[] = ['compact', 'comfortable', 'spacious'];

// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Constants
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_DENSITY_INDEX = 1; // 0=compact, 1=normal, 2=comfortable
export const DEFAULT_EMPTY_MESSAGE = 'No records found';
export const DEFAULT_EMPTY_ICON = 'inbox';
export const DEFAULT_CURRENCY_CODE = 'USD';
export const DEFAULT_EXPORT_FILENAME = 'export';

export const DENSITY_CYCLE = [
  { class: 'density-compact', icon: 'density_small', label: 'Compact' },
  { class: 'density-normal', icon: 'density_medium', label: 'Normal' },
  { class: 'density-comfortable', icon: 'density_large', label: 'Comfortable' },
] as const;

export type DensityOption = (typeof DENSITY_CYCLE)[number];

/** Material icon names for sort states */
export const SORT_ICONS = {
  none: 'unfold_more',
  asc: 'arrow_upward',
  desc: 'arrow_downward',
} as const;

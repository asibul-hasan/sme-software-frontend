import { iconSetMaterial, themeQuartz } from 'ag-grid-community';

/**
 * The ERP grid theme.
 *
 * Every colour is a CSS custom property from the application's design tokens rather than a
 * literal. That is what makes light and dark themes work from one definition — the tokens change
 * under the grid, the grid does not need a second palette. It also means a grid never drifts
 * visually from the cards and forms around it.
 *
 * Density metrics are intentionally NOT set here; they are applied per grid at runtime from
 * `GRID_DENSITY_METRICS`, so the density toggle changes rows and header together.
 */
export const aidlyErpGridTheme = themeQuartz.withPart(iconSetMaterial).withParams({
  // Surfaces
  backgroundColor: 'var(--card-bg)',
  foregroundColor: 'var(--text-primary)',
  borderColor: 'var(--table-row-border, var(--border-color))',

  // Header — the anchor of the whole grid; slightly heavier than the body.
  headerBackgroundColor: 'var(--table-header-bg, var(--bg-secondary))',
  headerTextColor: 'var(--text-primary)',
  headerFontWeight: '600',
  headerFontSize: 'var(--text-sm, 13px)',

  // Rows
  oddRowBackgroundColor: 'transparent',
  rowHoverColor: 'var(--table-row-hover, rgba(99, 102, 241, 0.06))',
  selectedRowBackgroundColor: 'var(--table-row-selected, rgba(99, 102, 241, 0.12))',

  // Accents
  accentColor: 'var(--primary, #6366f1)',
  rangeSelectionBorderColor: 'var(--primary, #6366f1)',

  // Typography — compact by default; ERP screens are dense by nature.
  fontFamily: 'inherit',
  fontSize: 'var(--text-sm, 13px)',

  // Chrome
  wrapperBorderRadius: '0px',
  wrapperBorder: false,
  headerColumnBorder: false,
  columnBorder: false,
  cellHorizontalPadding: '10px',
});

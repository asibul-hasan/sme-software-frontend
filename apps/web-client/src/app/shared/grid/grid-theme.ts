import { themeQuartz, iconSetMaterial } from 'ag-grid-community';

/**
 * The single AG Grid theme for the whole ERP.
 *
 * <p>Built with the AG Grid Theming API (v33+) rather than the legacy CSS files, so
 * <b>no</b> `ag-grid.css` / `ag-theme-*.css` import is needed — that avoids the
 * stylesheet fighting the app's own global form/table styles.</p>
 *
 * <p>Every colour is expressed as a reference to an existing app design token
 * (`--card-bg`, `--text-primary`, `--indigo`, …). Those tokens are redefined under
 * `[data-theme='dark']`, so the grid follows the app's light/dark switch with no
 * second theme definition and no JS involvement.</p>
 *
 * <p>Sizing follows the same rhythm as the standard table (`--field-height`, the
 * dense 13.5px type scale) so a grid sits naturally beside form fields.</p>
 */
export const aidlyGridTheme = themeQuartz
  .withPart(iconSetMaterial)
  .withParams({
    // ── Surface ──────────────────────────────────────────────────────────────
    backgroundColor: 'var(--card-bg)',
    foregroundColor: 'var(--text-primary)',
    borderColor: 'var(--table-row-border, var(--border-color))',
    wrapperBorder: false,
    wrapperBorderRadius: '0px',

    // ── Header ───────────────────────────────────────────────────────────────
    headerBackgroundColor: 'var(--table-header-bg, var(--bg-secondary))',
    headerTextColor: 'var(--text-primary)',
    headerFontWeight: 700,
    headerFontSize: 'var(--text-sm, 13px)',
    headerColumnBorder: false,
    headerRowBorder: true,

    // ── Rows ─────────────────────────────────────────────────────────────────
    oddRowBackgroundColor: 'var(--bg-secondary)',
    // Hover and selection must be TELLABLE APART — previously both were
    // `--select-bg`, so pointing at a row looked identical to having selected it.
    //
    // AG Grid v33+ does not put these on the row's `background-color`; it feeds
    // them into `--ag-internal-row-overlay-color`, painted as an overlay above the
    // row. So an OPAQUE cell background (a read-only/computed cell) hides the
    // highlight for that column — see `.grid-cell--computed` in the stylesheet,
    // which stays translucent and clears entirely on an active row.
    rowHoverColor: 'var(--grid-row-hover)',
    selectedRowBackgroundColor: 'var(--grid-row-selected)',
    rowBorder: true,

    // ── Accent / interaction ─────────────────────────────────────────────────
    accentColor: 'var(--indigo)',
    // Native widgets (scrollbars, checkboxes) follow the app theme rather than
    // being pinned to light — `data-theme` sets `color-scheme` on the document.
    browserColorScheme: 'inherit',

    // ── Type ─────────────────────────────────────────────────────────────────
    fontFamily: 'var(--font-family-base)',
    fontSize: 'var(--text-base, 13.5px)',

    // ── Inputs inside the grid (filters, editors) ────────────────────────────
    inputBackgroundColor: 'var(--input-bg)',
    inputBorder: { color: 'var(--input-border)' },
    inputFocusBorder: { color: 'var(--input-focus-border)' },
    inputTextColor: 'var(--text-primary)',

    // ── Menus / popups ───────────────────────────────────────────────────────
    menuBackgroundColor: 'var(--card-bg)',
    menuTextColor: 'var(--text-primary)',
    menuBorder: { color: 'var(--border-color)' },
    tooltipBackgroundColor: 'var(--card-bg)',
    tooltipTextColor: 'var(--text-primary)',

    // ── Spacing ──────────────────────────────────────────────────────────────
    cellHorizontalPadding: '10px',
    borderRadius: '6px',
  });

/** Row/header heights matching the app's dense table rhythm. */
export const GRID_SIZING = {
  dense: { rowHeight: 30, headerHeight: 34 },
  normal: { rowHeight: 38, headerHeight: 40 },
} as const;

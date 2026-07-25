import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import {
  AllCommunityModule,
  ModuleRegistry,
  provideGlobalGridOptions,
} from 'ag-grid-community';

import { aidlyGridTheme } from './grid-theme';

/**
 * Registers AG Grid once for the application.
 *
 * <p>AG Grid v33+ ships as registrable modules — without this every grid throws at
 * runtime. Registration is done through an environment initializer (rather than a
 * bare import side-effect) so it is explicit, ordered, and survives tree-shaking.</p>
 *
 * <p>Only the <b>Community</b> module set is registered. Community covers everything
 * the ERP needs today: sorting, filtering, pagination, column pinning/resize/reorder,
 * row selection, cell renderers/editors, the pinned bottom (totals) row and CSV
 * export. Excel and PDF export continue to run through the app's own
 * {@code TableExportService}, so no Enterprise licence is required.</p>
 *
 * Register in `app.config.ts`:
 * ```ts
 * providers: [ …, provideAidlyGrid() ]
 * ```
 */
export function provideAidlyGrid(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      ModuleRegistry.registerModules([AllCommunityModule]);

      // App-wide grid defaults. Anything set per-grid still wins.
      provideGlobalGridOptions({
        theme: aidlyGridTheme,
        // Grids are read-mostly; animation on large sets costs more than it gives.
        animateRows: false,
        suppressCellFocus: false,
        // Keep the browser's own context menu (Community has no custom one).
        preventDefaultOnContextMenu: false,
      });
    }),
  ]);
}

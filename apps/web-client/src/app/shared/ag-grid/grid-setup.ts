import {
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';

import { aidlyErpGridTheme } from './theme/grid-theme';

/**
 * Registers the grid framework once for the application.
 *
 * AG Grid v33+ ships as registrable modules — without registration every grid throws at runtime.
 * Doing it through an environment initializer (rather than a bare import side-effect) keeps it
 * explicit, ordered, and safe from tree-shaking.
 *
 * ### Edition
 *
 * Only the **Community** module set is registered, and the framework is built to need nothing
 * more. Community covers sorting, filtering, pagination, pinning, resizing, reordering,
 * selection, editing, cell renderers and the pinned totals row.
 *
 * Excel export runs through the app's own `TableExportService` rather than AG Grid's, which is
 * an Enterprise feature — so exporting costs no licence.
 *
 * Row grouping, aggregation, tree data, master/detail and the server-side row model are
 * Enterprise-only and therefore unavailable. `AgGridConfig` reserves typed slots for them so
 * adopting a licence later is a configuration change, not a rewrite. For very large datasets
 * without a licence, the Community **infinite** row model is the supported path.
 *
 * ```ts
 * providers: [ …, provideErpGrid() ]
 * ```
 */
export function provideErpGrid(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      ModuleRegistry.registerModules([AllCommunityModule]);

      provideGlobalGridOptions({
        theme: aidlyErpGridTheme,
        // ERP grids are read-mostly and often long; row animation costs more than it adds.
        animateRows: false,
        // Keep the browser's own context menu — a custom one is Enterprise.
        preventDefaultOnContextMenu: false,
      });
    }),
  ]);
}

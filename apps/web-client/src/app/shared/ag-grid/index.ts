/**
 * The ERP grid framework — the single import path for every form.
 *
 * ```ts
 * import { GridBuilder, GridComponent, col } from '@app/shared/ag-grid';
 * ```
 *
 * Forms use exactly three things: {@link GridBuilder} to describe a grid, {@link col} to
 * describe its columns, and `<app-grid>` to render it. Everything else — services, cell
 * renderers, the AG Grid column API — is an implementation detail behind them, so the framework
 * can evolve without a sweep through hundreds of screens.
 *
 * Register once in `app.config.ts`:
 * ```ts
 * providers: [ …, provideErpGrid() ]
 * ```
 */

// Public API
export { GridBuilder } from './builder/grid-builder';
export { col } from './builder/column-builder';
export { GridComponent } from './components/grid.component';
export { GridCellDirective } from './directives/grid-cell.directive';
export { provideErpGrid } from './grid-setup';

// Types a form touches when typing its own handlers
export type {
  AgGridConfig,
  GridBadge,
  GridCellEdit,
  GridCellTemplate,
  GridColumn,
  GridCounts,
  GridId,
  GridPersistedState,
  GridRowData,
  GridSelectOption,
  GridStatePersistence,
  GridToolbarConfig,
} from './models/grid-types';

export type { GridDensity, GridExportFormat, GridSelectionMode } from './enums/grid-enums';

// Services — injected by the grid, exported so a form can type a reference or swap persistence
export { GridApiService } from './services/grid-api.service';
export { GridColumnService } from './services/grid-column.service';
export { GridExportService } from './services/grid-export.service';
export { GridFilterService } from './services/grid-filter.service';
export { GridSelectionService } from './services/grid-selection.service';
export {
  GridStateService,
  GRID_STATE_PERSISTENCE,
  LocalStorageGridState,
} from './services/grid-state.service';

// Sub-components, for a form that composes its own chrome
export { GridStatusBarComponent } from './components/grid-status-bar.component';
export { GridToolbarComponent } from './components/grid-toolbar.component';

// Constants worth referencing from a form
export {
  GRID_DEFAULT_PAGE_SIZE,
  GRID_FALLBACK_HEIGHT,
  GRID_PAGE_SIZE_OPTIONS,
} from './constants/grid-defaults';

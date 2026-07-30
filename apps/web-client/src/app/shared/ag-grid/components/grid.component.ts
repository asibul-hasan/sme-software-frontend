import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  CellValueChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  RowClickedEvent,
  RowDoubleClickedEvent,
} from 'ag-grid-community';

import { AppSettingsService } from '../../../core/services/app-settings.service';
import { GRID_DENSITY_METRICS, type GridDensity } from '../enums/grid-enums';
import type {
  AgGridConfig,
  GridCellEdit,
  GridColumn,
  GridRowData,
} from '../models/grid-types';
import { GridApiService } from '../services/grid-api.service';
import { GridColumnService } from '../services/grid-column.service';
import { GridExportService } from '../services/grid-export.service';
import { GridFilterService } from '../services/grid-filter.service';
import { GridSelectionService } from '../services/grid-selection.service';
import { GridStateService } from '../services/grid-state.service';
import { buildColumnDefs, type TemplateMap } from '../utils/column-factory';
import { buildFooterRow } from '../utils/grid-value.utils';
import { GridCellDirective } from '../directives/grid-cell.directive';
import { GridStatusBarComponent } from './grid-status-bar.component';
import { GridToolbarComponent } from './grid-toolbar.component';

/**
 * `<app-grid>` — the single grid component for the ERP.
 *
 * ```html
 * <app-grid [config]="grid" [data]="rows()" height="520px" (ready)="api = $event" />
 * ```
 *
 * ### Design
 *
 * The component is deliberately thin. It owns the template and the AG Grid event wiring; every
 * capability lives in a service ({@link GridStateService}, {@link GridExportService}, …) that is
 * provided **per instance**. Two grids on one screen therefore never share selection, filters or
 * saved layout — SYS1108 has three, and instance isolation is what makes that safe.
 *
 * Config is static and data is reactive: rows flow through `[data]` so refreshing a list never
 * rebuilds columns or loses the user's layout.
 *
 * Height is a per-screen decision, taken from `[height]`; the config's `defaultHeight` is only a
 * fallback so a forgotten input can't render an invisible grid.
 */
@Component({
  selector: 'app-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // AG Grid renders its own DOM outside Angular's emulated encapsulation, so styling it
  // requires None. Every selector is namespaced under .app-grid to stay leak-free.
  encapsulation: ViewEncapsulation.None,
  imports: [AgGridAngular, MatIconModule, GridToolbarComponent, GridStatusBarComponent],
  providers: [
    GridApiService,
    GridStateService,
    GridSelectionService,
    GridExportService,
    GridColumnService,
    GridFilterService,
  ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
})
export class GridComponent {
  // ── Injected, instance-scoped ──────────────────────────────────────────────
  readonly gridApi = inject(GridApiService);
  readonly selection = inject(GridSelectionService);
  readonly columnService = inject(GridColumnService);
  readonly filterService = inject(GridFilterService);
  private readonly state = inject(GridStateService);
  private readonly exportService = inject(GridExportService);
  private readonly settings = inject(AppSettingsService);
  private readonly host = inject(ElementRef<HTMLElement>);

  // ── Inputs ─────────────────────────────────────────────────────────────────
  readonly config = input.required<AgGridConfig>();
  readonly data = input<GridRowData[]>([]);

  /** Per-screen height. Falls back to the config's `defaultHeight`. */
  readonly height = input<string>();

  readonly loading = input(false);

  /** Message shown instead of rows. Set it to surface a load failure. */
  readonly error = input<string | null>(null);

  // ── Outputs ────────────────────────────────────────────────────────────────
  readonly ready = output<GridApiService>();
  readonly rowClick = output<GridRowData>();
  readonly rowDoubleClick = output<GridRowData>();
  readonly selectionChange = output<GridRowData[]>();
  readonly cellEdit = output<GridCellEdit>();
  readonly refresh = output<void>();

  // ── Projected cell templates ───────────────────────────────────────────────
  private readonly cellTemplates = contentChildren(GridCellDirective);

  private readonly templateMap = computed<TemplateMap>(() => {
    const map: TemplateMap = new Map();
    for (const directive of this.cellTemplates()) map.set(directive.appGridCell(), directive.template);
    return map;
  });

  // ── Local state ────────────────────────────────────────────────────────────
  private api: GridApi | null = null;
  readonly density = signal<GridDensity>('comfortable');
  readonly isFullScreen = signal(false);
  /** Bumped on filter/sort/pagination so derived views recompute. */
  private readonly viewVersion = signal(0);

  readonly effectiveHeight = computed(() => this.height() ?? this.config().defaultHeight);

  readonly columnDefs = computed(() =>
    buildColumnDefs(
      this.config(),
      () => {
        const s = this.settings.current();
        return { precision: s.precision, numberStyle: s.numberStyle };
      },
      this.templateMap(),
    ),
  );

  /** Pinned totals row, computed over the rows currently passing the filter. */
  readonly pinnedBottomRows = computed(() => {
    this.viewVersion();
    const footer = buildFooterRow(this.config().columns, this.visibleRows());
    return footer ? [footer] : [];
  });

  readonly gridOptions = computed<GridOptions>(() => {
    const config = this.config();
    const metrics = GRID_DENSITY_METRICS[this.density()];

    const options: GridOptions = {
      rowHeight: metrics.rowHeight,
      headerHeight: metrics.headerHeight,

      pagination: config.pagination,
      paginationPageSize: config.pageSize,
      paginationPageSizeSelector: config.pageSizeOptions,

      suppressMovableColumns: config.suppressMovable,
      // Keyboard navigation and cell focus are on by default; an ERP grid is used by
      // keyboard-first operators and removing focus would break that outright.
      suppressCellFocus: false,

      overlayNoRowsTemplate: `<span class="app-grid__empty">No records found</span>`,

      defaultColDef: {
        sortable: true,
        resizable: true,
        filter: false,
        minWidth: 90,
        tooltipValueGetter: (p) => (p.value == null || p.value === '' ? null : String(p.value)),
      },
    };

    if (config.rowIdField) {
      options.getRowId = (params) => String(params.data?.[config.rowIdField as string] ?? '');
    }

    switch (config.selectionMode) {
      case 'multiple':
        options.rowSelection = {
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true,
          // Row click stays the "open this record" gesture; checkboxes do selection.
          enableClickSelection: false,
        };
        break;
      case 'single':
        options.rowSelection = { mode: 'singleRow', checkboxes: false, enableClickSelection: true };
        break;
      default:
        options.rowSelection = undefined;
    }

    if (config.editable) {
      options.editType = 'fullRow';
    }

    return options;
  });

  constructor() {
    // `loading` is a runtime option, not read from the initial gridOptions snapshot.
    effect(() => {
      this.api?.setGridOption('loading', this.loading());
    });

    // Data changes only need derived state refreshed — AG Grid picks the rows up from the
    // template binding itself, so setting them again here would be duplicated work.
    effect(() => {
      this.data();
      if (!this.api) return;
      queueMicrotask(() => this.syncDerived());
    });
  }

  // ── AG Grid events ─────────────────────────────────────────────────────────

  onGridReady(event: GridReadyEvent): void {
    const config = this.config();
    this.api = event.api;

    this.gridApi.init(event.api, config.gridId);
    this.selection.init(event.api);
    this.filterService.init(event.api);
    this.columnService.init(event.api, config.columns);
    this.exportService.init(event.api, config.columns, config.gridId.toLowerCase(), config.toolbar.title ?? '');
    this.state.init(config.gridId, event.api, config.persistState);

    this.density.set(config.density);

    // Restore before the first sizing pass, so a saved layout is not immediately overwritten
    // by auto-fit.
    const restored = this.state.restore();
    if (restored.density) this.density.set(restored.density);
    if (restored.pageSize) event.api.setGridOption('paginationPageSize', restored.pageSize);

    if (config.autoFitColumns && !restored.columnsRestored) event.api.sizeColumnsToFit();

    this.columnService.sync();
    this.syncDerived();
    this.ready.emit(this.gridApi);
  }

  onRowClicked(event: RowClickedEvent): void {
    if (event.data) this.rowClick.emit(event.data as GridRowData);
  }

  onRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (event.data) this.rowDoubleClick.emit(event.data as GridRowData);
  }

  onSelectionChanged(): void {
    this.selection.sync();
    this.selectionChange.emit(this.selection.selected());
    this.gridApi.syncCounts(this.selection.count());
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    const column = (event.colDef as { context?: { column?: GridColumn } })?.context?.column;
    const row = event.data as GridRowData;
    if (!column || !row) return;

    // The column's own hook first — that is where a form writes the value into its model —
    // then the row-wide recalculation, so derived cells see the committed value.
    column.onChange?.(event.newValue, row, column);
    this.config().recalculate?.(row);

    this.cellEdit.emit({ row, column, oldValue: event.oldValue, newValue: event.newValue });
    this.syncDerived();
  }

  onViewChanged(): void {
    this.viewVersion.update((v) => v + 1);
    this.filterService.syncActive();
    this.gridApi.syncCounts(this.selection.count());

    // The row number is positional, so every filter, sort or page change invalidates it.
    // AG Grid caches valueGetter results, so it has to be forced or the numbers develop gaps.
    if (this.config().showRowNumbers) {
      this.api?.refreshCells({ columns: ['__row_no'], force: true });
    }
  }

  onColumnChanged(): void {
    this.columnService.sync();
    this.state.save();
  }

  onSortOrFilterChanged(): void {
    this.onViewChanged();
    this.state.save();
  }

  // ── Toolbar actions ────────────────────────────────────────────────────────

  onSearch(text: string): void {
    this.filterService.search(text);
    this.onViewChanged();
  }

  onClearSearch(): void {
    this.filterService.clearSearch();
    this.onViewChanged();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onDensityChange(density: GridDensity): void {
    this.density.set(density);
    this.state.setDensity(density);
    // Row height is a grid option, not a style — AG Grid must re-measure the rows.
    this.api?.resetRowHeights();
  }

  onResetLayout(): void {
    this.state.reset();
    this.density.set(this.config().density);
    this.columnService.sync();
    if (this.config().autoFitColumns) this.columnService.autoFit();
  }

  onToggleFullScreen(): void {
    const element = this.host.nativeElement as HTMLElement;
    this.isFullScreen.update((v) => !v);
    // Re-fit after the box changes size, once the browser has applied the new layout.
    requestAnimationFrame(() => {
      if (this.config().autoFitColumns) this.columnService.autoFit();
      element.querySelector('.ag-root-wrapper');
    });
  }

  onExportExcel(): void {
    this.exportService.toExcel();
  }

  onExportCsv(): void {
    this.exportService.toCsv();
  }

  onPrint(): void {
    this.exportService.print();
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  /** Rows passing the current filter, in display order — the basis for totals and exports. */
  private visibleRows(): GridRowData[] {
    if (!this.api) return this.data();
    const rows: GridRowData[] = [];
    this.api.forEachNodeAfterFilter((node) => {
      if (node.data) rows.push(node.data as GridRowData);
    });
    return rows;
  }

  private syncDerived(): void {
    this.viewVersion.update((v) => v + 1);
    this.gridApi.syncCounts(this.selection.count());
  }
}

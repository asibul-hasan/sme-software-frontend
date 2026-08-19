import {
  Component, ChangeDetectionStrategy, input, output, effect, inject, computed, OnInit, OnDestroy, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent,
  ModelUpdatedEvent, CellClickedEvent, ICellRendererParams,
} from 'ag-grid-community';

import { GridConfig, GridColumnConfig } from '../models/grid-config.model';

/** Row id for the pinned footer, so `getRowId` never hands it a random value. */
const FOOTER_ROW_UID = '__footer__';

/**
 * Status and action cells render as plain HTML rather than Angular components.
 *
 * Two reasons: this app runs Angular 21 zoneless and AG Grid v36's Angular *renderer*
 * bridge does not instantiate component classes under it (editors use a different path
 * and are unaffected) — and a per-row Angular component is heavy for a badge and one
 * icon button. Clicks are handled centrally in `onCellClicked`.
 */
const STATUS_BADGE_HTML: Record<number, string> = {
  [SqlRowState.Unchanged]: '<span class="erp-grid-badge erp-grid-badge--saved">Saved</span>',
  [SqlRowState.Insert]: '<span class="erp-grid-badge erp-grid-badge--new">New</span>',
  [SqlRowState.Update]: '<span class="erp-grid-badge erp-grid-badge--modified">Modified</span>',
  [SqlRowState.Delete]: '<span class="erp-grid-badge erp-grid-badge--deleted">Deleted</span>',
};

const DELETE_ACTION_HTML =
  '<button type="button" class="erp-grid-rowdelete" title="Delete row" aria-label="Delete row">' +
  '<span class="material-icons">delete</span></button>';
import { SqlRowState } from '../models/grid-row-state.enum';
import { GridApiService } from '../services/grid-api.service';
import { GridStateService } from '../services/grid-state.service';
import { GridValidationService } from '../services/grid-validation.service';
import { GridExportService } from '../services/grid-export.service';
import { DEFAULT_ERP_GRID_OPTIONS, DEFAULT_GRID_DENSITY, GRID_DENSITY_HEIGHTS } from '../utils/grid-defaults';
import { matchLookupOption, resolveLookupOptions } from '../utils/lookup-options';
import { ActionCellRendererComponent } from '../renderers/action-cell-renderer.component';
import { StatusCellRendererComponent } from '../renderers/status-cell-renderer.component';
import { SelectCellEditorComponent } from '../editors/select-cell-editor.component';
import { GridToolbarComponent, GridToolbarColumn, GridExportFormat } from './grid-toolbar.component';
import { ColumnDef } from '@app/shared/components/common-table';
import { TableExportService } from '@app/shared/components/common-table/table-export.service';
import { GridStatusBarComponent } from './grid-status-bar.component';
import { AppDecimalPipe } from '@app/shared/pipes/app-decimal.pipe';
import { AppSettingsService } from '@app/core/services/app-settings.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-erp-grid',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    GridToolbarComponent,
    GridStatusBarComponent,
  ],
  providers: [GridApiService, AppDecimalPipe],
  templateUrl: './erp-grid.component.html',
  styleUrls: ['./erp-grid.component.scss'],
})
export class ErpGridComponent<T = any> implements OnInit, OnDestroy {
  public gridApiService = inject(GridApiService<T>);
  private decimalPipe = inject(AppDecimalPipe);
  private settings = inject(AppSettingsService);
  private host = inject(ElementRef<HTMLElement>);
  private gridStateService = inject(GridStateService);
  private validationService = inject(GridValidationService);
  private gridExportService = inject(GridExportService);
  private tableExportService = inject(TableExportService);

  @ViewChild('agGrid') agGrid!: AgGridAngular;

  config = input.required<GridConfig<T>>();
  data = input<T[]>([]);
  /** Per-screen override; falls back to `GridConfig.height`, then 400px. */
  height = input<string>('');
  /**
   * Externally-driven selection, matched against `rowIdField`.
   *
   * When the form owns the rows it also owns which one is current — after a save it
   * restores the row the user was on. Left unbound, the grid falls back to
   * `autoSelectFirstRow`; bound, that fallback only applies when this is null or the
   * id is not in the current rows.
   */
  selectedId = input<unknown>(null);

  /** `[height]` wins; otherwise the config's own height; otherwise the default. */
  protected effectiveHeight = computed(() => this.height() || this.config().height || '400px');

  ready = output<GridApiService<T>>();
  rowClick = output<T>();

  // ── Outputs for forms that own their own data ─────────────────────────────
  // With `GridConfig.externalRowState`, the grid stops mutating its own row list
  // and just reports intent: the form applies it to its model and the new rows
  // flow back down through `[data]`. Required whenever rows are shared across
  // views the grid cannot see — e.g. a chained master/detail form where a child
  // grid shows a filtered slice of a larger list.

  /** A committed edit. Carries the whole row, `__uid` included. */
  rowChange = output<T>();
  /** The user asked to delete this row (already confirmed). */
  rowRemove = output<T>();
  /** The toolbar's Add button was pressed. */
  addRow = output<void>();

  public gridOptions = {
    ...DEFAULT_ERP_GRID_OPTIONS,
    context: { gridApiService: this.gridApiService }
  };
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public searchValue = '';
  public gridApi?: GridApi;

  private hasFooterRow = false;
  private lastFooterJson = '';
  private firstRenderRefreshed = false;
  private editLastRowOnNextData = false;

  public toolbarColumns: GridToolbarColumn[] = [];
  public pageSize = 50;
  public currentPage = 0;
  public totalPages = 1;

  constructor() {
    // Repaint when the active currency's precision or grouping changes. Cells format
    // through AppDecimalPipe at render time, so a grid already on screen would keep
    // the old decimals until something else happened to refresh it.
    effect(() => {
      this.settings.current();
      this.gridApi?.refreshCells({ force: true });
    });

    effect(() => {
      const list = this.data();
      const cfg = this.config();
      this.gridApiService.setRows(list, cfg.rowIdField as string);
    });

    effect(() => {
      const wrappers = this.gridApiService.rows();
      // Filter out deleted rows from display unless soft-delete mode is shown
      this.rowData = wrappers
        .filter((w) => w.__sqlState !== SqlRowState.Delete)
        .map((w) => ({
          ...w.data,
          __uid: w.__uid,
          __sqlState: w.__sqlState,
          __errors: w.__errors,
        }));

      // Pushed straight to the grid: an effect does NOT mark an OnPush view dirty,
      // so the `[rowData]` binding is not re-evaluated and the grid would keep its
      // first (empty) paint — which also leaves pinned-column renderers unrun.
      this.gridApi?.setGridOption('rowData', this.rowData);

      // A row the FORM just created has now arrived — open it for editing, so an
      // externally-owned Add behaves like the built-in one.
      if (this.editLastRowOnNextData && this.rowData.length) {
        this.editLastRowOnNextData = false;
        setTimeout(() => this.editRow(this.rowData.length - 1));
      }
    });
  }

  ngOnInit(): void {
    // Inputs are not readable in field initializers (NG8118), so density is applied here —
    // still before the template creates <ag-grid-angular>, which is what matters.
    const cfg = this.config();
    Object.assign(this.gridOptions, GRID_DENSITY_HEIGHTS[cfg.density ?? DEFAULT_GRID_DENSITY]);

    if (cfg.showPagination) {
      this.pageSize = cfg.pageSize ?? this.pageSize;
      Object.assign(this.gridOptions, { pagination: true, paginationPageSize: this.pageSize });
    }

    // 'cell' opts out of the full-row default for grids whose columns are
    // independent settings rather than one transaction (e.g. SYS1104).
    if (cfg.editMode === 'cell') {
      Object.assign(this.gridOptions, { editType: undefined });
    }

    if (cfg.selectionMode === 'none') {
      Object.assign(this.gridOptions, { rowSelection: undefined });
    } else if (cfg.selectionMode === 'single') {
      // No checkboxes in single-select: the row click IS the selector, and a
      // checkbox column only adds a second way to do the same thing.
      Object.assign(this.gridOptions, {
        rowSelection: {
          ...(this.gridOptions.rowSelection as object),
          mode: 'singleRow',
          headerCheckbox: false,
          checkboxes: false,
        },
      });
    }

    this.buildColumns();
    this.hasFooterRow = this.config().columns.some(
      (c) => c.bottomTotal || c.footerLabel != null || c.footerValue != null,
    );
  }

  /**
   * Rebuilds the pinned bottom row from the rows that survive the CURRENT FILTER,
   * so the totals always match what the user can see.
   *
   * Pushed straight through the grid API rather than a template binding: this component
   * is OnPush and the row signal is written from effects, which do not mark the view
   * dirty — a `[pinnedBottomRowData]` binding would go stale.
   */
  private refreshFooterRow(api: GridApi | undefined = this.gridApi): void {
    if (!this.hasFooterRow || !api) return;

    const visible: any[] = [];
    api.forEachNodeAfterFilter((node) => {
      if (!node.rowPinned && node.data) visible.push(node.data);
    });

    const footer: Record<string, unknown> = { __uid: FOOTER_ROW_UID, __footer: true };
    for (const c of this.config().columns) {
      const field = c.field as string;
      if (c.footerValue) {
        footer[field] = c.footerValue(visible as T[]);
      } else if (c.bottomTotal) {
        footer[field] = visible.reduce((sum, r) => sum + (Number(r[field]) || 0), 0);
      } else if (c.footerLabel != null) {
        footer[field] = c.footerLabel;
      }
    }

    // Skip redundant writes — this runs from modelUpdated, which the write could re-trigger.
    // The `applied` check matters: pushing `rowData` through the API drops the pinned row,
    // and a value-only guard would then never restore it (the totals silently vanish).
    const next = JSON.stringify(footer);
    const applied = (api.getGridOption('pinnedBottomRowData') as unknown[] | undefined)?.length;
    if (next === this.lastFooterJson && applied) return;
    this.lastFooterJson = next;
    api.setGridOption('pinnedBottomRowData', [footer]);
  }

  /** `modelUpdated` also fires during init, before `gridReady` assigns `gridApi`. */
  onModelUpdated(event: ModelUpdatedEvent): void {
    this.refreshFooterRow(event.api);

    // One-shot forced refresh once real rows first land.
    //
    // The grid paints its cells before the row data arrives (rows are produced by a
    // signal effect, and an effect does not mark an OnPush view dirty), and it then
    // reuses those cached cell components — so custom cell renderers never run and
    // the status / action columns stay blank. Neither re-setting `rowData` nor
    // `redrawRows()` clears the cache; only a forced refresh does.
    if (!this.firstRenderRefreshed && event.api.getDisplayedRowCount() > 0) {
      this.firstRenderRefreshed = true;
      event.api.refreshCells({ force: true });
    }

    // `canDeleteRow` depends on things the grid cannot watch — a permission signal,
    // or a child count that lives in the form. Re-running the action column on each
    // model update keeps the button honest without the form wiring anything up.
    if (this.config().canDeleteRow) {
      event.api.refreshCells({ columns: ['__actions'], force: true });
    }

    this.syncSelection(event.api);
  }

  /**
   * Applies `selectedId` if the form supplied one, otherwise falls back to
   * `autoSelectFirstRow`. Without this the auto-select would fight the form: after a
   * save the model restores the edited row, the grid immediately re-selects row 0,
   * and the user is bounced back to the top of the list.
   */
  private syncSelection(api: GridApi): void {
    const wanted = this.selectedId();
    if (wanted != null) {
      const idField = (this.config().rowIdField as string) ?? '__uid';
      let matched = false;
      api.forEachNode((node) => {
        const isMatch = String(node.data?.[idField]) === String(wanted);
        if (isMatch) matched = true;
        if (node.isSelected() !== isMatch) node.setSelected(isMatch);
      });
      // The form already knows about this selection — no `rowClick` echo.
      if (matched) return;
    }
    this.autoSelectFirstRow(api);
  }

  /**
   * Keeps a row selected at all times when `autoSelectFirstRow` is on.
   *
   * Emits `rowClick` as well as selecting, so a chained form loads the children of
   * whatever is highlighted — otherwise the first row looks selected while the grid
   * below it sits empty. Only fires when nothing is selected, so it cannot loop.
   */
  private autoSelectFirstRow(api: GridApi): void {
    if (!this.config().autoSelectFirstRow) return;
    if (api.getSelectedNodes().length > 0) return;

    const node = api.getDisplayedRowAtIndex(0);
    if (!node?.data) return;

    node.setSelected(true);
    this.rowClick.emit(this.domainRow(node.data));
  }

  /**
   * Commit an open row editor as soon as the pointer goes down outside the grid.
   *
   * `stopEditingWhenCellsLoseFocus` only tears the editor down once focus has already moved, which
   * is after mousedown. Clicking a toolbar button while a cell was open therefore rebuilt the row
   * between mousedown and mouseup, and the browser fires no `click` when the element under the
   * pointer changes in between — so the first press on Save was swallowed and the user had to
   * click it twice.
   *
   * Capture phase, so this runs before the editor teardown the browser would otherwise trigger:
   * the row is committed and the DOM has settled by the time the click resolves.
   */
  private readonly commitOnOutsidePointerDown = (ev: Event): void => {
    if (!this.gridApi) return;
    if (this.gridApi.getEditingCells().length === 0) return;

    const target = ev.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) return;   // inside the grid: leave it

    // Editors render in a CDK/ng-select overlay outside the host — clicking an option must not
    // count as leaving the grid, or picking from a dropdown would end the edit before it applied.
    if (target instanceof Element && target.closest('.ng-dropdown-panel, .cdk-overlay-container')) return;

    this.gridApi.stopEditing();
  };

  ngOnDestroy(): void {
    document.removeEventListener('pointerdown', this.commitOnOutsidePointerDown, true);

    if (this.gridApi && this.config().gridKey) {
      this.gridStateService.saveState(this.config().gridKey, this.gridApi);
    }
  }

  private buildColumns(): void {
    const cfg = this.config();
    const cols: ColDef[] = [];

    for (const c of cfg.columns) {
      if (c.type === 'status') {
        cols.push({
          field: '__sqlState',
          headerName: c.headerName ?? 'Status',
          width: c.width ?? 110,
          pinned: c.pinned ?? 'left',
          cellRenderer: (p: ICellRendererParams) => (p.node?.rowPinned ? '' : STATUS_BADGE_HTML[p.data?.__sqlState as SqlRowState] ?? ''),
          sortable: false,
          filter: false,
        });
      } else if (c.type === 'action') {
        cols.push({
          field: '__actions',
          headerName: c.headerName ?? '',
          // Just the delete icon — sized to it, not to a label.
          width: c.width ?? 48,
          minWidth: 40,
          resizable: false,
          pinned: c.pinned ?? 'right',
          // Hidden — not disabled — when the row may not be deleted: a parent that
          // still has children, or no delete permission.
          cellRenderer: (p: ICellRendererParams) =>
            p.node?.rowPinned || !(cfg.canDeleteRow?.(p.data as T) ?? true) ? '' : DELETE_ACTION_HTML,
          sortable: false,
          filter: false,
        });
      } else {
        const isNumeric = c.type === 'number' || c.type === 'decimal' || c.type === 'currency' || c.align === 'right';
        const colDef: ColDef = {
          field: c.field as string,
          headerName: c.headerName,
          width: c.width,
          minWidth: c.minWidth,
          maxWidth: c.maxWidth,
          flex: c.flex,
          // The pinned footer is never editable, whatever the column says, and
          // without update permission nothing is.
          editable: (params: any) =>
            params.node?.rowPinned || !(cfg.canEdit?.() ?? true)
              ? false
              : typeof c.editable === 'function'
                ? (c.editable as Function)(params.data)
                : (c.editable ?? true),
          hide: c.hidden ?? false,
          pinned: c.pinned,
          sortable: c.sortable ?? true,
          filter: c.filterable ?? true,
          cellClass: isNumeric ? 'text-end' : undefined,
          cellClassRules: {
            'bg-danger-subtle text-danger font-semibold': (params) => !!params.data?.__errors?.[params.colDef.field as string],
          },
          valueFormatter: c.valueFormatter ? (params) => c.valueFormatter!(params.value, params.data) : undefined,
          valueParser: c.valueParser ? (params) => c.valueParser!(params.newValue, params.data) : undefined,
        };

        if (c.type === 'select' || c.type === 'lookup') {
          colDef.cellEditor = SelectCellEditorComponent;
          colDef.cellEditorParams = { options: c.options };
          // Popup vs inline is decided by the editor's own `isPopup()` — it depends on
          // the edit mode, and a `cellEditorPopup` here would override that and force a
          // popup even in full-row editing (where a modal popup ends the row edit).
          // Show the option label, not the stored code. Shares the editor's matching so a
          // code persisted as a string still resolves against a numeric option.
          colDef.valueFormatter = c.valueFormatter
            ? (params) => c.valueFormatter!(params.value, params.data)
            : (params) => {
                const opts = resolveLookupOptions(c.options, params.data);
                return matchLookupOption(opts, params.value)?.label ?? (params.value ?? '');
              };
        } else if (c.type === 'number' || c.type === 'decimal' || c.type === 'currency') {
          colDef.cellEditor = 'agNumberCellEditor';
          colDef.valueParser = (params) => (params.newValue != null && params.newValue !== '' ? Number(params.newValue) : null);

          // Numbers format through AppDecimalPipe, which reads the ACTIVE CURRENCY loaded at
          // bootstrap — its decimal_places and its International/Indian grouping.
          //
          // Two things were wrong before. Only 'currency' got a formatter at all, so 'decimal' and
          // 'number' columns rendered the raw value: a unit price of 1500 showed as "1500", not
          // "1,500.00". And the currency formatter hard-coded 'en-US' with a '?? 2' fallback, so a
          // company on 0 or 3 decimal places, or on Indian grouping (12,34,567 rather than
          // 1,234,567), was formatted wrongly no matter what SYS_1004 said.
          //
          // Precision stays UNSET here on purpose: passing undefined lets the pipe fall back to
          // the global setting, which is the whole point. A column only overrides it when the
          // figure is genuinely not money — a quantity or a rate at its own scale. 'number' keeps
          // common-table's 0-decimal default so counts do not sprout decimals.
          if (!c.valueFormatter) {
            const fixed = c.type === 'number' ? (c.precision ?? 0) : c.precision;
            colDef.valueFormatter = (params) =>
              params.value == null || params.value === '' ? '' : this.decimalPipe.transform(params.value, fixed);
          }
        } else if (c.type === 'date') {
          if (!c.valueFormatter) {
            colDef.valueFormatter = (params) => {
              if (params.value == null || params.value === '') return '';
              const val = String(params.value);
              return val.includes('T') ? val.split('T')[0] : val.slice(0, 10);
            };
          }
        } else if (c.type === 'checkbox') {
          // Use custom cellRenderer if provided (e.g. for conditional disable),
          // otherwise use AG Grid's built-in checkbox renderer.
          colDef.cellRenderer = c.cellRenderer ?? 'agCheckboxCellRenderer';
          colDef.cellEditor = 'agCheckboxCellEditor';
          colDef.singleClickEdit = true;
          colDef.cellRendererParams = {
            readOnly: (params: any) => {
              const isEditable = typeof colDef.editable === 'function' ? colDef.editable(params) : (colDef.editable ?? true);
              return !isEditable;
            },
          };
          // Convert 1/0 to true/false for the AG Grid components
          colDef.valueGetter = (params) => params.data?.[c.field as string] === 1 || params.data?.[c.field as string] === true;
          colDef.valueSetter = (params) => {
            if (params.data) {
              params.data[c.field as string] = params.newValue ? 1 : 0;
              return true;
            }
            return false;
          };
        }

        // Search the text the user SEES. The quick filter matches raw cell values by
        // default, so a lookup column searched on its stored code — typing the branch
        // name a user is looking at found nothing.
        if (colDef.valueFormatter) {
          const formatter = colDef.valueFormatter as (p: any) => string;
          colDef.getQuickFilterText = (params) => {
            const text = formatter({ ...params, value: params.value });
            return text == null ? '' : String(text);
          };
        }

        cols.push(colDef);
      }
    }

    this.columnDefs = cols;
    // Hand the columns over at CONSTRUCTION. Supplied only through the
    // `[columnDefs]` input they arrive after the first paint, and pinned columns
    // keep the empty cells they were first painted with — renderers never run.
    this.gridOptions.columnDefs = cols;
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridApiService.setApi(event.api);
    this.gridOptions.context = { gridApiService: this.gridApiService };

    document.addEventListener('pointerdown', this.commitOnOutsidePointerDown, true);

    if (this.config().gridKey) {
      this.gridStateService.restoreState(this.config().gridKey, event.api);
    }

    this.syncToolbarColumns(event.api);
    this.onPaginationChanged();

    if (this.rowData && this.rowData.length > 0) {
      event.api.setGridOption('rowData', this.rowData);
    }

    this.ready.emit(this.gridApiService);
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    if (!event.data || !event.data.__uid) return;
    const field = event.colDef.field;
    if (!field) return;

    // 1. Update Cell Value in API Service
    this.gridApiService.updateCellValue(event.data.__uid, field, event.newValue);

    // 2. Validate Cell
    const colConfig = this.config().columns.find((c) => c.field === field);
    if (colConfig) {
      const errorMsg = this.validationService.validateCell(event.newValue, event.data, colConfig);
      this.gridApiService.setRowError(event.data.__uid, field, errorMsg);

      // 3. Trigger c.onChange handler if defined
      if (colConfig.onChange) {
        colConfig.onChange(event.newValue, event.oldValue, event.data);
      }
    }

    this.gridApiService.refreshView();
    // An edited amount must move the total straight away.
    this.refreshFooterRow(event.api);

    this.rowChange.emit(this.domainRow(event.data));
  }

  /**
   * The row as the FORM knows it.
   *
   * Grid rows carry internal keys and a STRINGIFIED `__uid` (the wrapper's id), so
   * handing `event.data` straight out breaks any caller that keys on the original
   * value — a numeric id silently stops matching. The wrapper's `data` is the
   * untouched domain object, already carrying this edit.
   */
  private domainRow(gridRow: any): T {
    const wrapper = this.gridApiService.rows().find((w) => w.__uid === gridRow?.__uid);
    return { ...((wrapper?.data ?? gridRow) as object) } as T;
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedNodes = event.api.getSelectedNodes();
    const uids = selectedNodes.map((n) => n.data?.__uid).filter(Boolean);
    this.gridApiService.selectedUids.set(uids);
  }

  onRowClicked(event: any): void {
    if (event.data) {
      // Domain row, not the grid's: callers key off the original id (a chained form
      // filters its children by it, and a stringified id matches nothing).
      this.rowClick.emit(this.domainRow(event.data));
    }
  }

  /**
   * Row delete lives here because the action cell is plain HTML, not a component.
   *
   * Removing a row does NOT confirm: it is an edit to the grid, undone by not saving,
   * and a modal per row makes building a document tedious. The form's Save is the
   * commit point.
   */
  onCellClicked(event: CellClickedEvent): void {
    if (event.colDef.field !== '__actions' || event.node.rowPinned) return;
    const uid = event.data?.__uid;
    if (!uid) return;
    // The button is hidden in this case, but a click on the surrounding cell still
    // lands here — re-check rather than trust the renderer.
    if (!(this.config().canDeleteRow?.(event.data as T) ?? true)) return;

    // The form owns the rows — report, don't mutate. It may also refuse (e.g. a
    // parent row that still has children).
    if (this.config().externalRowState) {
      this.rowRemove.emit(this.domainRow(event.data));
      return;
    }

    this.gridApiService.deleteRow(uid);
    this.refreshFooterRow(event.api);
  }

  onSearchChange(text: string): void {
    this.searchValue = text;
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', text);
    }
  }

  /**
   * Appends a row and immediately opens it for editing. With `editType: 'fullRow'`
   * this puts the whole line into edit mode, focused on the first editable column —
   * a new line is useless read-only.
   */
  onAddRow(): void {
    if (this.config().externalRowState) {
      // The form creates the row; it arrives through `[data]`. Open it once it lands.
      this.addRow.emit();
      this.editLastRowOnNextData = true;
      return;
    }

    this.gridApiService.addRow(this.config().newRowDefaults?.() as Partial<T> | undefined);

    // Wait for the new row to reach the grid's row model before addressing it.
    setTimeout(() => {
      const api = this.gridApi;
      if (!api) return;

      this.editRow(api.getDisplayedRowCount() - 1);
    });
  }

  /** Opens a row for editing, focused on its first editable column. */
  private editRow(rowIndex: number): void {
    const api = this.gridApi;
    if (!api || rowIndex < 0) return;
    if (this.config().showPagination) api.paginationGoToLastPage();
    const colKey = this.firstEditableColumn(api, rowIndex);
    if (colKey) api.startEditingCell({ rowIndex, colKey });
  }

  private firstEditableColumn(api: GridApi, rowIndex: number): string | undefined {
    const node = api.getDisplayedRowAtIndex(rowIndex);
    return api
      .getAllDisplayedColumns()
      .find((col) => col.isCellEditable(node!))
      ?.getColId();
  }

  onToggleColumn(colId: string): void {
    const api = this.gridApi;
    if (!api) return;
    const col = api.getColumn(colId);
    if (!col) return;
    api.setColumnsVisible([colId], !col.isVisible());
    this.syncToolbarColumns(api);
  }

  /** Feeds the column-chooser menu; the grid is the source of truth for visibility. */
  private syncToolbarColumns(api: GridApi): void {
    this.toolbarColumns = api
      .getColumns()
      ?.filter((col) => {
        const id = col.getColId();
        return id !== '__sqlState' && id !== '__actions' && !id.startsWith('ag-Grid-');
      })
      .map((col) => ({
        colId: col.getColId(),
        headerName: col.getColDef().headerName ?? col.getColId(),
        visible: col.isVisible(),
      })) ?? [];
  }

  onPaginationChanged(): void {
    const api = this.gridApi;
    if (!api || !this.config().showPagination) return;
    this.currentPage = api.paginationGetCurrentPage();
    this.totalPages = api.paginationGetTotalPages();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.gridApi?.setGridOption('paginationPageSize', size);
  }

  onDeleteSelected(): void {
    const uids = this.gridApiService.selectedUids();
    for (const uid of uids) {
      this.gridApiService.deleteRow(uid);
    }
  }

  /**
   * Exports through the app's shared `TableExportService`, so a grid export is
   * byte-for-byte the same as the equivalent `<app-common-table>` export.
   * Only the rows surviving the current filter, and only visible columns.
   */
  onExportAs(format: GridExportFormat): void {
    const api = this.gridApi;
    if (!api) return;

    const rows: Record<string, unknown>[] = [];
    api.forEachNodeAfterFilterAndSort((node) => {
      if (!node.rowPinned && node.data) rows.push(node.data);
    });

    const visible = new Set(api.getAllDisplayedColumns().map((c) => c.getColId()));
    const columns: ColumnDef[] = this.config()
      .columns.filter((c) => c.type !== 'status' && c.type !== 'action' && visible.has(c.field as string))
      .map((c) => ({
        title: c.headerName,
        field: c.field as string,
        align: c.align,
        precision: c.precision,
        // Lookup columns must export the LABEL, not the stored code.
        value:
          c.type === 'select' || c.type === 'lookup'
            ? (row: Record<string, unknown>) =>
                matchLookupOption(resolveLookupOptions(c.options, row as T), row[c.field as string])?.label ??
                row[c.field as string]
            : undefined,
      }));

    const title = this.config().toolbar?.title || this.config().gridKey || 'Export';

    if (format === 'excel') this.tableExportService.exportToExcel(rows, columns, title);
    else if (format === 'pdf') void this.tableExportService.exportToPdf(rows, columns, title, title);
    else if (format === 'csv') this.tableExportService.exportToCsv(rows, columns, title);
    else this.printRows(rows, columns, title);
  }

  /** Prints via a hidden iframe — same approach as `<app-common-table>`, no popup window. */
  private printRows(rows: Record<string, unknown>[], columns: ColumnDef[], title: string): void {
    const cell = (row: Record<string, unknown>, col: ColumnDef) => {
      const v = col.value ? col.value(row) : row[col.field];
      return v == null ? '' : String(v);
    };
    const head = columns
      .map((c) => `<th style="padding:6px 10px;background:#f7f8fc;font-weight:700;font-size:12px;border-bottom:1px solid #e2e8f0;text-align:left">${c.title}</th>`)
      .join('');
    const body = rows
      .map(
        (row) =>
          `<tr>${columns
            .map((c) => `<td style="padding:5px 10px;font-size:12px;border-bottom:1px solid #eef1f7;text-align:${c.align ?? 'left'}">${cell(row, c)}</td>`)
            .join('')}</tr>`,
      )
      .join('');

    const html = `<html><head><title>${title}</title><style>
      body{font-family:system-ui,sans-serif;padding:20px;color:#1a1f36}
      h3{margin:0 0 16px;font-size:16px}
      table{border-collapse:collapse;width:100%}
      tr:nth-child(even) td{background:#f7f8fc}
      @media print{body{padding:0}@page{margin:10mm}}
    </style></head><body><h3>${title}</h3><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 300);
  }

  /** Persists the current column layout under the grid key. */
  onSaveColumns(): void {
    if (this.gridApi && this.config().gridKey) {
      this.gridStateService.saveState(this.config().gridKey, this.gridApi);
    }
  }

  onResetLayout(): void {
    const api = this.gridApi;
    if (!api || !this.config().gridKey) return;
    this.gridStateService.resetState(this.config().gridKey, api);
    // Without this the menu keeps showing the pre-reset checkboxes.
    this.syncToolbarColumns(api);
  }

  getInsertedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Insert).length;
  }

  getUpdatedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Update).length;
  }

  getDeletedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Delete).length;
  }
}

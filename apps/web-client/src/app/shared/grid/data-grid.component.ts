import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgGridAngular } from 'ag-grid-angular';
import type {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent as AgGridReadyEvent,
  GridOptions,
  RowClickedEvent,
  RowDoubleClickedEvent,
} from 'ag-grid-community';

import { AlertService } from '../../core/services/alert.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { TableExportService } from '../components/common-table/table-export.service';
import type { ColumnDef as LegacyColumnDef } from '../components/common-table/table.types';
import { erpAction, resolveConfirm } from '../actions/erp-actions';
import {
  buildColDef,
  buildDeleteColDef,
  buildFooterRow,
  buildSerialColDef,
  logicalValue,
  recalculateRow,
} from './grid-columns';
import { GRID_SIZING } from './grid-theme';
import {
  DEFAULT_GRID_CONFIG,
  type GridBulkAction,
  type GridCellChange,
  type GridChanges,
  type GridColumnDef,
  type GridConfig,
  type GridExportFormat,
  type GridReadyEvent,
  type GridRow,
} from './grid.types';

/**
 * `<app-data-grid>` — the reusable AG Grid based ERP data grid.
 *
 * <p>One grid component for every module. Forms describe columns with
 * {@link GridColumnDef} and never import AG Grid types directly, so behaviour
 * (sorting, filtering, paging, selection, export, totals, numbering) is defined
 * once here instead of being re-invented per form.</p>
 *
 * <p>This is ADDITIVE — the legacy `<app-common-table>` is untouched and every
 * existing form keeps working. New grids can adopt this; existing ones migrate
 * when they are next worked on.</p>
 *
 * ```html
 * <app-data-grid
 *   [columns]="columns"
 *   [data]="rows()"
 *   [config]="{ selection: 'multiple', bulkActions: [...] }"
 *   (rowClick)="select($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-data-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, MatIconModule, MatMenuModule, MatTooltipModule, AgGridAngular],
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss'],
})
export class DataGridComponent {
  private readonly exportService = inject(TableExportService);
  private readonly settings = inject(AppSettingsService);
  private readonly alert = inject(AlertService);

  // ── Inputs ─────────────────────────────────────────────────────────────────
  readonly columns = input<GridColumnDef[]>([]);
  readonly data = input<GridRow[]>([]);
  readonly config = input<Partial<GridConfig>>({});

  // ── Outputs ────────────────────────────────────────────────────────────────
  readonly rowClick = output<GridRow>();
  readonly rowDoubleClick = output<GridRow>();
  readonly selectionChange = output<GridRow[]>();
  readonly cellChange = output<GridCellChange>();
  readonly refresh = output<void>();
  readonly gridReady = output<GridReadyEvent>();

  /** A row finished editing and its values (plus any derived ones) changed. */
  readonly rowSave = output<GridRow>();
  /** The ✕ was clicked — the row is now hidden and pending deletion. */
  readonly rowDelete = output<GridRow>();
  /** A row was added via the toolbar / `addRow()`. */
  readonly rowAdd = output<GridRow>();
  /** Pending adds/updates/deletes changed — wire to the Save button's state. */
  readonly changesChange = output<GridChanges>();

  // ── Internal state ─────────────────────────────────────────────────────────
  private api: GridApi | null = null;
  readonly searchText = signal('');
  readonly selectedRows = signal<GridRow[]>([]);
  readonly visibleCount = signal(0);
  /** Bumped whenever AG Grid reports a filter/sort/pagination change. */
  private readonly viewVersion = signal(0);

  // Pending changes, tracked by row object identity — AG Grid hands back the very
  // same objects, so no synthetic ids have to be written into business data.
  private readonly added = new Set<GridRow>();
  private readonly updated = new Set<GridRow>();
  private readonly deleted = new Set<GridRow>();
  /** Bumped on every add/update/delete so `changes()` recomputes. */
  private readonly changeVersion = signal(0);
  /** Row values captured when editing started, to detect a genuine change. */
  private editSnapshot: GridRow | null = null;

  /** Effective config = defaults + caller overrides. */
  readonly cfg = computed<GridConfig>(() => ({ ...DEFAULT_GRID_CONFIG, ...this.config() }));

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    host.addEventListener('keydown', this.onEditKeydown, true); // capture
    inject(DestroyRef).onDestroy(() =>
      host.removeEventListener('keydown', this.onEditKeydown, true),
    );

    // `rowData` and `columnDefs` are bound in the template — AG Grid picks those
    // changes up itself, so setting them again here would be double work. This
    // effect only refreshes the state DERIVED from the new rows (visible count,
    // totals row, empty/no-results flags), once the grid has applied them.
    effect(() => {
      this.data();
      this.colDefs();
      if (!this.api) return;
      queueMicrotask(() => this.syncDerivedState());
    });

    // `gridOptions` is read once at init by ag-grid-angular, so runtime-changing
    // options must be pushed explicitly.
    effect(() => {
      this.api?.setGridOption('loading', !!this.cfg().loading);
    });
  }

  // ── Column definitions ─────────────────────────────────────────────────────
  readonly colDefs = computed<ColDef[]>(() => {
    const cfg = this.cfg();
    const numberCtx = () => {
      const s = this.settings.current();
      return { precision: s.precision, numberStyle: s.numberStyle };
    };

    const defs = this.columns().map((c) => buildColDef(c, cfg, numberCtx));
    if (cfg.showSerial) defs.unshift(buildSerialColDef(cfg));

    // Editable grids get the ✕ column automatically, unless the caller already
    // declared their own delete/actions column.
    const wantsDelete = cfg.showDelete ?? cfg.editable ?? false;
    const hasOwn = this.columns().some((c) => c.cellType === 'delete' || c.cellType === 'actions');
    if (wantsDelete && !hasOwn) defs.push(buildDeleteColDef((row) => this.deleteRow(row)));

    return defs;
  });

  readonly defaultColDef = computed<ColDef>(() => ({
    sortable: true,
    resizable: this.cfg().resizableColumns ?? true,
    filter: false,
    minWidth: 90,
    // Long values truncate with an ellipsis and expose the full text on hover.
    tooltipValueGetter: (p) => (p.value == null || p.value === '' ? null : String(p.value)),
  }));

  // ── Grid options ───────────────────────────────────────────────────────────
  readonly gridOptions = computed<GridOptions>(() => {
    const cfg = this.cfg();
    const sizing = cfg.dense ? GRID_SIZING.dense : GRID_SIZING.normal;
    const rowKey = cfg.rowKey;

    const options: GridOptions = {
      rowHeight: cfg.rowHeight ?? sizing.rowHeight,
      headerHeight: cfg.headerHeight ?? sizing.headerHeight,

      pagination: cfg.pagination ?? true,
      paginationPageSize: cfg.pageSize ?? 25,
      paginationPageSizeSelector: cfg.pageSizeOptions ?? [10, 25, 50, 100],

      suppressMovableColumns: !(cfg.movableColumns ?? true),
      suppressCellFocus: false,
      // The app renders its own empty/loading/error states in the template.
      suppressNoRowsOverlay: true,

      // ── Editing ───────────────────────────────────────────────────────────
      // Double-click opens the row (AG Grid's default gesture); single click is
      // left free to mean "select", which is what users expect from a line grid.
      editType: (cfg.editMode ?? 'fullRow') === 'fullRow' ? 'fullRow' : undefined,
      singleClickEdit: false,
      stopEditingWhenCellsLoseFocus: true,

      // Rows removed with the ✕ are hidden through an external filter rather than
      // being spliced out of the caller's array — that keeps the deletion
      // reversible until the form actually saves.
      isExternalFilterPresent: () => this.deleted.size > 0,
      doesExternalFilterPass: (node) => !this.deleted.has(node.data as GridRow),
    };

    // Stable row identity keeps selection and edit state across refreshes.
    if (rowKey) {
      options.getRowId = (p) =>
        String(typeof rowKey === 'function' ? rowKey(p.data as GridRow) : (p.data as GridRow)?.[rowKey]);
    }

    // Selection (AG Grid v33+ object form).
    if (cfg.selection && cfg.selection !== 'none') {
      options.rowSelection = {
        mode: cfg.selection === 'multiple' ? 'multiRow' : 'singleRow',
        checkboxes: true,
        headerCheckbox: cfg.selection === 'multiple',
        // On an editable grid a click means "select this line" (double-click edits).
        // On a read-only master-detail list a click already means "open this
        // record", so it must not also toggle the checkbox.
        enableClickSelection: cfg.clickToSelect ?? cfg.editable ?? false,
      };
    } else if (cfg.editable) {
      // Editable but no checkbox column: still allow click-to-select so the user
      // can see which line they are on.
      options.rowSelection = { mode: 'singleRow', checkboxes: false, enableClickSelection: true };
    } else {
      options.rowSelection = undefined;
    }

    return { ...options, ...(cfg.agOptions ?? {}) };
  });

  /**
   * Grid height. Defaults to sizing-to-content, capped by `maxAutoHeight`, so a
   * 3-row grid is not a wall of white space and a 500-row grid still scrolls
   * internally. Never viewport math (see CLAUDE.md).
   */
  readonly gridHeight = computed(() => {
    const cfg = this.cfg();
    if (cfg.height && cfg.height !== 'auto') return cfg.height;

    const sizing = cfg.dense ? GRID_SIZING.dense : GRID_SIZING.normal;
    const rowHeight = cfg.rowHeight ?? sizing.rowHeight;
    const headerHeight = cfg.headerHeight ?? sizing.headerHeight;
    const rowCount = Math.min(this.data().length || 1, cfg.pageSize ?? 25);
    const footer = this.footerRow() ? rowHeight : 0;
    const paginationBar = cfg.pagination ? 48 : 0;
    // When the columns are wider than the grid, a horizontal scrollbar appears and
    // eats vertical space — without this allowance the LAST row renders clipped.
    const scrollbar = 16;

    const content =
      headerHeight + rowCount * rowHeight + footer + paginationBar + scrollbar + 2;
    return `min(${content}px, ${cfg.maxAutoHeight ?? '520px'})`;
  });

  // ── Pinned footer (totals) ─────────────────────────────────────────────────
  readonly footerRow = computed<GridRow | null>(() => {
    this.viewVersion(); // recompute when filter/sort changes
    const columns = this.columns();
    if (!columns.some((c) => c.bottomTotal || c.footerLabel || c.footerValue)) return null;
    return buildFooterRow(columns, this.visibleRows());
  });

  readonly pinnedBottomRowData = computed(() => {
    const footer = this.footerRow();
    return footer ? [footer] : [];
  });

  // ── State flags for the template ───────────────────────────────────────────
  readonly hasError = computed(() => !!this.cfg().error);
  readonly isLoading = computed(() => !!this.cfg().loading);
  readonly isEmpty = computed(() => !this.isLoading() && !this.hasError() && this.data().length === 0);
  /** Data exists but the search/filter matched nothing — a different message. */
  readonly isNoResults = computed(() => {
    this.viewVersion();
    return !this.isLoading() && !this.hasError() && this.data().length > 0 && this.visibleCount() === 0;
  });

  readonly hasActiveFilters = computed(() => {
    this.viewVersion();
    // Deliberately NOT `api.isAnyFilterPresent()` — that also reports the external
    // filter used to hide deleted rows, which would offer a "clear filters" button
    // that cannot bring those rows back. Only user-set filters count.
    const model = this.api?.getFilterModel();
    return !!this.searchText() || !!(model && Object.keys(model).length > 0);
  });

  // ── Toolbar: columns / export / bulk ───────────────────────────────────────
  readonly toggleableColumns = computed(() =>
    this.columns().filter((c) => !c.lockVisible && c.cellType !== 'actions'),
  );

  readonly bulkActions = computed<GridBulkAction[]>(() => this.cfg().bulkActions ?? []);

  readonly exportFormats = computed<GridExportFormat[]>(
    () => this.cfg().exportFormats ?? ['excel', 'csv', 'pdf', 'print'],
  );

  actionIcon(kind: GridBulkAction['kind']): string { return erpAction(kind).icon; }
  actionLabel(a: GridBulkAction): string { return a.label ?? erpAction(a.kind).label; }
  actionVariant(a: GridBulkAction): string { return a.variant ?? erpAction(a.kind).variant; }

  bulkDisabled(a: GridBulkAction): boolean {
    const rows = this.selectedRows();
    if (rows.length < (a.minSelection ?? 1)) return true;
    return !!a.disabled && a.disabled(rows);
  }

  runBulk(a: GridBulkAction): void {
    const rows = this.selectedRows();
    if (this.bulkDisabled(a)) return;

    const confirm = resolveConfirm(a.kind, a.confirm);
    if (!confirm) { a.onClick(rows); return; }

    // Bulk confirmations state the row count — "delete 12 records" is a very
    // different decision from "delete this record".
    const message = `${confirm.message.replace(/this record/gi, `${rows.length} record(s)`)}`;
    this.alert.confirm(message, confirm.title, confirm.tone).subscribe((ok) => {
      if (ok) a.onClick(rows);
    });
  }

  // ── AG Grid event handlers ─────────────────────────────────────────────────
  onGridReady(event: AgGridReadyEvent): void {
    this.api = event.api;

    this.restoreColumnState();
    if (this.cfg().autoSizeColumns) event.api.sizeColumnsToFit();
    this.syncDerivedState();

    this.gridReady.emit({
      api: event.api,
      refreshFooter: () => this.viewVersion.update((v) => v + 1),
      addRow: (seed) => this.addRow(seed),
      startEdit: (rowKeyValue) => this.startEdit(rowKeyValue),
      getChanges: () => this.getChanges(),
      resetChanges: () => this.resetChanges(),
    });
  }

  onRowClicked(event: RowClickedEvent): void {
    // Ignore clicks on the pinned totals row.
    if (event.node.rowPinned || !event.data) return;
    this.rowClick.emit(event.data as GridRow);
  }

  onRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (event.node.rowPinned || !event.data) return;
    this.rowDoubleClick.emit(event.data as GridRow);
  }

  onSelectionChanged(): void {
    const rows = (this.api?.getSelectedRows() ?? []) as GridRow[];
    this.selectedRows.set(rows);
    this.selectionChange.emit(rows);
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    const column = (event.colDef?.context as { column?: GridColumnDef } | undefined)?.column;
    const row = event.data as GridRow | undefined;
    if (!column || !row) return;

    column.onChange?.(event.newValue, row, column);
    this.cellChange.emit({
      row,
      field: column.field,
      value: event.newValue,
      previousValue: event.oldValue,
    });

    // In per-cell mode each cell commits on its own, so recalculate here to make
    // derived values (line total, VAT…) appear the moment the field is left.
    // In full-row mode the row commits as a unit — `onRowValueChanged` owns it,
    // otherwise the calculation would run once per changed cell.
    if ((this.cfg().editMode ?? 'fullRow') !== 'fullRow') {
      this.applyEdit(row, event.node.rowIndex);
    }
  }

  /** Snapshot the row so a no-op edit can be told apart from a real one. */
  onRowEditingStarted(event: { data?: unknown }): void {
    this.editSnapshot = event.data ? { ...(event.data as GridRow) } : null;
  }

  /** Full-row editing committed — recalculate and record the row as dirty. */
  onRowValueChanged(event: { data?: unknown; node?: { rowIndex: number | null } }): void {
    const row = event.data as GridRow | undefined;
    if (!row) return;
    this.applyEdit(row, event.node?.rowIndex ?? null);
  }

  /**
   * Recalculate a row, refresh what it affects and mark it dirty.
   * One funnel for both edit modes so the two can never drift apart.
   */
  private applyEdit(row: GridRow, rowIndex: number | null): void {
    const cfg = this.cfg();
    recalculateRow(row, this.columns(), cfg.recalculate);

    // Only record a real change. Opening a row and closing it untouched must not
    // light up "Unsaved" — a dirty flag that cries wolf stops being trusted, and
    // it gates the Save button.
    const before = this.editSnapshot;
    this.editSnapshot = null;
    const changed = !before || this.columns().some((c) => before[c.field] !== row[c.field]);

    // A row added in this session stays an "add", not an "update".
    if (changed && !this.added.has(row)) this.updated.add(row);
    if (!changed) { this.syncDerivedState(); return; }

    const node = rowIndex != null ? this.api?.getDisplayedRowAtIndex(rowIndex) : null;
    if (node) this.api?.refreshCells({ rowNodes: [node], force: true });
    else this.api?.refreshCells({ force: true });

    this.rowSave.emit(row);
    this.markChanged();
  }

  // ── Add / delete ───────────────────────────────────────────────────────────

  /**
   * Start editing a row that already exists in the grid (e.g. one that was just
   * added by the model via `[data]` binding). Finds the row by its `rowKey`
   * value and opens it for editing on the first editable column.
   *
   * <p>Use this instead of {@link addRow} when the owning model is the source
   * of truth and the row already flows in through the data signal.</p>
   */
  startEdit(rowKeyValue: unknown): void {
    if (!this.api) return;
    const cfg = this.cfg();
    const rowKey = cfg.rowKey;
    if (!rowKey) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let found: any = null;
    this.api.forEachNode((node) => {
      if (found || !node.data) return;
      const id = typeof rowKey === 'function'
        ? rowKey(node.data as GridRow)
        : (node.data as GridRow)?.[rowKey];
      if (id === rowKeyValue) found = node;
    });

    if (!found) return;
    const rowIndex: number | null = found.rowIndex;
    if (rowIndex == null) return;
    const firstEditable = this.firstEditableField(found.data as GridRow);
    if (!firstEditable) return;

    this.api.ensureIndexVisible(rowIndex);
    setTimeout(() => this.api?.startEditingCell({ rowIndex, colKey: firstEditable }));
  }

  /**
   * Append a row and open it for editing immediately — a new line is never left
   * blank and unexplained. Focus lands on the first editable column.
   */
  addRow(seed?: GridRow): void {
    const cfg = this.cfg();
    if (!this.api) return;

    const row: GridRow = { ...(cfg.newRowDefaults?.() ?? {}), ...(seed ?? {}) };
    recalculateRow(row, this.columns(), cfg.recalculate);

    // Added through a transaction so the caller's data array is left alone; the
    // form receives the new rows through `getChanges()` when it saves.
    const result = this.api.applyTransaction({ add: [row] });
    this.added.add(row);
    this.rowAdd.emit(row);
    this.markChanged();

    const rowIndex = result?.add?.[0]?.rowIndex;
    const firstEditable = this.firstEditableField(row);
    if (rowIndex != null && firstEditable) {
      // Let AG Grid finish rendering the new row before focusing its editor.
      setTimeout(() => {
        this.api?.ensureIndexVisible(rowIndex);
        this.api?.startEditingCell({ rowIndex, colKey: firstEditable });
      });
    }
    this.syncDerivedState();
  }

  /** First column the user is actually allowed to type into. */
  private firstEditableField(row: GridRow): string | null {
    const col = this.columns().find((c) => {
      if (c.compute || !c.editable) return false;
      return typeof c.editable === 'function' ? c.editable(row) : true;
    });
    return col?.field ?? null;
  }

  /**
   * Hide a row and record it as a pending deletion. Nothing is destroyed here —
   * the form's Save decides, and `resetChanges()` brings it back.
   */
  deleteRow(row: GridRow): void {
    const commit = () => {
      // A row added and then removed in the same session never existed as far as
      // the server is concerned — drop it instead of reporting a delete.
      if (this.added.has(row)) {
        this.added.delete(row);
        this.api?.applyTransaction({ remove: [row] });
      } else {
        this.deleted.add(row);
        this.api?.onFilterChanged();
      }
      this.updated.delete(row);
      this.rowDelete.emit(row);
      this.markChanged();
      this.syncDerivedState();
    };

    if (this.cfg().confirmDelete) {
      this.alert
        .confirm('Remove this row?', 'Remove Row', 'warn')
        .subscribe((ok) => { if (ok) commit(); });
      return;
    }
    commit();
  }

  // ── Pending changes ────────────────────────────────────────────────────────
  readonly changes = computed<GridChanges>(() => {
    this.changeVersion();
    const added = [...this.added];
    const updated = [...this.updated];
    const deleted = [...this.deleted];
    return { added, updated, deleted, dirty: added.length + updated.length + deleted.length > 0 };
  });

  getChanges(): GridChanges { return this.changes(); }

  /** Human summary of what is pending, for the "Unsaved" chip's tooltip. */
  readonly dirtyTooltip = computed(() => {
    const { added, updated, deleted } = this.changes();
    return [
      added.length ? `${added.length} added` : '',
      updated.length ? `${updated.length} edited` : '',
      deleted.length ? `${deleted.length} removed` : '',
    ].filter(Boolean).join(' · ') || 'No pending changes';
  });

  /** Clear pending state and restore hidden rows — call after a successful save. */
  resetChanges(): void {
    this.added.clear();
    this.updated.clear();
    this.deleted.clear();
    this.api?.onFilterChanged();
    this.markChanged();
    this.syncDerivedState();
  }

  private markChanged(): void {
    this.changeVersion.update((v) => v + 1);
    this.viewVersion.update((v) => v + 1); // totals follow the visible rows
    this.changesChange.emit(this.changes());
  }

  onViewChanged(): void {
    this.syncDerivedState();
  }

  /**
   * Keyboard contract while a row is being edited: `Enter` commits, `Esc` cancels.
   *
   * <p>Registered in the CAPTURE phase on the host element. AG Grid's `cellKeyDown`
   * never fires while an editor is open (the editor consumes the key), and a
   * bubble-phase listener is too late because the grid stops propagation. Capture
   * runs before either. Without this the only way to close a row is to click
   * somewhere else — which contradicts what the UI tells the user.</p>
   */
  private onEditKeydown = (event: KeyboardEvent): void => {
    if (!this.api?.getEditingCells().length) return;

    if (event.key === 'Enter') {
      this.api.stopEditing();          // commit
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Escape') {
      this.api.stopEditing(true);      // discard
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Tab') {
      // Recalculate as the user tabs ACROSS the row, so derived cells keep up
      // with what has been typed instead of waiting for the row to commit.
      // Navigation is left to AG Grid — no preventDefault here.
      setTimeout(() => this.liveRecalculate());
    }
  };

  /**
   * Recalculate mid-edit, from values still sitting in the open editors.
   *
   * <p>In full-row mode nothing is written back to the row until the row commits,
   * so a derived column would otherwise show a stale total for as long as the user
   * is typing. This pulls the in-progress editor values into the row, reruns the
   * calculation, and repaints ONLY the derived columns — repainting a column with
   * an open editor would wipe what is being typed.</p>
   */
  private liveRecalculate(): void {
    const api = this.api;
    if (!api) return;

    const editing = api.getEditingCells();
    if (!editing.length) return;

    const node = api.getDisplayedRowAtIndex(editing[0].rowIndex);
    const row = node?.data as GridRow | undefined;
    if (!node || !row) return;

    for (const cell of editing) {
      const colId = cell.column?.getColId();
      if (!colId) continue;
      const [editor] = api.getCellEditorInstances({ columns: [colId], rowNodes: [node] });
      const value = (editor as { getValue?: () => unknown } | undefined)?.getValue?.();
      if (value !== undefined) row[colId] = value;
    }

    recalculateRow(row, this.columns(), this.cfg().recalculate);

    const derived = this.columns().filter((c) => c.compute).map((c) => c.field);
    if (derived.length) {
      api.refreshCells({ rowNodes: [node], columns: derived, force: true });
    }
    // Totals sit below the rows and must track the same in-progress values.
    this.viewVersion.update((v) => v + 1);
  }

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  onSearch(text: string): void {
    this.searchText.set(text);
    this.api?.setGridOption('quickFilterText', text);
    this.syncDerivedState();
  }

  clearFilters(): void {
    this.searchText.set('');
    this.api?.setGridOption('quickFilterText', '');
    this.api?.setFilterModel(null);
    this.syncDerivedState();
  }

  isColumnVisible(field: string): boolean {
    const col = this.api?.getColumn(field);
    return col ? col.isVisible() : true;
  }

  toggleColumn(field: string, visible: boolean): void {
    this.api?.setColumnsVisible([field], visible);
    this.persistColumnState();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  /**
   * Exports the rows the user can actually see (current filter + sort order),
   * not the raw input — an export that disagrees with the screen is a support ticket.
   * The serial column is omitted; it is a view artefact, not data.
   */
  export(format: GridExportFormat): void {
    const cfg = this.cfg();
    const columns = this.columns().filter((c) => !c.excludeFromExport && c.cellType !== 'actions');
    const rows = this.visibleRows();

    // Pre-resolve display values so the export never dumps raw ids.
    const exportRows = rows.map((row) => {
      const record: GridRow = {};
      for (const column of columns) record[column.field] = logicalValue(column, row);
      return record;
    });

    // The export service speaks the legacy ColumnDef shape; values are already
    // resolved, so a title/field pair is all it needs.
    const exportColumns = columns.map<LegacyColumnDef>((c) => ({
      title: c.title,
      field: c.field,
      width: c.width ? `${c.width}` : undefined,
    }));

    const fileName = cfg.exportFileName || cfg.title || 'export';
    switch (format) {
      case 'excel': this.exportService.exportToExcel(exportRows, exportColumns, fileName); break;
      case 'csv':   this.exportService.exportToCsv(exportRows, exportColumns, fileName); break;
      case 'pdf':   void this.exportService.exportToPdf(exportRows, exportColumns, fileName, cfg.title); break;
      case 'print': this.exportService.printTable(exportRows, exportColumns, cfg.title); break;
    }
  }

  exportIcon(format: GridExportFormat): string {
    return format === 'excel' ? 'grid_on'
      : format === 'csv' ? 'description'
      : format === 'pdf' ? 'picture_as_pdf'
      : 'print';
  }

  exportLabel(format: GridExportFormat): string {
    return format === 'excel' ? 'Excel'
      : format === 'csv' ? 'CSV'
      : format === 'pdf' ? 'PDF'
      : 'Print';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Rows currently visible after filter + sort, in display order. */
  private visibleRows(): GridRow[] {
    if (!this.api) return this.data();
    const rows: GridRow[] = [];
    this.api.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) rows.push(node.data as GridRow);
    });
    return rows;
  }

  private syncDerivedState(): void {
    if (!this.api) return;
    this.visibleCount.set(this.api.getDisplayedRowCount());
    this.viewVersion.update((v) => v + 1);

    // The serial number is positional, so it is wrong for every row after any
    // filter / sort / page / delete. AG Grid caches valueGetter results, so the
    // column has to be force-refreshed or the numbers develop gaps (1,2,4,5…).
    if (this.cfg().showSerial) {
      this.api.refreshCells({ columns: ['__serial'], force: true });
    }
  }

  // ── Column state persistence ───────────────────────────────────────────────
  private stateStorageKey(): string | null {
    const key = this.cfg().stateKey;
    return key ? `aidly.grid.${key}` : null;
  }

  private persistColumnState(): void {
    const key = this.stateStorageKey();
    if (!key || !this.api) return;
    try {
      localStorage.setItem(key, JSON.stringify(this.api.getColumnState()));
    } catch {
      // Storage full or blocked (private mode) — column layout is a nicety, not
      // something worth breaking the grid over.
    }
  }

  private restoreColumnState(): void {
    const key = this.stateStorageKey();
    if (!key || !this.api) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      this.api.applyColumnState({ state: JSON.parse(raw), applyOrder: true });
    } catch {
      // Corrupt/stale saved state must never block rendering — fall back to defaults.
      localStorage.removeItem(key);
    }
  }

  onColumnLayoutChanged(): void {
    this.persistColumnState();
  }
}

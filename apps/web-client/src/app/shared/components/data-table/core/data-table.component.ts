// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Core Component
// ═══════════════════════════════════════════════════════════════════

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { SelectionModel } from '@angular/cdk/collections';

import {
  ColumnDef,
  RowData,
  SqlState,
  TableConfig,
  TableState,
  RowEvent,
  ValidationMap,
} from '../types/data-table.types';
import { CellDisplayPipe } from '../pipes/cell-display.pipe';
import { runPipeline } from '../utils/pipeline.util';
import {
  stampRows,
  createBlankRow,
  duplicateRow,
  markRowDeleted,
  revertRow,
  applyEdit,
} from '../utils/row.util';
import { validateRow, isValidationMapClean } from '../utils/validation.util';
import { exportCSV, exportXLSX, exportPDF } from '../utils/export.util';
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_DENSITY_INDEX,
  DENSITY_CYCLE,
} from '../constants/data-table.constants';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    CellDisplayPipe,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────
  @Input() config!: TableConfig;
  @Input() columns: ColumnDef[] = [];
  @Input() data: RowData[] = [];

  // ── Outputs ───────────────────────────────────────────────────────
  @Output() dataChange = new EventEmitter<RowData[]>();
  @Output() rowEvent = new EventEmitter<RowEvent>();
  @Output() selectionChange = new EventEmitter<RowData[]>();

  // ── View Modal state ─────────────────────────────────────────────
  viewingRow: RowData | null = null;

  // ── Internal rows ────────────────────────────────────────────────
  private _rows: RowData[] = [];

  // ── Pipeline results ─────────────────────────────────────────────
  filteredData: RowData[] = [];
  pagedData: RowData[] = [];
  summaryRow: Record<string, any> = {};
  readonly SqlState = SqlState;

  // ── Row edit & selection ─────────────────────────────────────────
  editingRowId: string | null = null;
  selectedRowId: string | null = null;
  selection = new SelectionModel<RowData>(true, []);

  // ── Validation ───────────────────────────────────────────────────
  validationMap: ValidationMap = {};

  // ── Table state ───────────────────────────────────────────────────
  state: TableState = {
    sort: { column: '', direction: '' },
    pagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    globalFilter: '',
    columnFilters: {},
  };

  // ── UI state ─────────────────────────────────────────────────────
  columnFilterRow = false;
  isFullscreen = false;
  densityIndex = 1; // 0=compact 1=normal 2=comfortable
  openDropdown: 'columns' | 'export' | null = null;
  loadingExport = false;
  toastMessage: string | null = null;
  private toastTimer: any;

  // ── Resize state ──────────────────────────────────────────────────
  resizingColumn: ColumnDef | null = null;
  startX: number = 0;
  startWidth: number = 0;

  // ── Computed ──────────────────────────────────────────────────────
  get displayColumns(): ColumnDef[] {
    return this.columns.filter((c) => !c.hidden);
  }

  get editableColumns(): ColumnDef[] {
    return this.displayColumns.filter((c) => c.editable);
  }

  get densityClass(): string {
    return DENSITY_CYCLE[this.densityIndex].class;
  }

  get densityIcon(): string {
    return DENSITY_CYCLE[this.densityIndex].icon;
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredData.length / this.state.pagination.pageSize),
    );
  }

  get startRow(): number {
    return this.filteredData.length === 0
      ? 0
      : (this.state.pagination.page - 1) * this.state.pagination.pageSize + 1;
  }

  get endRow(): number {
    return Math.min(
      this.state.pagination.page * this.state.pagination.pageSize,
      this.filteredData.length,
    );
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.state.pagination.page;
    let start = Math.max(1, cur - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get pageSizeOptions(): number[] {
    return this.config?.pageSizeOptions || DEFAULT_PAGE_SIZE_OPTIONS;
  }

  get pendingChangesCount(): number {
    return this._rows.filter((r) => r['sqlState'] !== SqlState.UNCHANGED)
      .length;
  }

  get hasPinnedLeft(): boolean {
    return this.displayColumns.some(c => c.pinned === 'left');
  }
  
  get hasPinnedRight(): boolean {
    return this.displayColumns.some(c => c.pinned === 'right');
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.init();
  }
  ngOnChanges(c: SimpleChanges): void {
    if (c['data']) this.init();
  }

  // ══════════════════════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════════════════════
  private init(): void {
    this._rows = stampRows(this.data || []);
    this.state.pagination.pageSize =
      this.config?.defaultPageSize ??
      this.pageSizeOptions[0] ??
      DEFAULT_PAGE_SIZE;
    this.state.pagination.page = 1;
    this.validationMap = {};
    this.apply();
  }

  // ══════════════════════════════════════════════════════════════════
  //  PIPELINE
  // ══════════════════════════════════════════════════════════════════
  apply(): void {
    const { filtered, paged, summary } = runPipeline(
      this._rows,
      this.state,
      this.displayColumns,
    );
    this.filteredData = filtered;
    this.pagedData = paged;
    this.summaryRow = summary;
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════
  //  ROW EDIT
  // ══════════════════════════════════════════════════════════════════
  activateRow(rowId: string, focusKey?: string): void {
    this.editingRowId = rowId;
    this.selectedRowId = rowId;
    const key = focusKey ?? this.editableColumns[0]?.key;
    if (key) {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(
          `[data-row="${rowId}"][data-col="${key}"]`,
        );
        (el as any)?.focus?.();
        if (el instanceof HTMLInputElement) el.select();
      }, 20);
    }
    this.cdr.markForCheck();
  }

  isRowEditing(rowId: string): boolean {
    return this.editingRowId === rowId;
  }
  isRowSelected(rowId: string): boolean {
    return this.selectedRowId === rowId;
  }

  onRowClick(row: RowData): void {
    this.selectedRowId = row['_rowId']!;
    if (this.editingRowId !== row['_rowId']) this.editingRowId = null;
    this.cdr.markForCheck();
  }

  getStickyBg(row?: RowData): string {
    if (!row) return '#f7f8fc'; // Opaque theme equivalent of var(--bg-secondary)
    
    const id = row['_rowId']!;
    if (this.isRowEditing(id)) return '#eff6ff';
    if (this.isRowSelected(id)) return '#f0f7ff';
    if (row['sqlState'] === SqlState.INSERT) return '#f0fdf4';
    if (row['sqlState'] === SqlState.UPDATE) return '#fffbeb';
    if (this.config?.stripedRows && row['_index'] % 2 === 0) return '#f9fafb';
    
    return '#ffffff';
  }

  trackByRowId(index: number, row: RowData): string | number {
    return row['_rowId'] || index;
  }

  onCellClick(row: RowData, col: ColumnDef): void {
    if (!col.editable || this.config?.allowInlineEdit === false) return;
    this.activateRow(row['_rowId']!, col.key);
  }

  // ── Cell edit ─────────────────────────────────────────────────────
  onCellEdit(row: RowData, col: ColumnDef, value: any): void {
    this._rows = applyEdit(this._rows, row['_rowId']!, col.key, value);

    // Validate
    const updatedRow = this._rows.find((r) => r['_rowId'] === row['_rowId'])!;
    const partial = validateRow(
      row['_rowId']!,
      updatedRow,
      this.columns.filter((c) => c.validation),
    );
    this.validationMap = { ...this.validationMap, ...partial };

    this.apply();
    if (this.config?.autoSave) this.emitDataChange();
    this.rowEvent.emit({
      type: 'edit',
      row: updatedRow,
      column: col.key,
      value,
    });
  }

  getCellError(rowId: string, colKey: string): string | null {
    return this.validationMap[rowId]?.[colKey]?.message ?? null;
  }

  isCellInvalid(rowId: string, colKey: string): boolean {
    return this.validationMap[rowId]?.[colKey]?.valid === false;
  }

  // ── Keyboard navigation ───────────────────────────────────────────
  onCellKeydown(event: KeyboardEvent, row: RowData, col: ColumnDef): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const cols = this.editableColumns;
      const idx = cols.findIndex((c) => c.key === col.key);
      const nextI = event.shiftKey ? idx - 1 : idx + 1;

      if (nextI >= 0 && nextI < cols.length) {
        const nextKey = cols[nextI].key;
        setTimeout(() => {
          const el = document.querySelector<HTMLElement>(
            `[data-row="${row['_rowId']}"][data-col="${nextKey}"]`,
          );
          (el as any)?.focus?.();
          if (el instanceof HTMLInputElement) el.select();
        }, 10);
      } else {
        const curI = this.pagedData.findIndex(
          (r) => r['_rowId'] === row['_rowId'],
        );
        const sibling =
          this.pagedData[nextI >= cols.length ? curI + 1 : curI - 1];
        if (sibling)
          this.activateRow(
            sibling['_rowId']!,
            nextI >= cols.length ? cols[0].key : cols[cols.length - 1].key,
          );
      }
    }

    if (event.key === 'Escape') {
      this.editingRowId = null;
      this.cdr.markForCheck();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const curI = this.pagedData.findIndex(
        (r) => r['_rowId'] === row['_rowId'],
      );
      const nextRow = this.pagedData[curI + 1];
      nextRow
        ? this.activateRow(nextRow['_rowId']!, col.key)
        : ((this.editingRowId = null), this.cdr.markForCheck());
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  ROW CRUD
  // ══════════════════════════════════════════════════════════════════
  addRow(): void {
    const row = createBlankRow(this.columns);
    this._rows.unshift(row);
    this.state.pagination.page = 1;
    this.apply();
    setTimeout(
      () => this.activateRow(row['_rowId']!, this.editableColumns[0]?.key),
      50,
    );
    this.rowEvent.emit({ type: 'add', row });
    this.emitDataChange();
    this.showToast('newRowAdded');
  }

  deleteRow(row: RowData): void {
    this._rows = markRowDeleted(this._rows, row['_rowId']!);
    if (this.editingRowId === row['_rowId']) this.editingRowId = null;
    if (this.selectedRowId === row['_rowId']) this.selectedRowId = null;
    this.selection.deselect(row);
    this.apply();
    this.rowEvent.emit({ type: 'delete', row });
    this.emitDataChange();
    this.showToast('rowDeleted');
  }

  duplicateRowAction(row: RowData): void {
    const dup = duplicateRow(row);
    const idx = this._rows.findIndex((r) => r['_rowId'] === row['_rowId']);
    this._rows.splice(idx + 1, 0, dup);
    this.apply();
    this.rowEvent.emit({ type: 'duplicate', row: dup });
    this.emitDataChange();
    this.showToast('rowDuplicated');
  }

  revertRowAction(row: RowData): void {
    this._rows = revertRow(this._rows, row['_rowId']!);
    delete this.validationMap[row['_rowId']!];
    this.apply();
    this.rowEvent.emit({ type: 'revert', row });
    this.emitDataChange();
    this.showToast('rowReverted');
  }

  deleteSelected(): void {
    const toDelete = [...this.selection.selected];
    toDelete.forEach((r) => this.deleteRow(r));
    this.selection.clear();
  }

  revertAll(): void {
    this._rows = this._rows
      .filter((r) => r['sqlState'] !== SqlState.INSERT)
      .map((r) =>
        r['_original']
          ? {
              ...r['_original'],
              _rowId: r['_rowId'],
              sqlState: SqlState.UNCHANGED,
              _original: undefined,
            }
          : r,
      );
    this.validationMap = {};
    this.apply();
    this.emitDataChange();
    this.showToast('allChangesReverted');
  }

  // ══════════════════════════════════════════════════════════════════
  //  CHECKBOX SELECTION
  // ══════════════════════════════════════════════════════════════════
  isAllSelected(): boolean {
    return (
      this.pagedData.length > 0 &&
      this.pagedData.every((r) => this.selection.isSelected(r))
    );
  }

  isIndeterminate(): boolean {
    const n = this.pagedData.filter((r) => this.selection.isSelected(r)).length;
    return n > 0 && n < this.pagedData.length;
  }

  toggleAll(): void {
    this.isAllSelected()
      ? this.pagedData.forEach((r) => this.selection.deselect(r))
      : this.pagedData.forEach((r) => this.selection.select(r));
    this.selectionChange.emit(this.selection.selected);
    this.cdr.markForCheck();
  }

  toggleCheckbox(row: RowData, checked: boolean): void {
    checked ? this.selection.select(row) : this.selection.deselect(row);
    this.selectionChange.emit(this.selection.selected);
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════
  //  SORT
  // ══════════════════════════════════════════════════════════════════
  sort(col: ColumnDef): void {
    if (col.sortable === false) return;
    const s = this.state.sort;
    if (s.column === col.key) {
      s.direction =
        s.direction === 'asc' ? 'desc' : s.direction === 'desc' ? '' : 'asc';
      if (!s.direction) s.column = '';
    } else {
      s.column = col.key;
      s.direction = 'asc';
    }
    this.state.pagination.page = 1;
    this.apply();
  }

  sortIcon(col: ColumnDef): string {
    if (this.state.sort.column !== col.key) return 'unfold_more';
    return this.state.sort.direction === 'asc'
      ? 'arrow_upward'
      : 'arrow_downward';
  }

  // ══════════════════════════════════════════════════════════════════
  //  FILTERS
  // ══════════════════════════════════════════════════════════════════
  onGlobalFilter(e: Event): void {
    this.state.globalFilter = (e.target as HTMLInputElement).value;
    this.state.pagination.page = 1;
    this.apply();
  }

  clearGlobalFilter(): void {
    this.state.globalFilter = '';
    this.state.pagination.page = 1;
    this.apply();
  }

  onColumnFilter(key: string, e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    if (val) this.state.columnFilters[key] = val;
    else delete this.state.columnFilters[key];
    this.state.pagination.page = 1;
    this.apply();
  }

  clearColumnFilter(key: string): void {
    delete this.state.columnFilters[key];
    this.state.pagination.page = 1;
    this.apply();
  }

  clearAllFilters(): void {
    this.state.globalFilter = '';
    this.state.columnFilters = {};
    this.state.pagination.page = 1;
    this.apply();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.state.globalFilter ||
      Object.keys(this.state.columnFilters).length > 0
    );
  }

  toggleColumnFilters(): void {
    this.columnFilterRow = !this.columnFilterRow;
    this.cdr.markForCheck();
  }

  toggleColumnVisibility(col: ColumnDef): void {
    if (col.required) return;
    col.hidden = !col.hidden;
    this.apply();
  }

  // ══════════════════════════════════════════════════════════════════
  //  PAGINATION
  // ══════════════════════════════════════════════════════════════════
  goToPage(p: number): void {
    this.state.pagination.page = Math.max(1, Math.min(p, this.totalPages));
    this.apply();
  }

  changePageSize(s: number): void {
    this.state.pagination.pageSize = s;
    this.state.pagination.page = 1;
    this.apply();
  }

  // ══════════════════════════════════════════════════════════════════
  //  DENSITY / FULLSCREEN
  // ══════════════════════════════════════════════════════════════════
  cycleDensity(): void {
    this.densityIndex = (this.densityIndex + 1) % DENSITY_CYCLE.length;
    this.cdr.markForCheck();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════
  //  EXPORT
  // ══════════════════════════════════════════════════════════════════
  async runExport(
    format: 'csv' | 'xlsx' | 'pdf',
    selectedOnly = false,
  ): Promise<void> {
    this.loadingExport = true;
    this.openDropdown = null;
    this.cdr.markForCheck();

    try {
      const rows = selectedOnly ? this.selection.selected : this.filteredData;
      const payload = {
        columns: this.displayColumns,
        rows,
        filename: this.config?.exportFilename || 'export',
        title: this.config?.exportTitle,
      };

      if (format === 'csv') exportCSV(payload);
      if (format === 'xlsx') await exportXLSX(payload);
      if (format === 'pdf') await exportPDF(payload);

      this.showToast(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      console.error('[DataTable] Export error:', err);
      this.showToast(`Export failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      this.loadingExport = false;
      this.cdr.markForCheck();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  TOAST
  // ══════════════════════════════════════════════════════════════════
  showToast(msg: string, duration = 2500): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = msg;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.markForCheck();
    }, duration);
  }

  // ══════════════════════════════════════════════════════════════════
  //  DROPDOWN
  // ══════════════════════════════════════════════════════════════════
  toggleDropdown(name: 'columns' | 'export', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? null : name;
    this.cdr.markForCheck();
  }

  // ══════════════════════════════════════════════════════════════════
  //  HOST LISTENERS
  // ══════════════════════════════════════════════════════════════════
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.erp-table-host')) {
      this.editingRowId = null;
      this.openDropdown = null;
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    if (this.isFullscreen) {
      this.isFullscreen = false;
    }
    if (this.editingRowId) {
      this.editingRowId = null;
    }
    if (this.openDropdown) {
      this.openDropdown = null;
    }
    if (this.viewingRow) {
      this.viewingRow = null;
    }
    this.cdr.markForCheck();
  }

  // ── View Actions ──────────────────────────────────────────────────
  viewRowAction(row: RowData): void {
    this.viewingRow = { ...row };
    this.cdr.markForCheck();
  }

  closeViewAction(): void {
    this.viewingRow = null;
    this.cdr.markForCheck();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.resizingColumn) {
      const diff = event.pageX - this.startX;
      let newWidth = Math.max(50, this.startWidth + diff);
      this.resizingColumn.width = `${newWidth}px`;
      
      // We must mark For Check to update the col width in HTML
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.resizingColumn) {
      this.resizingColumn = null;
      this.cdr.markForCheck();
      
      // Optionally emit a config change event so the parent can save column widths
      // this.configChange.emit(this.columns);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  //  COLUMN RESIZE ACTIONS
  // ══════════════════════════════════════════════════════════════════
  onResizeStart(event: MouseEvent, col: ColumnDef): void {
    if (this.config.allowColumnResize === false) return;
    
    event.stopPropagation();
    event.preventDefault();
    this.resizingColumn = col;
    this.startX = event.pageX;

    // Get the current width from the DOM element instead of assuming
    const th = (event.target as HTMLElement).closest('th');
    this.startWidth = th ? th.offsetWidth : 100;
  }

  // ══════════════════════════════════════════════════════════════════
  //  PINNED SETTINGS & TRACKBY
  // ══════════════════════════════════════════════════════════════════
  getPinnedStyles(col: ColumnDef): any {
    if (!col.pinned) return null;
    const style: any = {};
    if (col.pinned === 'left') {
      let left = 0;
      if (this.config.showRowNumbers) left += 48;
      if (this.config.allowRowSelection) left += 40;
      for (const c of this.displayColumns) {
        if (c.key === col.key) break;
        if (c.pinned === 'left') left += parseInt(c.width || '100', 10);
      }
      style['left'] = `${left}px`;
    } else if (col.pinned === 'right') {
      let right = 0;
      if (this.config.allowDelete) right += 90;
      const rev = [...this.displayColumns].reverse();
      for (const c of rev) {
        if (c.key === col.key) break;
        if (c.pinned === 'right') right += parseInt(c.width || '100', 10);
      }
      style['right'] = `${right}px`;
    }
    return style;
  }

  rowStateClass(row: RowData): string {
    const base = ['etbl-row'];
    switch (row['sqlState']) {
      case SqlState.INSERT:
        base.push('row-insert');
        break;
      case SqlState.UPDATE:
        base.push('row-update');
        break;
      case SqlState.DELETE:
        base.push('row-delete');
        break;
    }
    if (this.config?.stripedRows) base.push('etbl-row-striped');
    return base.join(' ');
  }

  getOptionLabel(col: ColumnDef, value: any): string {
    return col.options?.find((o) => o.value === value)?.label ?? value ?? '—';
  }

  getOptionColor(col: ColumnDef, value: any): string | undefined {
    return col.options?.find((o) => o.value === value)?.color;
  }

  trackByKey(_: number, col: ColumnDef): string {
    return col.key;
  }
  trackById(_: number, row: RowData): string {
    return row['_rowId']!;
  }

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC API (for parent via ViewChild)
  // ══════════════════════════════════════════════════════════════════
  getChangedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] !== SqlState.UNCHANGED);
  }
  getDeletedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] === SqlState.DELETE);
  }
  getInsertedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] === SqlState.INSERT);
  }
  getUpdatedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] === SqlState.UPDATE);
  }
  getAllData(): RowData[] {
    return [...this._rows];
  }
  isValid(): boolean {
    return isValidationMapClean(this.validationMap);
  }
  clearSelection(): void {
    this.selection.clear();
    this.cdr.markForCheck();
  }

  private emitDataChange(): void {
    this.dataChange.emit(this._rows);
  }
}

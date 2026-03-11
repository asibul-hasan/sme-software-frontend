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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { ColumnDef, RowData, SqlState, TableConfig } from './data-table.models';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent implements OnInit, OnChanges {
  @Input() config!: TableConfig;
  @Input() columns: ColumnDef[] = [];
  @Input() data: RowData[] = [];
  @Output() dataChange = new EventEmitter<RowData[]>();

  // ── Internal data ──────────────────────────────────────────────
  private _rows: RowData[] = [];
  filteredData: RowData[] = [];
  pagedData: RowData[] = [];
  summaryRow: Record<string, any> = {};

  // ── Row editing ────────────────────────────────────────────────
  /** The _rowId of the row currently in edit mode */
  editingRowId: string | null = null;
  /** The column key of the cell that should receive focus */
  focusCell: string | null = null;

  // ── Row selection (persistent until another row clicked) ───────
  selectedRowId: string | null = null;

  // ── Checkbox selection ─────────────────────────────────────────
  selection = new SelectionModel<RowData>(true, []);

  // ── Sort / Filter / Page ───────────────────────────────────────
  state = {
    globalFilter: '',
    columnFilters: {} as Record<string, string>,
    sortColumn: '',
    sortDirection: 'asc' as 'asc' | 'desc' | '',
    page: 1,
    pageSize: 10,
  };

  columnFilterRow = false;
  isFullscreen = false;
  densityClass = 'density-normal';
  densityIcon = 'density_medium';

  // ── Dropdown open state ────────────────────────────────────────
  openDropdown: 'columns' | 'export' | null = null;

  get displayColumns(): ColumnDef[] {
    return this.columns.filter((c) => !c.hidden);
  }

  get editableColumns(): ColumnDef[] {
    return this.displayColumns.filter((c) => c.editable);
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredData.length / this.state.pageSize),
    );
  }

  get startRow(): number {
    return this.filteredData.length === 0
      ? 0
      : (this.state.page - 1) * this.state.pageSize + 1;
  }

  get endRow(): number {
    return Math.min(
      this.state.page * this.state.pageSize,
      this.filteredData.length,
    );
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const cur = this.state.page;
    let start = Math.max(1, cur - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) this.init();
  }

  private init(): void {
    this._rows = (this.data || []).map((r, i) => ({
      ...r,
      _rowId: r['_rowId'] || `row-${i}-${Date.now()}`,
      sqlState: r['sqlState'] ?? SqlState.UNCHANGED,
    }));
    this.state.pageSize = this.config.pageSizeOptions?.[0] ?? 10;
    this.apply();
  }

  // ── Pipeline ────────────────────────────────────────────────────
  apply(): void {
    let rows = [...this._rows].filter((r) => r['sqlState'] !== SqlState.DELETE);

    // Global filter
    if (this.state.globalFilter) {
      const q = this.state.globalFilter.toLowerCase();
      rows = rows.filter((r) =>
        this.displayColumns.some((c) =>
          String(r[c.key] ?? '')
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    // Column filters
    Object.entries(this.state.columnFilters).forEach(([key, val]) => {
      if (val)
        rows = rows.filter((r) =>
          String(r[key] ?? '')
            .toLowerCase()
            .includes(val.toLowerCase()),
        );
    });

    // Sort
    if (this.state.sortColumn && this.state.sortDirection) {
      const dir = this.state.sortDirection === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const av = a[this.state.sortColumn] ?? '';
        const bv = b[this.state.sortColumn] ?? '';
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    }

    this.filteredData = rows;

    // Summary
    this.summaryRow = {};
    this.columns
      .filter((c) => c.type === 'number')
      .forEach((c) => {
        this.summaryRow[c.key] = rows
          .reduce((s, r) => s + (+r[c.key] || 0), 0)
          .toFixed(2);
      });

    this.paginate();
    this.cdr.markForCheck();
  }

  private paginate(): void {
    const start = (this.state.page - 1) * this.state.pageSize;
    this.pagedData = this.filteredData.slice(
      start,
      start + this.state.pageSize,
    );
  }

  // ── Row Edit Mode ───────────────────────────────────────────────
  activateRow(rowId: string, focusKey?: string): void {
    this.editingRowId = rowId;
    this.selectedRowId = rowId;
    this.focusCell = focusKey ?? this.editableColumns[0]?.key ?? null;
    this.cdr.markForCheck();

    // Focus the input on next tick
    if (this.focusCell) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement | HTMLSelectElement>(
          `[data-row="${rowId}"][data-col="${this.focusCell}"]`,
        );
        el?.focus();
      }, 30);
    }
  }

  isRowEditing(rowId: string): boolean {
    return this.editingRowId === rowId;
  }

  isRowSelected(rowId: string): boolean {
    return this.selectedRowId === rowId;
  }

  onRowClick(row: RowData): void {
    this.selectedRowId = row['_rowId']!;
    if (this.editingRowId !== row['_rowId']) {
      this.editingRowId = null;
    }
    this.cdr.markForCheck();
  }

  onCellClick(row: RowData, col: ColumnDef): void {
    if (!col.editable) return;
    this.activateRow(row['_rowId']!, col.key);
  }

  // ── Tab navigation between editable cells in a row ─────────────
  onCellKeydown(event: KeyboardEvent, row: RowData, col: ColumnDef): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const editableCols = this.editableColumns;
      const idx = editableCols.findIndex((c) => c.key === col.key);
      const nextIdx = event.shiftKey ? idx - 1 : idx + 1;

      if (nextIdx >= 0 && nextIdx < editableCols.length) {
        // Move to next cell in same row
        const nextKey = editableCols[nextIdx].key;
        this.focusCell = nextKey;
        this.cdr.markForCheck();
        setTimeout(() => {
          const el = document.querySelector<
            HTMLInputElement | HTMLSelectElement
          >(`[data-row="${row['_rowId']}"][data-col="${nextKey}"]`);
          el?.focus();
          if (el instanceof HTMLInputElement) el.select();
        }, 20);
      } else if (nextIdx >= editableCols.length) {
        // Move to first cell of next row
        const curPageIdx = this.pagedData.findIndex(
          (r) => r['_rowId'] === row['_rowId'],
        );
        const nextRow = this.pagedData[curPageIdx + 1];
        if (nextRow) {
          this.activateRow(nextRow['_rowId']!, editableCols[0].key);
        }
      } else {
        // Shift+Tab at first cell → go to last cell of previous row
        const curPageIdx = this.pagedData.findIndex(
          (r) => r['_rowId'] === row['_rowId'],
        );
        const prevRow = this.pagedData[curPageIdx - 1];
        if (prevRow) {
          this.activateRow(
            prevRow['_rowId']!,
            editableCols[editableCols.length - 1].key,
          );
        }
      }
    }

    if (event.key === 'Escape') {
      this.editingRowId = null;
      this.cdr.markForCheck();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const curPageIdx = this.pagedData.findIndex(
        (r) => r['_rowId'] === row['_rowId'],
      );
      const nextRow = this.pagedData[curPageIdx + 1];
      if (nextRow) {
        this.activateRow(nextRow['_rowId']!, col.key);
      } else {
        this.editingRowId = null;
        this.cdr.markForCheck();
      }
    }
  }

  // ── Cell value change ───────────────────────────────────────────
  onCellEdit(row: RowData, col: ColumnDef, value: any): void {
    const target = this._rows.find((r) => r['_rowId'] === row['_rowId']);
    if (!target) return;
    target[col.key] = value;
    if (target['sqlState'] === SqlState.UNCHANGED)
      target['sqlState'] = SqlState.UPDATE;
    this.apply();
    this.dataChange.emit(this._rows);
  }

  // ── Click outside to deselect edit mode ────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const host = (e.target as HTMLElement).closest('.erp-table-host');
    if (!host) {
      this.editingRowId = null;
      this.openDropdown = null;
      this.cdr.markForCheck();
    }
  }

  // ── Dropdown toggle ─────────────────────────────────────────────
  toggleDropdown(name: 'columns' | 'export', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === name ? null : name;
    this.cdr.markForCheck();
  }

  // ── Sort ────────────────────────────────────────────────────────
  sort(col: ColumnDef): void {
    if (col.sortable === false) return;
    if (this.state.sortColumn === col.key) {
      this.state.sortDirection =
        this.state.sortDirection === 'asc'
          ? 'desc'
          : this.state.sortDirection === 'desc'
            ? ''
            : 'asc';
      if (!this.state.sortDirection) this.state.sortColumn = '';
    } else {
      this.state.sortColumn = col.key;
      this.state.sortDirection = 'asc';
    }
    this.state.page = 1;
    this.apply();
  }

  sortIcon(col: ColumnDef): string {
    if (this.state.sortColumn !== col.key) return 'unfold_more';
    return this.state.sortDirection === 'asc'
      ? 'arrow_upward'
      : 'arrow_downward';
  }

  // ── Filters ─────────────────────────────────────────────────────
  onGlobalFilter(e: Event): void {
    this.state.globalFilter = (e.target as HTMLInputElement).value;
    this.state.page = 1;
    this.apply();
  }

  clearGlobalFilter(): void {
    this.state.globalFilter = '';
    this.state.page = 1;
    this.apply();
  }

  onColumnFilter(key: string, e: Event): void {
    this.state.columnFilters[key] = (e.target as HTMLInputElement).value;
    this.state.page = 1;
    this.apply();
  }

  clearColumnFilter(key: string): void {
    delete this.state.columnFilters[key];
    this.state.page = 1;
    this.apply();
  }

  clearAllFilters(): void {
    this.state.globalFilter = '';
    this.state.columnFilters = {};
    this.state.page = 1;
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

  // ── Row CRUD ────────────────────────────────────────────────────
  addRow(): void {
    const newRow: RowData = {
      _rowId: `row-new-${Date.now()}`,
      sqlState: SqlState.INSERT,
    };
    this.columns.forEach((c) => {
      if (!newRow[c.key]) newRow[c.key] = '';
    });
    this._rows.unshift(newRow);
    this.state.page = 1;
    this.apply();
    // Immediately enter edit mode on the new row
    setTimeout(
      () => this.activateRow(newRow['_rowId']!, this.editableColumns[0]?.key),
      50,
    );
    this.dataChange.emit(this._rows);
  }

  deleteRow(row: RowData): void {
    const target = this._rows.find((r) => r['_rowId'] === row['_rowId']);
    if (!target) return;
    if (target['sqlState'] === SqlState.INSERT) {
      this._rows = this._rows.filter((r) => r['_rowId'] !== row['_rowId']);
    } else {
      target['sqlState'] = SqlState.DELETE;
    }
    if (this.editingRowId === row['_rowId']) this.editingRowId = null;
    if (this.selectedRowId === row['_rowId']) this.selectedRowId = null;
    this.apply();
    this.dataChange.emit(this._rows);
  }

  duplicateRow(row: RowData): void {
    const idx = this._rows.findIndex((r) => r['_rowId'] === row['_rowId']);
    const dup: RowData = {
      ...row,
      _rowId: `row-dup-${Date.now()}`,
      sqlState: SqlState.INSERT,
    };
    this._rows.splice(idx + 1, 0, dup);
    this.apply();
    this.dataChange.emit(this._rows);
  }

  deleteSelected(): void {
    this.selection.selected.forEach((r) => this.deleteRow(r));
    this.selection.clear();
  }

  // ── Selection ───────────────────────────────────────────────────
  isAllSelected(): boolean {
    return (
      this.pagedData.length > 0 &&
      this.pagedData.every((r) => this.selection.isSelected(r))
    );
  }

  isIndeterminate(): boolean {
    const sel = this.pagedData.filter((r) => this.selection.isSelected(r));
    return sel.length > 0 && sel.length < this.pagedData.length;
  }

  toggleAll(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.pagedData.forEach((r) => this.selection.select(r));
    this.cdr.markForCheck();
  }

  toggleCheckbox(row: RowData, event: MouseEvent): void {
    event.stopPropagation();
    this.selection.toggle(row);
    this.cdr.markForCheck();
  }

  // ── Pagination ──────────────────────────────────────────────────
  goToPage(p: number): void {
    this.state.page = Math.max(1, Math.min(p, this.totalPages));
    this.paginate();
    this.cdr.markForCheck();
  }

  changePageSize(s: number): void {
    this.state.pageSize = s;
    this.state.page = 1;
    this.paginate();
    this.cdr.markForCheck();
  }

  // ── Density / Fullscreen ────────────────────────────────────────
  cycleDensity(): void {
    const cycle = [
      'density-compact',
      'density-normal',
      'density-comfortable',
    ] as const;
    const icons = ['density_small', 'density_medium', 'density_large'];
    const i = (cycle.indexOf(this.densityClass as any) + 1) % 3;
    this.densityClass = cycle[i];
    this.densityIcon = icons[i];
    this.cdr.markForCheck();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.cdr.markForCheck();
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    if (this.isFullscreen) this.isFullscreen = false;
    if (this.editingRowId) this.editingRowId = null;
    if (this.openDropdown) this.openDropdown = null;
    this.cdr.markForCheck();
  }

  // ── Row state CSS ───────────────────────────────────────────────
  rowStateClass(row: RowData): string {
    const classes = ['etbl-row'];
    switch (row['sqlState']) {
      case SqlState.INSERT:
        classes.push('row-insert');
        break;
      case SqlState.UPDATE:
        classes.push('row-update');
        break;
      case SqlState.DELETE:
        classes.push('row-delete');
        break;
    }
    return classes.join(' ');
  }

  // ── Helpers ─────────────────────────────────────────────────────
  getOptionLabel(col: ColumnDef, value: any): string {
    return col.options?.find((o) => o.value === value)?.label ?? value ?? '—';
  }

  trackByKey(_: number, col: ColumnDef): string {
    return col.key;
  }
  trackById(_: number, row: RowData): string {
    return row['_rowId']!;
  }

  // ── Export ──────────────────────────────────────────────────────
  exportCSV(selectedOnly = false): void {
    const rows = selectedOnly ? this.selection.selected : this.filteredData;
    const headers = this.displayColumns.map((c) => c.header);
    const body = rows.map((r) =>
      this.displayColumns.map((c) => r[c.key] ?? ''),
    );
    const csv = [headers, ...body]
      .map((r) => r.map((v) => `"${v}"`).join(','))
      .join('\n');
    this.download(new Blob([csv], { type: 'text/csv' }), 'export.csv');
    this.openDropdown = null;
  }

  exportXLSX(): void {
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet([
        this.displayColumns.map((c) => c.header),
        ...this.filteredData.map((r) =>
          this.displayColumns.map((c) => r[c.key] ?? ''),
        ),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, 'export.xlsx');
    });
    this.openDropdown = null;
  }

  exportPDF(selectedOnly = false): void {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const rows = selectedOnly ? this.selection.selected : this.filteredData;
        (doc as any).autoTable({
          head: [this.displayColumns.map((c) => c.header)],
          body: rows.map((r) => this.displayColumns.map((c) => r[c.key] ?? '')),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [13, 110, 253] },
        });
        doc.save('export.pdf');
      });
    });
    this.openDropdown = null;
  }

  private download(blob: Blob, name: string): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }
  toggleColumnVisibility(e: any) {}
  // ── Public API ──────────────────────────────────────────────────
  getChangedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] !== SqlState.UNCHANGED);
  }
  getDeletedRows(): RowData[] {
    return this._rows.filter((r) => r['sqlState'] === SqlState.DELETE);
  }
  getAllData(): RowData[] {
    return [...this._rows];
  }
}

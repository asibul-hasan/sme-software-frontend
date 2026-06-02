import {
  AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, inject,
  input, model, OnChanges, OnDestroy, output, signal, SimpleChanges, viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort as MatSortEvent } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { SelectionModel } from '@angular/cdk/collections';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { UiBadgeComponent } from '@app/shared/ui/badge/ui-badge.component';
import { UiMenuComponent } from '@app/shared/ui/menu/ui-menu.component';
import { UiMenuTriggerDirective } from '@app/shared/ui/menu/ui-menu-trigger.directive';
import { UiTooltipDirective } from '@app/shared/ui/tooltip/ui-tooltip.directive';

import {
  BadgeConfig, CellButtonConfig, ColumnDef, DEFAULT_TABLE_CONFIG,
  ExportFormat, PageEvent, SelectOption, SortState, TableAction, TableConfig,
} from './table.types';
import { TableExportService } from './table-export.service';
import { TableViewModalComponent } from './table-view-modal.component';

@Component({
  selector: 'app-common-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule, MatIconModule,
    NgTemplateOutlet, UiBadgeComponent, UiMenuComponent, UiMenuTriggerDirective, UiTooltipDirective,
    TableViewModalComponent,
  ],
  templateUrl: './table.component.html',
  styles: `
    :host { display: block; }
    :host ::ng-deep {
      /* Header band — taller, crisp uppercase ERP grid header */
      .mat-mdc-header-row {
        min-height: 46px;
        background: var(--bg-secondary);
      }
      .mat-mdc-header-cell {
        padding: 0 14px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: var(--text-secondary);
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        white-space: nowrap;
      }
      .mat-mdc-header-cell.mat-sort-header-sorted { color: var(--indigo); }
      .mat-mdc-header-cell .mat-sort-header-arrow { color: var(--indigo); }
      /* Column separators in the HEADER only (AG-Grid look) — body stays clean */
      .mat-mdc-header-cell:not(:last-child) {
        border-right: 1px solid var(--border-color);
      }

      /* Body rows — comfortable height */
      .mat-mdc-row { min-height: 46px; transition: background 0.12s ease; }
      .mat-mdc-cell {
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
        vertical-align: middle;
        transition: background 0.12s ease, color 0.12s ease;
      }

      /* Row hover — subtle indigo wash */
      .mat-mdc-row:hover .mat-mdc-cell {
        background: var(--select-bg) !important;
        color: var(--indigo);
      }

      /* Sticky header with a soft shadow for depth */
      .mat-mdc-header-row {
        position: sticky;
        top: 0;
        z-index: 3;
        box-shadow: 0 2px 6px -3px rgba(0, 0, 0, 0.16);
      }

      /* Compact mode */
      .erp-compact .mat-mdc-header-cell { padding: 4px 10px; font-size: 11px; }
      .erp-compact .mat-mdc-cell { padding: 3px 10px; font-size: 12px; }
      .erp-compact .mat-mdc-row { height: 32px; }

      /* Paginator shell — background and outer container height.
         The form-field and row-height overrides live in styles.scss (global)
         because ::ng-deep cannot reliably beat global !important rules. */
      .mat-mdc-paginator {
        background: transparent !important;
        border: none;
      }
      .mat-mdc-paginator-outer-container {
        height: auto !important;
      }
      .mat-mdc-paginator-container {
        min-height: 40px !important;
        padding: 0 4px !important;
        flex-wrap: nowrap !important;
      }
      .mat-mdc-paginator-page-size-label {
        font-size: 11px;
        color: var(--text-secondary);
        margin-right: 4px;
      }
      .mat-mdc-paginator-page-size .mat-mdc-select {
        font-size: 12px;
        min-width: 50px;
      }
      .mat-mdc-paginator-range-label {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .mat-mdc-paginator-navigation-first,
      .mat-mdc-paginator-navigation-prev,
      .mat-mdc-paginator-navigation-next,
      .mat-mdc-paginator-navigation-last {
        color: var(--text-secondary);
        width: 30px;
        height: 30px;
      }
    }

    /* Active row — highlight every cell, left indicator bar on first cell only */
    .erp-row-active td {
      background: var(--select-bg) !important;
      color: var(--indigo);
    }
    .erp-row-active td:first-child {
      border-left: 3px solid var(--indigo) !important;
      padding-left: 9px !important;  /* 12px cell-padding − 3px border = same visual gap */
    }

    /* Footer row — same bg as header */
    .erp-footer-row .erp-footer-cell {
      padding: 6px 12px !important;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-primary);
      background: var(--bg-secondary) !important;
      border-top: 2px solid var(--border-color);
    }

    .sticky-bottom { position: sticky; bottom: 0; z-index: 2; }

    .erp-striped .mat-mdc-row:nth-child(even) .mat-mdc-cell {
      background: var(--bg-secondary);
    }

    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `,
})
export class CommonTableComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly columns = input<ColumnDef[]>([]);
  readonly data = input<Record<string, unknown>[]>([]);
  readonly config = input<Partial<TableConfig>>({});
  readonly loading = input(false);
  readonly searchTerm = model('');
  readonly totalCount = input(0);
  /** Unique ID for this table instance — used for localStorage column persistence */
  readonly tableId = input<string>('');

  readonly rowClick = output<Record<string, unknown>>();
  readonly rowAction = output<{ action: TableAction; row: Record<string, unknown> }>();
  readonly sortChange = output<SortState>();
  readonly pageChange = output<PageEvent>();
  readonly searchChange = output<string>();
  readonly selectionChange = output<Record<string, unknown>[]>();
  readonly cellEdit = output<{ value: unknown; row: Record<string, unknown>; column: ColumnDef }>();

  readonly sort = viewChild.required(MatSort);
  readonly paginator = viewChild(MatPaginator);

  private readonly exportService = inject(TableExportService);
  private readonly datePipe = new DatePipe('en-US');
  private readonly decimalPipe = new DecimalPipe('en-US');
  private readonly destroy$ = new Subject<void>();

  readonly dataSource = new MatTableDataSource<Record<string, unknown>>([]);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly selection = new SelectionModel<Record<string, unknown>>(true, []);
  readonly viewModalOpen = signal(false);
  readonly viewModalRow = signal<Record<string, unknown> | null>(null);
  readonly visibleColumns = signal<ColumnDef[]>([]);
  readonly showSkeleton = signal(false);
  readonly editingCell = signal<{ row: Record<string, unknown>; field: string } | null>(null);
  readonly editValue = signal<unknown>(null);

  readonly mergedConfig = computed<TableConfig>(() => ({ ...DEFAULT_TABLE_CONFIG, ...this.config() }));

  readonly displayFields = computed<string[]>(() => {
    const fields = this.visibleColumns().map((c) => c.field);
    if (this.mergedConfig().showRowNumbers) fields.unshift('__rowNumber');
    if (this.mergedConfig().selectable) fields.unshift('__select');
    if (this.mergedConfig().showActions) fields.push('__actions');
    return fields;
  });

  readonly hasFooterTotal = computed(() => this.visibleColumns().some((c) => c.bottomTotal));

  readonly footerTotals = computed<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    const filtered = this.dataSource.filteredData;
    this.visibleColumns().forEach((col) => {
      if (col.bottomTotal) {
        totals[col.field] = filtered.reduce((s, r) => { const v = Number(r[col.field]); return s + (isNaN(v) ? 0 : v); }, 0);
      }
    });
    return totals;
  });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((t) => { this.searchTerm.set(t); this.dataSource.filter = t.trim().toLowerCase(); this.searchChange.emit(t); });

    effect(() => { this.dataSource.data = this.data(); });

    // Initialize visible columns — restore from localStorage if tableId provided
    effect(() => {
      const cols = this.columns();
      if (!cols.length) return;
      const saved = this.tableId() ? this.loadColumnVisibility() : null;
      if (saved) {
        const map = new Set(saved);
        this.visibleColumns.set(cols.filter((c) => map.has(c.field)));
      } else {
        this.visibleColumns.set(cols.filter((c) => c.visible !== false));
      }
    });

    effect(() => { if (this.loading()) this.showSkeleton.set(true); else setTimeout(() => this.showSkeleton.set(false), 200); });

    // Reactively connect the paginator to the dataSource.
    // Using an effect (not ngAfterViewInit) because the paginator lives inside
    // @if(mergedConfig().pagination) — the viewChild signal updates when it
    // renders, which may happen after or during the first change-detection cycle.
    // A one-shot ngAfterViewInit call can race with the data effect and connect
    // to an empty dataSource, leaving the range label stuck at "0 of 0".
    effect(() => {
      const pg = this.paginator();
      if (pg && this.dataSource.paginator !== pg) {
        this.dataSource.paginator = pg;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort();
    // Search against the LOGICAL cell text (resolves select labels, custom-template `value`, etc.)
    this.dataSource.filterPredicate = (row, filter) =>
      this.visibleColumns().some((col) => this.cellSearchText(row, col).toLowerCase().includes(filter));
    // Sort by the same logical value so custom-template / select columns sort by label, not id.
    this.dataSource.sortingDataAccessor = (row, field) => {
      const col = this.columns().find((c) => c.field === field);
      const raw = col?.value ? col.value(row) : row[field];
      return typeof raw === 'number' ? raw : String(raw ?? '').toLowerCase();
    };
  }

  /** Human-readable text of a cell, used for search. Mirrors what the user actually sees. */
  private cellSearchText(row: Record<string, unknown>, col: ColumnDef): string {
    if (col.value) return String(col.value(row) ?? '');
    switch (col.cellType) {
      case 'select':
      case 'date':
      case 'datepipe':
      case 'number':
      case 'decimal':
      case 'currency':
        return this.formatCellValue(row, col);
      case 'badge': {
        const b = col.badgeConfig?.(row[col.field], row);
        return b?.label ?? String(row[col.field] ?? '');
      }
      case 'checkbox':
        return row[col.field] ? 'yes' : 'no';
      default: {
        const v = row[col.field];
        return v == null ? '' : String(v);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalCount'] && this.mergedConfig().serverSide) { const pg = this.paginator(); if (pg) pg.length = this.totalCount(); }
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ─── Column Toggle + Persistence ─────────────────────────────────────────
  isColumnVisible(col: ColumnDef): boolean { return this.visibleColumns().some((c) => c.field === col.field); }

  toggleColumn(col: ColumnDef): void {
    const cur = [...this.visibleColumns()];
    const idx = cur.findIndex((c) => c.field === col.field);
    if (idx >= 0) cur.splice(idx, 1);
    else { const ai = this.columns().findIndex((c) => c.field === col.field); cur.splice(ai, 0, col); }
    this.visibleColumns.set(cur);
  }

  /** Save current column visibility to localStorage */
  saveColumnVisibility(): void {
    const id = this.tableId();
    if (!id) return;
    const fields = this.visibleColumns().map((c) => c.field);
    localStorage.setItem(`erp-table-cols-${id}`, JSON.stringify(fields));
  }

  /** Load column visibility from localStorage */
  private loadColumnVisibility(): string[] | null {
    const id = this.tableId();
    if (!id) return null;
    try {
      const raw = localStorage.getItem(`erp-table-cols-${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  /** Reset column visibility to defaults */
  resetColumnVisibility(): void {
    const id = this.tableId();
    if (id) localStorage.removeItem(`erp-table-cols-${id}`);
    this.visibleColumns.set(this.columns().filter((c) => c.visible !== false));
  }

  // ─── Selection ──────────────────────────────────────────────────────────
  isAllSelected(): boolean { const n = this.selection.selected.length; return n === this.dataSource.filteredData.length && n > 0; }
  toggleAllRows(): void { this.isAllSelected() ? this.selection.clear() : this.selection.select(...this.dataSource.filteredData); this.emitSelection(); }
  toggleRow(row: Record<string, unknown>): void { this.selection.toggle(row); this.emitSelection(); }
  private emitSelection(): void { this.selectionChange.emit(this.selection.selected); }

  // ─── Row Actions ────────────────────────────────────────────────────────
  onViewRow(row: Record<string, unknown>): void { this.viewModalRow.set(row); this.viewModalOpen.set(true); }
  onAction(action: TableAction, row: Record<string, unknown>): void {
    if (action.type === 'view') { this.onViewRow(row); return; }
    if (action.onClick) action.onClick(row);
    this.rowAction.emit({ action, row });
  }
  onRowClick(row: Record<string, unknown>, event: MouseEvent): void {
    this.selection.clear();
    this.selection.select(row);
    this.emitSelection();
    this.rowClick.emit(row);
  }

  // ─── Inline Edit ────────────────────────────────────────────────────────
  startEdit(row: Record<string, unknown>, col: ColumnDef): void { if (!col.editable) return; this.editingCell.set({ row, field: col.field }); this.editValue.set(row[col.field]); }
  commitEdit(col: ColumnDef): void {
    const cell = this.editingCell(); if (!cell) return;
    cell.row[cell.field] = this.editValue();
    this.editingCell.set(null);
    if (col.onChange) col.onChange(this.editValue(), cell.row, col);
    this.cellEdit.emit({ value: this.editValue(), row: cell.row, column: col });
  }
  cancelEdit(): void { this.editingCell.set(null); this.editValue.set(null); }
  onEditInput(event: Event, col: ColumnDef): void {
    const t = event.target as HTMLInputElement | HTMLSelectElement;
    let v: unknown = t.value;
    if (['number', 'decimal', 'currency'].includes(col.cellType || '')) v = v === '' ? null : Number(v);
    this.editValue.set(v);
  }
  onEditCheckbox(event: Event): void { this.editValue.set((event.target as HTMLInputElement).checked); }
  isEditing(row: Record<string, unknown>, field: string): boolean { const c = this.editingCell(); return c !== null && c.row === row && c.field === field; }
  getSelectOptions(col: ColumnDef, row: Record<string, unknown>): SelectOption[] {
    if (!col.options) return []; return typeof col.options === 'function' ? col.options(row) : col.options;
  }

  // ─── Sort / Pagination ──────────────────────────────────────────────────
  onSortChange(event: MatSortEvent): void { this.sortChange.emit({ active: event.active, direction: event.direction as 'asc' | 'desc' | '' }); }
  onPageChange(event: { pageIndex: number; pageSize: number; length: number }): void { this.pageChange.emit(event); }

  // ─── Export ─────────────────────────────────────────────────────────────
  onExport(format: ExportFormat): void {
    const d = this.dataSource.filteredData, c = this.visibleColumns(), t = this.mergedConfig().title || 'Export';
    if (format === 'excel') this.exportService.exportToExcel(d, c, t);
    else if (format === 'pdf') this.exportService.exportToPdf(d, c, t, t);
    else if (format === 'csv') this.exportService.exportToCsv(d, c, t);
    else this.printDirect();
  }

  /** Print directly using window.print() — no new window */
  printDirect(): void {
    const cols = this.visibleColumns();
    const data = this.dataSource.filteredData;
    const title = this.mergedConfig().title || '';

    const headers = cols.map((c) =>
      `<th style="padding:6px 10px;background:var(--bg-secondary,#f7f8fc);font-weight:700;font-size:12px;color:var(--text-secondary,#6b7280);border-bottom:1px solid var(--border-color,#e2e8f0);text-align:left;white-space:nowrap">${c.title}</th>`
    ).join('');

    const rows = data.map((row) =>
      `<tr>${cols.map((col) => {
        let val: unknown = col.value ? col.value(row) : row[col.field];
        if (col.value) {
          // accessor already returned the display value
        } else if (col.cellType === 'select' && col.options) {
          const opts = typeof col.options === 'function' ? col.options(row) : col.options;
          const lk = col.labelKey || 'label', vk = col.valueKey || 'value';
          const o = opts.find((x) => (x as unknown as Record<string, unknown>)[vk] === val);
          val = o ? (o as unknown as Record<string, unknown>)[lk] : val;
        } else if (col.cellType === 'badge' && col.badgeConfig) {
          const b = col.badgeConfig(val, row); val = b ? b.label : val;
        } else if (col.cellType === 'checkbox') {
          val = val ? 'Yes' : 'No';
        }
        return `<td style="padding:5px 10px;font-size:13px;border-bottom:1px solid var(--border-color,#e2e8f0)">${val ?? ''}</td>`;
      }).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><title>${title}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:20px;color:#1a1f36}
        h3{margin:0 0 16px;font-size:16px}
        table{border-collapse:collapse;width:100%}
        tr:nth-child(even) td{background:#f7f8fc}
        @media print{body{padding:0}@page{margin:10mm}}
      </style></head>
      <body>${title ? `<h3>${title}</h3>` : ''}<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 300);
    }
  }

  // ─── Cell Helpers ───────────────────────────────────────────────────────
  getCellValue(row: Record<string, unknown>, col: ColumnDef): unknown { return row[col.field]; }

  formatCellValue(row: Record<string, unknown>, col: ColumnDef): string {
    // Explicit accessor wins (custom-template / computed columns) — used for display fallback & search.
    if (col.value && col.cellType !== 'select') {
      const v = col.value(row);
      return v == null ? '' : String(v);
    }
    const value = row[col.field]; if (value == null || value === '') return '';
    switch (col.cellType) {
      case 'select': { const opts = this.getSelectOptions(col, row); const f = opts.find((o) => String(o.value) === String(value)); return f ? f.label : String(value); }
      case 'date': case 'datepipe': return this.datePipe.transform(value as string | number | Date, col.dateFormat || 'mediumDate') || String(value);
      case 'number': case 'decimal': { const n = Number(value); if (isNaN(n)) return String(value); return this.decimalPipe.transform(n, `1.${col.precision ?? 2}-${col.precision ?? 2}`) || String(value); }
      case 'currency': { const n = Number(value); if (isNaN(n)) return String(value); const f = this.decimalPipe.transform(n, `1.${col.precision ?? 2}-${col.precision ?? 2}`); return `${col.currencyCode || ''} ${f}`.trim(); }
      default: return String(value);
    }
  }

  getBadgeConfig(row: Record<string, unknown>, col: ColumnDef): BadgeConfig | null { return col.badgeConfig ? col.badgeConfig(row[col.field], row) : null; }
  getButtonConfig(row: Record<string, unknown>, col: ColumnDef): CellButtonConfig | null { if (!col.buttonConfig) return null; return typeof col.buttonConfig === 'function' ? col.buttonConfig(row) : col.buttonConfig; }
  onCellButtonClick(row: Record<string, unknown>, col: ColumnDef, cfg: CellButtonConfig): void { if (cfg.onClick) cfg.onClick(row, col); }

  getAlignClass(col: ColumnDef): string { return col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'; }

  getPinStyle(col: ColumnDef): Record<string, string> {
    if (!col.pin) return {};
    const cols = this.columns(); let offset = 0;
    if (this.mergedConfig().selectable) offset += 40;
    if (this.mergedConfig().showRowNumbers) offset += 40;
    if (col.pin === 'left') { for (const c of cols) { if (c === col) break; if (c.pin === 'left') offset += parseInt(c.width || '150', 10); } return { left: `${offset}px`, 'z-index': '2' }; }
    if (col.pin === 'right') { let r = 0; for (const c of [...cols].reverse()) { if (c === col) break; if (c.pin === 'right') r += parseInt(c.width || '150', 10); } if (this.mergedConfig().showActions) r += 80; return { right: `${r}px`, 'z-index': '2' }; }
    return {};
  }

  isSticky(col: ColumnDef): boolean { return col.pin === 'left' || col.pin === 'right'; }

  getHeaderClass(col: ColumnDef): string {
    const c: string[] = []; if (this.isSticky(col)) c.push('sticky'); if (col.pin === 'left') c.push('shadow-[2px_0_4px_rgba(0,0,0,0.04)]'); if (col.pin === 'right') c.push('shadow-[-2px_0_4px_rgba(0,0,0,0.04)]'); if (col.headerClass) c.push(col.headerClass); return c.join(' ');
  }

  getCellClass(col: ColumnDef): string {
    const c: string[] = [this.getAlignClass(col)]; if (this.isSticky(col)) c.push('sticky'); if (col.pin === 'left') c.push('shadow-[2px_0_4px_rgba(0,0,0,0.04)]'); if (col.pin === 'right') c.push('shadow-[-2px_0_4px_rgba(0,0,0,0.04)]'); if (col.editable) c.push('cursor-text'); if (col.cellClass) c.push(col.cellClass); return c.join(' ');
  }

  getColumnByField(field: string): ColumnDef | undefined { return this.visibleColumns().find((c) => c.field === field); }
  getFooterLabel(): string { const c = this.visibleColumns().find((x) => !!x.footerLabel); return c?.footerLabel || 'Total'; }

  getFooterValue(col: ColumnDef): string {
    const t = this.footerTotals()[col.field]; if (t == null) return '';
    const f = this.decimalPipe.transform(t, `1.${col.precision ?? 2}-${col.precision ?? 2}`);
    return col.cellType === 'currency' ? `${col.currencyCode || ''} ${f}`.trim() : (f || '');
  }

  trackByField(_i: number, f: string): string { return f; }
  trackByRow(_i: number, r: Record<string, unknown>): unknown { return r['id'] ?? r; }
  trackByColumn(_i: number, c: ColumnDef): string { return c.field; }
  get skeletonRows(): number[] { return Array.from({ length: this.paginator()?.pageSize || 10 }, (_, i) => i); }
}

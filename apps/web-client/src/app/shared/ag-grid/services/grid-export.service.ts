import { Injectable, inject } from '@angular/core';
import type { GridApi } from 'ag-grid-community';

import type { ColumnDef } from '../../components/common-table/table.types';
import { TableExportService } from '../../components/common-table/table-export.service';
import type { GridColumn, GridRowData } from '../models/grid-types';
import { logicalValue } from '../utils/grid-value.utils';

/**
 * Export and print for one grid.
 *
 * Delegates the file writing to the app's existing {@link TableExportService} rather than
 * reimplementing xlsx/csv, which also means **no AG Grid Enterprise licence is needed** — its
 * Excel export is a paid feature, ours is not.
 *
 * Two rules the whole ERP depends on:
 *
 * 1. Exports contain what the user can *see* — the current filter and sort, resolved labels
 *    rather than raw ids. An export that dumps `status: 3` instead of `Approved` is not a
 *    report anyone can use.
 * 2. View-only columns (the `#` counter, action buttons) never appear in a file.
 *
 * Provided per grid instance.
 */
@Injectable()
export class GridExportService {
  private readonly exporter = inject(TableExportService);

  private api: GridApi | null = null;
  private columns: GridColumn[] = [];
  private fileName = 'export';
  private title = '';

  init(api: GridApi, columns: GridColumn[], fileName: string, title: string): void {
    this.api = api;
    this.columns = columns;
    this.fileName = fileName;
    this.title = title;
  }

  toExcel(): void {
    this.exporter.exportToExcel(this.rows(), this.exportColumns(), this.fileName);
  }

  toCsv(): void {
    this.exporter.exportToCsv(this.rows(), this.exportColumns(), this.fileName);
  }

  print(): void {
    this.exporter.printTable(this.rows(), this.exportColumns(), this.title);
  }

  /**
   * Rows in view order, after filter and sort, with every cell resolved to its logical value.
   *
   * Resolving here (rather than handing over raw rows) is what makes a dropdown column export as
   * its label. `forEachNodeAfterFilterAndSort` walks the *rendered* order, so the file matches
   * the screen row for row.
   */
  private rows(): Record<string, unknown>[] {
    if (!this.api) return [];

    const columns = this.exportColumns();
    const out: Record<string, unknown>[] = [];

    this.api.forEachNodeAfterFilterAndSort((node) => {
      const row = (node.data ?? {}) as GridRowData;
      const record: Record<string, unknown> = {};

      for (const column of columns) {
        const source = this.columns.find((c) => c.field === column.field);
        record[column.field] = source ? logicalValue(source, row) : row[column.field];
      }

      out.push(record);
    });

    return out;
  }

  /**
   * Exportable columns, in the user's current order, mapped to the shape the export service
   * expects. Hidden and opted-out columns are dropped.
   */
  private exportColumns(): ColumnDef[] {
    const order = this.api?.getColumnState() ?? [];

    const ordered = order
      .filter((state) => !state.hide)
      .map((state) => this.columns.find((c) => c.field === state.colId))
      .filter((c): c is GridColumn => !!c && !c.excludeFromExport);

    const source = ordered.length
      ? ordered
      : this.columns.filter((c) => !c.hidden && !c.excludeFromExport);

    return source.map((column) => ({
      field: column.field,
      title: column.title,
      // Values are already resolved in `rows()`, so the export service must take them as-is —
      // a second resolution pass here would re-map an already-resolved label.
      cellType: 'text',
      width: column.width ? `${column.width}` : undefined,
    })) as ColumnDef[];
  }
}

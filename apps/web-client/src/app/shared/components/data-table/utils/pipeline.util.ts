// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Data Pipeline Utility
// ═══════════════════════════════════════════════════════════════════

import {
  ColumnDef,
  RowData,
  SqlState,
  SortState,
  TableState,
} from '../types/data-table.types';

// ── Filter ───────────────────────────────────────────────────────────
export function applyGlobalFilter(
  rows: RowData[],
  query: string,
  columns: ColumnDef[],
): RowData[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter((r) =>
    columns.some((c) =>
      String(r[c.key] ?? '')
        .toLowerCase()
        .includes(q),
    ),
  );
}

export function applyColumnFilters(
  rows: RowData[],
  filters: Record<string, string>,
): RowData[] {
  return rows.filter((r) =>
    Object.entries(filters).every(
      ([key, val]) =>
        !val ||
        String(r[key] ?? '')
          .toLowerCase()
          .includes(val.toLowerCase()),
    ),
  );
}

// ── Sort ─────────────────────────────────────────────────────────────
export function applySort(rows: RowData[], sort: SortState): RowData[] {
  if (!sort.column || !sort.direction) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sort.column] ?? '';
    const bv = b[sort.column] ?? '';
    // Natural sort for strings, numeric sort for numbers
    if (typeof av === 'number' && typeof bv === 'number')
      return (av - bv) * dir;
    return (
      String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * dir
    );
  });
}

// ── Paginate ─────────────────────────────────────────────────────────
export function applyPagination<T>(
  rows: T[],
  page: number,
  pageSize: number,
): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

// ── Summary ───────────────────────────────────────────────────────────
export function computeSummary(
  rows: RowData[],
  columns: ColumnDef[],
): Record<string, string> {
  const summary: Record<string, string> = {};

  for (const col of columns) {
    const mode =
      col.summarize ??
      (col.type === 'number' || col.type === 'currency' ? 'sum' : false);
    if (!mode) continue;

    const nums = rows.map((r) => Number(r[col.key]) || 0);
    switch (mode) {
      case 'sum':
        summary[col.key] = nums.reduce((a, b) => a + b, 0).toFixed(2);
        break;
      case 'avg':
        summary[col.key] = nums.length
          ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
          : '—';
        break;
      case 'min':
        summary[col.key] = nums.length ? String(Math.min(...nums)) : '—';
        break;
      case 'max':
        summary[col.key] = nums.length ? String(Math.max(...nums)) : '—';
        break;
      case 'count':
        summary[col.key] = String(
          rows.filter(
            (r) =>
              r[col.key] !== null &&
              r[col.key] !== undefined &&
              r[col.key] !== '',
          ).length,
        );
        break;
    }
  }
  return summary;
}

// ── Full pipeline ─────────────────────────────────────────────────────
export function runPipeline(
  rawRows: RowData[],
  state: TableState,
  columns: ColumnDef[],
): { filtered: RowData[]; paged: RowData[]; summary: Record<string, string> } {
  // 1. Exclude deleted rows from display
  let rows = rawRows.filter((r) => r['sqlState'] !== SqlState.DELETE);

  // 2. Global filter
  rows = applyGlobalFilter(rows, state.globalFilter, columns);

  // 3. Column filters
  rows = applyColumnFilters(rows, state.columnFilters);

  // 4. Sort
  rows = applySort(rows, state.sort);

  // 5. Summary (before pagination)
  const summary = computeSummary(rows, columns);

  // 6. Paginate
  const paged = applyPagination(
    rows,
    state.pagination.page,
    state.pagination.pageSize,
  );

  return { filtered: rows, paged, summary };
}

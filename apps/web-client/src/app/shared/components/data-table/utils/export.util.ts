// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Export Utility
//  Fixes: PDF download now works; unified export interface
// ═══════════════════════════════════════════════════════════════════

import { ColumnDef, RowData } from '../types/data-table.types';

export interface ExportPayload {
  columns: ColumnDef[];
  rows: RowData[];
  filename?: string;
  title?: string;
}

// ── CSV ──────────────────────────────────────────────────────────────
export function exportCSV({
  columns,
  rows,
  filename = 'export',
}: ExportPayload): void {
  const headers = columns.map((c) => `"${c.header}"`).join(',');
  const body = rows.map((r) =>
    columns
      .map((c) => {
        const val = c.format ? c.format(r[c.key], r) : (r[c.key] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(','),
  );
  const csv = [headers, ...body].join('\r\n');
  downloadBlob(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    `${filename}.csv`,
  );
}

// ── XLSX ─────────────────────────────────────────────────────────────
export async function exportXLSX({
  columns,
  rows,
  filename = 'export',
  title,
}: ExportPayload): Promise<void> {
  const XLSX = await import('xlsx');
  const headerRow = columns.map((c) => c.header);
  const dataRows = rows.map((r) => columns.map((c) => r[c.key] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Auto column widths
  const colWidths = columns.map((c, ci) => ({
    wch:
      Math.max(
        c.header.length,
        ...rows.slice(0, 100).map((r) => String(r[c.key] ?? '').length),
      ) + 2,
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  if (title) wb.Props = { Title: title };
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── PDF ──────────────────────────────────────────────────────────────
// FIX: Uses dynamic import with proper await chain; autoTable is called
// as a method on the jsPDF instance after the plugin patches the prototype.
export async function exportPDF({
  columns,
  rows,
  filename = 'export',
  title,
}: ExportPayload): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title block
  if (title) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.setTextColor(0, 0, 0);
  }

  const startY = title ? 28 : 14;

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) =>
      columns.map((c) => (c.format ? c.format(r[c.key], r) : (r[c.key] ?? ''))),
    ),
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: {
      fillColor: [13, 110, 253],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1,
    margin: { left: 14, right: 14 },
    // Auto-size columns
    columnStyles: Object.fromEntries(
      columns.map((_, i) => [i, { cellWidth: 'auto' }]),
    ),
    didDrawPage: (data: any) => {
      // Page numbers
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' },
      );
    },
  });

  // FIX: Use doc.save() directly — not via URL.createObjectURL
  doc.save(`${filename}.pdf`);
}

// ── Helper ───────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

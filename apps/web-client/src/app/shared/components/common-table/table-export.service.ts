import { Injectable } from '@angular/core';
import { ColumnDef } from './table.types';

@Injectable({ providedIn: 'root' })
export class TableExportService {

  exportToExcel(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export'): void {
    import('xlsx').then((XLSX) => {
      const rows = data.map((row) => {
        const record: Record<string, unknown> = {};
        columns.forEach((col) => { record[col.title] = this.getDisplayValue(row, col); });
        return record;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = columns.map((col) => ({ wch: col.width ? parseInt(col.width, 10) || 15 : 15 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    });
  }

  exportToCsv(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export'): void {
    const headers = columns.map((c) => `"${c.title}"`).join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = this.getDisplayValue(row, col);
        return `"${val == null ? '' : String(val).replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv = [headers, ...rows].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${fileName}.csv`);
  }

  exportToPdf(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export', title?: string): void {
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([jsPDFModule, autoTableModule]) => {
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      if (title) { doc.setFontSize(16); doc.text(title, 14, 15); }
      const head = [columns.map((c) => c.title)];
      const body = data.map((row) => columns.map((col) => String(this.getDisplayValue(row, col) ?? '')));
      autoTable(doc, {
        head, body, startY: title ? 22 : 10,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      });
      doc.save(`${fileName}.pdf`);
    });
  }

  printTable(data: Record<string, unknown>[], columns: ColumnDef[], title?: string): void {
    const headers = columns.map((c) =>
      `<th style="padding:6px 10px;background:#f7f8fc;font-weight:700;font-size:12px;color:#6b7280;border-bottom:1px solid #e2e8f0;text-align:left">${c.title}</th>`
    ).join('');
    const rows = data.map((row) =>
      `<tr>${columns.map((col) =>
        `<td style="padding:5px 10px;font-size:13px;border-bottom:1px solid #e2e8f0">${this.getDisplayValue(row, col) ?? ''}</td>`
      ).join('')}</tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>${title || 'Export'}</title>
      <style>body{font-family:system-ui;padding:20px;color:#1a1f36}h3{margin:0 0 16px;font-size:16px}
      table{border-collapse:collapse;width:100%}tr:nth-child(even) td{background:#f7f8fc}
      @media print{body{padding:0}@page{margin:10mm}}</style></head>
      <body>${title ? `<h3>${title}</h3>` : ''}<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 300);
    }
  }

  private getDisplayValue(row: Record<string, unknown>, col: ColumnDef): unknown {
    // Explicit accessor wins (custom-template / computed columns).
    if (col.value) {
      const v = col.value(row);
      return v == null ? '' : v;
    }
    const value = row[col.field];
    if (value == null) return '';
    if (col.cellType === 'select' && col.options) {
      const options = typeof col.options === 'function' ? col.options(row) : col.options;
      const lk = col.labelKey || 'label', vk = col.valueKey || 'value';
      const opt = options.find((o) => (o as unknown as Record<string, unknown>)[vk] === value);
      return opt ? (opt as unknown as Record<string, unknown>)[lk] : value;
    }
    if (col.cellType === 'badge' && col.badgeConfig) { const b = col.badgeConfig(value, row); return b ? b.label : value; }
    if (col.cellType === 'checkbox') return value ? 'Yes' : 'No';
    return value;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  }
}

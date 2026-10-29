import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

export interface TableExportColumn<T = unknown> {
  key?: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  valueFn?: (item: T) => unknown;
  format?: 'currency' | 'date' | 'number' | 'text';
}

export interface TableExportOptions<T = unknown> {
  fileName: string;
  title: string;
  subtitle?: string;
  pharmacyName?: string;
  branchName?: string;
  columns: TableExportColumn<T>[];
  data: T[];
  isGrouped?: boolean;
  groupedRows?: {
    key: string;
    label: string;
    items: T[];
    summary?: string;
  }[];
  activeGroupByLabel?: string;
  summaryTotals?: { label: string; value: string | number }[];
}

@Injectable({
  providedIn: 'root',
})
export class TableExportService {
  /**
   * Exports tabular data to an Excel (.xlsx) file with professional formatting,
   * grouped rows, currency formatting, auto-adjusted column widths, and grand totals.
   */
  async exportToExcel<T = unknown>(options: TableExportOptions<T>): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aidly PMS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Report', {
      views: [{ state: 'frozen', ySplit: 4 }],
      properties: { defaultRowHeight: 20 },
    });

    const exportCols = options.columns.filter((c) => c.title !== 'Action');
    const colCount = Math.max(exportCols.length, 1);

    // Row 1: Title
    const titleRow = sheet.getRow(1);
    titleRow.height = 24;
    titleRow.getCell(1).value = options.title;
    titleRow.getCell(1).font = {
      name: 'Segoe UI',
      size: 14,
      bold: true,
      color: { argb: 'FF0F172A' }, // Slate-900
    };
    sheet.mergeCells(1, 1, 1, Math.max(colCount, 4));

    // Row 2: Subtitle / Metadata
    const subRow = sheet.getRow(2);
    subRow.height = 18;
    subRow.getCell(1).value =
      options.subtitle || `Generated on: ${new Date().toLocaleString('en-GB')}`;
    subRow.getCell(1).font = {
      name: 'Segoe UI',
      size: 9.5,
      italic: true,
      color: { argb: 'FF64748B' }, // Slate-500
    };
    sheet.mergeCells(2, 1, 2, Math.max(colCount, 4));

    // Row 3: Blank separator
    sheet.getRow(3).height = 6;

    // Row 4: Column Headers
    const headerRow = sheet.getRow(4);
    headerRow.height = 26;
    exportCols.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.title;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate-800
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal:
          col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      };
    });

    let currentLine = 5;

    const renderRowData = (item: T, isEven: boolean) => {
      const row = sheet.getRow(currentLine);
      row.height = 20;
      exportCols.forEach((col, idx) => {
        const cell = row.getCell(idx + 1);
        const val = this.extractValue(item, col);

        if (typeof val === 'number') {
          cell.value = val;
          cell.numFmt = '#,##0.00';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.value = val == null ? '' : String(val);
          cell.alignment = {
            vertical: 'middle',
            horizontal:
              col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
          };
        }

        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' },
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };
      });
      currentLine++;
    };

    if (options.isGrouped && options.groupedRows && options.groupedRows.length > 0) {
      for (const grp of options.groupedRows) {
        // Group Header Row
        const grpRow = sheet.getRow(currentLine);
        grpRow.height = 24;
        const groupLabel = `${options.activeGroupByLabel || 'Group'}: ${grp.label} (${grp.items.length} records)${grp.summary ? ' — ' + grp.summary : ''}`;
        grpRow.getCell(1).value = groupLabel;
        grpRow.getCell(1).font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FF0369A1' }, // sky-700
        };
        grpRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0F2FE' }, // sky-100
        };
        sheet.mergeCells(currentLine, 1, currentLine, colCount);
        grpRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        grpRow.getCell(1).border = {
          top: { style: 'thin', color: { argb: 'FFBAE6FD' } },
          bottom: { style: 'thin', color: { argb: 'FFBAE6FD' } },
        };
        currentLine++;

        // Group item rows
        grp.items.forEach((item, i) => renderRowData(item, i % 2 === 1));
      }
    } else {
      options.data.forEach((item, i) => renderRowData(item, i % 2 === 1));
    }

    // Summary Totals Row (if present)
    if (options.summaryTotals && options.summaryTotals.length > 0) {
      currentLine++; // blank line
      const totalRow = sheet.getRow(currentLine);
      totalRow.height = 24;
      const totalText = options.summaryTotals
        .map(
          (s) =>
            `${s.label}: ${typeof s.value === 'number' ? '৳ ' + s.value.toFixed(2) : s.value}`
        )
        .join('   |   ');
      totalRow.getCell(1).value = totalText;
      totalRow.getCell(1).font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      sheet.mergeCells(currentLine, 1, currentLine, colCount);
      totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'right' };
      totalRow.getCell(1).border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
      };
    }

    // Auto-adjust Column Widths
    exportCols.forEach((col, idx) => {
      const colObj = sheet.getColumn(idx + 1);
      let maxLen = col.title.length;
      options.data.slice(0, 100).forEach((item) => {
        const val = this.extractValue(item, col);
        if (val != null) {
          const str = typeof val === 'number' ? val.toFixed(2) : String(val);
          if (str.length > maxLen) maxLen = str.length;
        }
      });
      colObj.width = Math.max(maxLen + 4, 13);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    this.downloadBlob(blob, `${options.fileName}.xlsx`);
  }

  /**
   * Exports tabular data to a PDF report with professional styling,
   * grouped sections, currency formatting, page numbers, and grand totals.
   */
  async exportToPdf<T = unknown>(options: TableExportOptions<T>): Promise<void> {
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const jsPDF = jsPDFModule.default || (jsPDFModule as unknown as { jsPDF: typeof jsPDFModule.default }).jsPDF || jsPDFModule;
    const autoTable = autoTableModule.default || autoTableModule;

    const exportCols = options.columns.filter((c) => c.title !== 'Action');
    const orientation = exportCols.length > 5 ? 'landscape' : 'portrait';

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(options.title, 14, 14);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    const subtitleText =
      options.subtitle || `Generated on: ${new Date().toLocaleString('en-GB')}`;
    doc.text(subtitleText, 14, 19.5);

    // Column Headers
    const head = [exportCols.map((c) => c.title)];

    // Body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any[] = [];
    if (options.isGrouped && options.groupedRows && options.groupedRows.length > 0) {
      for (const grp of options.groupedRows) {
        body.push([
          {
            content: `${options.activeGroupByLabel || 'Group'}: ${grp.label} (${grp.items.length} records)${grp.summary ? ' — ' + grp.summary : ''}`,
            colSpan: exportCols.length,
            styles: {
              fillColor: [224, 242, 254], // sky-100
              textColor: [3, 105, 161], // sky-700
              fontStyle: 'bold',
              halign: 'left',
              fontSize: 8.5,
            },
          },
        ]);
        for (const item of grp.items) {
          body.push(exportCols.map((col) => this.getFormattedDisplayValue(item, col)));
        }
      }
    } else {
      for (const item of options.data) {
        body.push(exportCols.map((col) => this.getFormattedDisplayValue(item, col)));
      }
    }

    // Add Summary Row in Table if present
    if (options.summaryTotals && options.summaryTotals.length > 0) {
      const summaryText = options.summaryTotals
        .map(
          (s) =>
            `${s.label}: ${typeof s.value === 'number' ? '৳ ' + s.value.toFixed(2) : s.value}`
        )
        .join('   |   ');
      body.push([
        {
          content: summaryText,
          colSpan: exportCols.length,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            halign: 'right',
            fontSize: 8.5,
          },
        },
      ]);
    }

    // Column Styles Map for text alignment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columnStyles: Record<number, any> = {};
    exportCols.forEach((col, idx) => {
      columnStyles[idx] = {
        halign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
      };
    });

    autoTable(doc, {
      head,
      body,
      startY: 23,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [226, 232, 240], // Slate-200
        lineWidth: 0.1,
        textColor: [51, 65, 85],
      },
      columnStyles,
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate-50
      },
      margin: { top: 23, right: 14, bottom: 14, left: 14 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didDrawPage: (data: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        );
      },
    });

    doc.save(`${options.fileName}.pdf`);
  }

  private extractValue<T>(item: T, col: TableExportColumn<T>): unknown {
    if (col.valueFn) return col.valueFn(item);
    if (!col.key || !item) return '';
    return (item as Record<string, unknown>)[col.key];
  }

  private getFormattedDisplayValue<T>(item: T, col: TableExportColumn<T>): string {
    const val = this.extractValue(item, col);
    if (val == null) return '';
    if (typeof val === 'number') {
      return `৳ ${val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return String(val);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

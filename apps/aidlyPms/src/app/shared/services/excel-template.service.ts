import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';

export interface TemplateColumnDef {
  key: string;
  header: string;
  required?: boolean;
  width?: number;
  sample?: string | number | boolean;
  dropdownOptions?: string[];
  lookupKey?: string; // key in lookups object
  description?: string;
}

export interface TemplateConfig {
  fileName: string;
  sheetName?: string;
  columns: TemplateColumnDef[];
  sampleData?: Record<string, any>[];
  lookups?: Record<string, string[]>;
}

@Injectable({
  providedIn: 'root',
})
export class ExcelTemplateService {
  /**
   * Generates a stylized Excel template workbook with column headers,
   * realistic sample data, and native Excel data validation dropdown menus.
   */
  async generateAndDownloadTemplate(config: TemplateConfig): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aidly PMS';
    workbook.lastModifiedBy = 'Aidly PMS';
    workbook.created = new Date();
    workbook.modified = new Date();

    const mainSheetName = config.sheetName || 'Catalog_Data';
    const worksheet = workbook.addWorksheet(mainSheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
      properties: { defaultRowHeight: 22 },
    });

    // 1. Setup Lookup Reference Sheet if lookups are present
    const lookupMap = new Map<string, { colLetter: string; length: number }>();
    if (config.lookups && Object.keys(config.lookups).length > 0) {
      const lookupSheet = workbook.addWorksheet('LookupData', {
        state: 'veryHidden', // Hidden from regular user view
      });

      let colIdx = 1;
      for (const [lookupKey, options] of Object.entries(config.lookups)) {
        if (options && options.length > 0) {
          const colLetter = this.getColumnLetter(colIdx);
          // Header in lookup sheet
          lookupSheet.getCell(1, colIdx).value = lookupKey;
          lookupSheet.getCell(1, colIdx).font = { bold: true };

          // Values
          options.forEach((opt, rIdx) => {
            lookupSheet.getCell(rIdx + 2, colIdx).value = opt;
          });

          lookupMap.set(lookupKey, {
            colLetter,
            length: options.length,
          });
          colIdx++;
        }
      }
    }

    // 2. Set Columns and Headers
    worksheet.columns = config.columns.map((col) => ({
      header: col.required ? `${col.header} *` : col.header,
      key: col.key,
      width: col.width || Math.max(col.header.length + 5, 18),
    }));

    // Style the Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell, colNumber) => {
      const colDef = config.columns[colNumber - 1];
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate-800
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };

      if (colDef?.description) {
        cell.note = colDef.description;
      }
    });

    // 3. Add Sample Row(s)
    if (config.sampleData && config.sampleData.length > 0) {
      config.sampleData.forEach((sampleItem) => {
        const rowData = config.columns.map((col) => sampleItem[col.key] ?? '');
        const sampleRow = worksheet.addRow(rowData);
        sampleRow.height = 22;
        sampleRow.eachCell((cell) => {
          cell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }, // Slate-50
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          cell.alignment = { vertical: 'middle' };
        });
      });
    } else {
      // Build sample from column defs
      const sampleRowData = config.columns.map((col) => col.sample ?? '');
      const sampleRow = worksheet.addRow(sampleRowData);
      sampleRow.height = 22;
      sampleRow.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF475569' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };
      });
    }

    // 4. Inject Native Excel Data Validation Dropdowns (Rows 2 to 500)
    const maxValidationRows = 500;
    config.columns.forEach((col, colIdx) => {
      const colLetter = this.getColumnLetter(colIdx + 1);

      let validationFormula: string | null = null;

      // Check if referencing lookup sheet
      if (col.lookupKey && lookupMap.has(col.lookupKey)) {
        const lookupInfo = lookupMap.get(col.lookupKey)!;
        validationFormula = `LookupData!$${lookupInfo.colLetter}$2:$${lookupInfo.colLetter}$${lookupInfo.length + 1}`;
      } else if (col.dropdownOptions && col.dropdownOptions.length > 0) {
        // If inline options fit within 255 chars
        const joined = col.dropdownOptions.join(',');
        if (joined.length < 240) {
          validationFormula = `"${joined}"`;
        }
      }

      if (validationFormula) {
        for (let r = 2; r <= maxValidationRows; r++) {
          const cell = worksheet.getCell(`${colLetter}${r}`);
          cell.dataValidation = {
            type: 'list',
            allowBlank: !col.required,
            formulae: [validationFormula],
            showErrorMessage: true,
            errorTitle: 'Invalid Selection',
            error: `Please select a valid option from the dropdown or type a valid entry for ${col.header}.`,
          };
        }
      }
    });

    // 5. Write to buffer and trigger browser download
    const buffer = await workbook.xlsx.writeBuffer();
    this.downloadBlob(
      buffer,
      config.fileName.endsWith('.xlsx') ? config.fileName : `${config.fileName}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  }

  /**
   * Parses an uploaded .xlsx or .xls file into a JSON array of row records.
   */
  async parseExcelFile(file: File, columnKeysMap?: Record<string, string>): Promise<any[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('The uploaded Excel file contains no worksheets.');
    }

    const rows: any[] = [];
    const headers: string[] = [];

    // Row 1 contains headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      let rawHeader = (cell.value ? cell.value.toString() : '').trim();
      // Remove trailing required asterisk
      rawHeader = rawHeader.replace(/\s*\*$/, '').trim();
      headers[colNumber] = rawHeader;
    });

    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowObj: Record<string, any> = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const headerName = headers[colNumber];
        if (headerName) {
          let cellValue = cell.value;
          // Extract text from rich text if applicable
          if (cellValue && typeof cellValue === 'object') {
            if ('richText' in cellValue && Array.isArray((cellValue as any).richText)) {
              cellValue = (cellValue as any).richText.map((t: any) => t.text).join('');
            } else if ('text' in cellValue) {
              cellValue = (cellValue as any).text;
            } else if ('result' in cellValue) {
              cellValue = (cellValue as any).result;
            }
          }

          if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
            hasData = true;
          }

          // Map by key if map is provided, otherwise by sanitized header name
          const mappedKey = columnKeysMap && columnKeysMap[headerName] 
            ? columnKeysMap[headerName] 
            : this.sanitizeKey(headerName);

          rowObj[mappedKey] = cellValue;
        }
      });

      if (hasData) {
        rows.push(rowObj);
      }
    });

    return rows;
  }

  private downloadBlob(data: ArrayBuffer, fileName: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
  }

  private getColumnLetter(colIndex: number): string {
    let temp = colIndex;
    let letter = '';
    while (temp > 0) {
      const mod = (temp - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      temp = Math.floor((temp - mod) / 26);
    }
    return letter;
  }

  private sanitizeKey(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

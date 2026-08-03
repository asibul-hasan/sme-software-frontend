import { Injectable } from '@angular/core';
import { GridApi } from 'ag-grid-community';

@Injectable({ providedIn: 'root' })
export class GridExportService {
  exportToCsv(api: GridApi, fileName = 'grid-export.csv'): void {
    if (!api) return;
    api.exportDataAsCsv({
      fileName,
    });
  }

  exportToExcel(api: GridApi, fileName = 'grid-export.xlsx'): void {
    if (!api) return;
    api.exportDataAsCsv({
      fileName,
    });
  }
}

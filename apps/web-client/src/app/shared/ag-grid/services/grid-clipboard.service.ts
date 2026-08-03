import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GridClipboardService {
  /**
   * Parses TSV clipboard text (from Excel) into 2D array of rows and columns.
   */
  parseClipboardTsv(text: string): string[][] {
    if (!text) return [];
    const lines = text.split(/\r\n|\n|\r/);
    return lines
      .filter((line) => line.length > 0)
      .map((line) => line.split('\t').map((cell) => cell.trim()));
  }
}

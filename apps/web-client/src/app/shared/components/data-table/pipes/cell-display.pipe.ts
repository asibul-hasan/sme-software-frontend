// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Cell Display Pipe
// ═══════════════════════════════════════════════════════════════════

import { Pipe, PipeTransform } from '@angular/core';
import { ColumnDef, RowData } from '../types/data-table.types';
import { DEFAULT_CURRENCY_CODE } from '../constants/data-table.constants';

@Pipe({ name: 'cellDisplay', standalone: true, pure: true })
export class CellDisplayPipe implements PipeTransform {
  transform(row: RowData, col: ColumnDef): string {
    const raw = row[col.key];

    // Custom formatter wins
    if (col.format) return col.format(raw, row);

    // Null / undefined → em-dash
    if (raw === null || raw === undefined || raw === '') return '—';

    switch (col.type) {
      case 'currency': {
        const num = Number(raw);
        if (isNaN(num)) return '—';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: col.currencyCode || DEFAULT_CURRENCY_CODE,
          minimumFractionDigits: 2,
        }).format(num);
      }

      case 'percentage':
        return `${Number(raw).toFixed(1)}%`;

      case 'number': {
        const num = Number(raw);
        if (isNaN(num)) return '—';
        const formatted = new Intl.NumberFormat('en-US').format(num);
        return `${col.prefix ?? ''}${formatted}${col.suffix ?? ''}`;
      }

      case 'date': {
        const d = new Date(raw);
        if (isNaN(d.getTime())) return String(raw);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
      }

      case 'boolean':
        return raw ? 'Yes' : 'No';

      case 'select':
        return col.options?.find((o) => o.value === raw)?.label ?? String(raw);

      case 'link': {
        if (typeof raw === 'object' && raw.label) return raw.label;
        return String(raw);
      }

      case 'avatar': {
        if (typeof raw === 'object' && raw.name) return raw.name;
        return String(raw);
      }

      default:
        return `${col.prefix ?? ''}${String(raw)}${col.suffix ?? ''}`;
    }
  }
}

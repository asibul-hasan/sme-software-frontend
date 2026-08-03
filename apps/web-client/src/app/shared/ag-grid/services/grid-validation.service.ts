import { Injectable } from '@angular/core';
import { GridColumnConfig } from '../models/grid-config.model';

@Injectable({ providedIn: 'root' })
export class GridValidationService {
  validateCell<T = any>(value: any, row: T, column: GridColumnConfig<T>): string | null {
    const rules = column.validation;
    if (!rules) return null;

    if (rules.required && (value == null || String(value).trim() === '')) {
      return `${column.headerName} is required`;
    }

    if (rules.min != null && Number(value) < rules.min) {
      return `${column.headerName} must be at least ${rules.min}`;
    }

    if (rules.max != null && Number(value) > rules.max) {
      return `${column.headerName} must not exceed ${rules.max}`;
    }

    if (rules.pattern && !rules.pattern.test(String(value))) {
      return `${column.headerName} format is invalid`;
    }

    return null;
  }
}

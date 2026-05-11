import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';

/**
 * Formats a date value as date-only using the configured date format.
 *
 * Default format (from AppSettingsService): dd/MM/yyyy
 *
 * Usage:
 *   {{ employee.joining_date | dateOnly }}
 *   {{ '2024-01-15' | dateOnly }}
 */
@Pipe({ name: 'dateOnly', standalone: true })
export class DateOnlyPipe implements PipeTransform {
  private readonly datePipe = new DatePipe('en-US');
  private readonly settings = inject(AppSettingsService);

  transform(value: Date | string | number | null | undefined): string | null {
    if (value == null || value === '') return null;
    return this.datePipe.transform(value, this.settings.current().dateFormat);
  }
}

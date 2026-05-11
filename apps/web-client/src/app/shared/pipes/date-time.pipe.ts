import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';

/**
 * Formats a date value as date + time including seconds.
 *
 * Format: <dateFormat> HH:mm:ss   e.g. 15/01/2024 14:35:09
 *
 * Usage:
 *   {{ record.created_at | dateTime }}
 */
@Pipe({ name: 'dateTime', standalone: true })
export class DateTimePipe implements PipeTransform {
  private readonly datePipe = new DatePipe('en-US');
  private readonly settings = inject(AppSettingsService);

  transform(value: Date | string | number | null | undefined): string | null {
    if (value == null || value === '') return null;
    const fmt = `${this.settings.current().dateFormat} HH:mm:ss`;
    return this.datePipe.transform(value, fmt);
  }
}

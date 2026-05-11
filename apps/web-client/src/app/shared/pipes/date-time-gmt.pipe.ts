import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';

/**
 * Formats a date value as date + time including seconds + GMT offset label.
 *
 * Format: <dateFormat> HH:mm:ss z   e.g. 15/01/2024 14:35:09 GMT+6
 * Timezone is taken from AppSettingsService.current().timezone (IANA zone).
 *
 * Usage:
 *   {{ record.created_at | dateTimeGmt }}
 */
@Pipe({ name: 'dateTimeGmt', standalone: true })
export class DateTimeGmtPipe implements PipeTransform {
  private readonly datePipe = new DatePipe('en-US');
  private readonly settings = inject(AppSettingsService);

  transform(value: Date | string | number | null | undefined): string | null {
    if (value == null || value === '') return null;
    const { dateFormat, timezone } = this.settings.current();
    return this.datePipe.transform(value, `${dateFormat} HH:mm:ss z`, timezone);
  }
}

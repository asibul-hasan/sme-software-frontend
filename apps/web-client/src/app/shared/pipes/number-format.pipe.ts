import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { formatNumber } from '../../core/utils/format-number';

/**
 * Formats a numeric value using the configured number style and precision.
 *
 * Number styles (from AppSettingsService):
 *   international  →  1,234,567.89   (en-US grouping)
 *   indian         →  12,34,567.89   (en-IN grouping: lakh / crore)
 *
 * @param value      The number to format.
 * @param precision  Override decimal places; defaults to AppSettingsService.precision.
 *
 * Usage:
 *   {{ employee.basic_salary | numberFormat }}
 *   {{ invoice.amount | numberFormat : 0 }}   ← zero decimals
 */
@Pipe({ name: 'numberFormat', standalone: true })
export class NumberFormatPipe implements PipeTransform {
  private readonly settings = inject(AppSettingsService);

  transform(
    value:     number | string | null | undefined,
    precision?: number,
  ): string {
    return formatNumber(value, this.settings.current(), precision);
  }
}

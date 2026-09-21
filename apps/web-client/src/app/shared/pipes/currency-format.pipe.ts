import { Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { CurrencySettingsService } from '../../core/services/currency-settings.service';
import { formatNumber } from '../../core/utils/format-number';

/**
 * Formats an amount with the active company's currency symbol, grouping format, and decimal places.
 * E.g., `৳ 1,234.56` or `৳ 12,34,567.89` depending on bootstrap base_currency_settings.
 *
 * Usage:
 *   {{ total | currencyFormat }}
 *   {{ total | currencyFormat: false }} (without symbol)
 */
@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  private readonly appSettings = inject(AppSettingsService);
  private readonly currencySettings = inject(CurrencySettingsService);

  transform(
    value: number | string | null | undefined,
    showSymbol = true,
    precision?: number,
  ): string {
    if (value == null || value === '') return '';
    const formatted = formatNumber(value, this.appSettings.current(), precision);
    if (!showSymbol) return formatted;
    const symbol = this.currencySettings.baseCurrency()?.currency_symbol || '';
    return symbol ? `${symbol} ${formatted}` : formatted;
  }
}
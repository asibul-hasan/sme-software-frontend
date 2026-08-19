import { AppGlobals } from '../app-globals';
import type { IAppSettings } from '../services/app-settings.service';

/**
 * The one place a number is turned into text for display.
 *
 * Precision and grouping come from the active currency loaded at bootstrap
 * (`base_currency_settings.decimal_places` / `number_format`), never from a
 * literal. International groups as 1,234,567.89; Indian as 12,34,567.89.
 *
 * @param precision Override decimal places. Leave unset for money, so it follows
 *                  the company setting; pass a value only when the figure has its
 *                  own scale (a percentage, a six-place rate, a whole-unit count).
 */
export function formatNumber(
  value: number | string | null | undefined,
  settings: IAppSettings,
  precision?: number,
): string {
  if (value == null || value === '') return '';

  const num = Number(value);
  if (isNaN(num)) return String(value);

  const decimals = precision ?? settings.precision;
  const locale = settings.numberStyle === 'indian' ? 'en-IN' : 'en-US';

  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Same formatting for code that cannot inject — PDF report templates are plain
 * functions, so they read the settings off `AppGlobals` instead of the signal.
 *
 * Inside a component or template prefer the `appDecimal` pipe: it reads the
 * signal, so the view re-renders when the active currency changes. This helper
 * reads a snapshot and does not.
 */
export function formatDecimal(
  value: number | string | null | undefined,
  precision?: number,
): string {
  return formatNumber(value, AppGlobals.settings, precision);
}

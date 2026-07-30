import dayjs from 'dayjs';

/**
 * Display formatting. Kept apart from value resolution: what a cell *is* (searchable, sortable)
 * and how it *reads* are different questions, and mixing them is why exports end up full of
 * formatted strings that no longer sort.
 */

export const GRID_DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
export const GRID_DEFAULT_DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';

export type NumberStyle = 'international' | 'indian';

/**
 * Formats a number at a fixed precision.
 *
 * Precision and grouping style come from the app's settings, never from a literal in a form —
 * currencies differ in decimal places, and Indian grouping (1,00,000) is not a rounding of the
 * international one.
 */
export function formatNumber(value: unknown, precision: number, style: NumberStyle): string {
  if (value == null || value === '') return '';

  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  return num.toLocaleString(style === 'indian' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export function formatDate(value: unknown, format: string): string {
  if (value == null || value === '') return '';
  const parsed = dayjs(value as string);
  return parsed.isValid() ? parsed.format(format) : String(value);
}

/**
 * Translates Angular `DatePipe` tokens to dayjs ones.
 *
 * Column definitions are written by people used to `dd/MM/yyyy`; silently rendering that as
 * literal text would be a poor trade for strictness.
 */
export function toDayjsFormat(format: string | undefined, fallback: string): string {
  if (!format) return fallback;

  return format
    .replace(/dd/g, 'DD')
    .replace(/\by\b/g, 'YYYY')
    .replace(/yyyy/g, 'YYYY')
    .replace(/yy/g, 'YY');
}

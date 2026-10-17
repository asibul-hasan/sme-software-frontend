/**
 * Date Range Helper Utility for Aidly PMS
 * Standardized DD-MM-YYYY date handling and range calculation.
 */

export function parseDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = val.trim();
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day);
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateToDdMmYyyy(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') {
    // If already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
    // If in DD/MM/YYYY format, normalize to DD-MM-YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d.replace(/\//g, '-');
    const parsed = parseDate(d);
    if (!parsed) return d;
    d = parsed;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getDefaultMonthDates(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export function getTodayDates(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  return { from, to };
}

export function getDefaultMonthDateRange(): { fromDate: string; toDate: string } {
  const { from, to } = getDefaultMonthDates();
  return {
    fromDate: formatDateToDdMmYyyy(from),
    toDate: formatDateToDdMmYyyy(to),
  };
}

export function getTodayDateRange(): { fromDate: string; toDate: string } {
  const { from, to } = getTodayDates();
  return {
    fromDate: formatDateToDdMmYyyy(from),
    toDate: formatDateToDdMmYyyy(to),
  };
}

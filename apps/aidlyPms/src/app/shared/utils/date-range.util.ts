/**
 * Date Range Helper Utility for Aidly PMS
 * Standardized default 1-month date range calculation.
 */

export function getDefaultMonthDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    fromDate: formatDate(from),
    toDate: formatDate(to),
  };
}

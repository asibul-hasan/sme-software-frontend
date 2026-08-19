import { ColumnDef } from '../../../shared/components/common-table';
import {
  PdfSummaryRow, PdfTemplateSection, PdfReportContext,
} from '../../../shared/pdf-templates';
import { formatDecimal } from '../../../core/utils/format-number';

// ─── Context Shape ──────────────────────────────────────────────────────────────
export interface TrialBalanceReportContext {
  asOfDate: string;
  branchName?: string;
  currencyCode?: string;
  rows: TrialBalanceRow[];
}

export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_group: string;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

// ─── Columns ────────────────────────────────────────────────────────────────────
const trialBalanceColumns: ColumnDef[] = [
  { title: 'Code', field: 'account_code', width: '90px', cellType: 'text', pin: 'left' },
  { title: 'Account Name', field: 'account_name', width: '180px', cellType: 'text' },
  { title: 'Group', field: 'account_group', width: '120px', cellType: 'text' },
  { title: 'Opening Dr', field: 'opening_debit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'Opening Cr', field: 'opening_credit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'Period Dr', field: 'period_debit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'Period Cr', field: 'period_credit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'Closing Dr', field: 'closing_debit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'Closing Cr', field: 'closing_credit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
];

// ─── Helper: Totals ─────────────────────────────────────────────────────────────
function buildTotals(context: TrialBalanceReportContext): PdfSummaryRow[] {
  const r = context.rows;
  const sum = (f: keyof TrialBalanceRow) => r.reduce((acc, row) => acc + (Number(row[f]) || 0), 0);
  return [
    { label: 'Total Opening Dr', value: formatDecimal(sum('opening_debit')) },
    { label: 'Total Opening Cr', value: formatDecimal(sum('opening_credit')) },
    { label: 'Total Period Dr', value: formatDecimal(sum('period_debit')) },
    { label: 'Total Period Cr', value: formatDecimal(sum('period_credit')) },
    { label: 'Total Closing Dr', value: formatDecimal(sum('closing_debit')) },
    { label: 'Total Closing Cr', value: formatDecimal(sum('closing_credit')) },
  ];
}

// ─── Template Context Builder ───────────────────────────────────────────────────
export function buildTrialBalanceReportContext(context: TrialBalanceReportContext): PdfReportContext {
  const parts = [
    `As of: ${context.asOfDate}`,
    context.branchName ? `Branch: ${context.branchName}` : '',
    context.currencyCode ? `Currency: ${context.currencyCode}` : '',
  ].filter(Boolean);
  const subTitle = parts.join('   |   ');

  const sections: PdfTemplateSection[] = [];

  if (context.rows.length === 0) {
    sections.push({ type: 'text', text: 'No records found for the selected criteria.', align: 'center' });
  } else {
    sections.push({
      type: 'table',
      title: 'Account Balances',
      columns: trialBalanceColumns,
      rows: context.rows as unknown as Record<string, unknown>[],
      showRowNumbers: false,
    });

    sections.push(
      { type: 'spacer', height: 4 },
      { type: 'separator' },
      { type: 'spacer', height: 2 },
      {
        type: 'summary',
        title: 'Totals',
        columnsPerRow: 3,
        rows: buildTotals(context),
      },
    );
  }

  return {
    module: 'FIN',
    formId: 'FIN_1301',
    title: 'Trial Balance',
    fileName: 'trial-balance',
    orientation: 'landscape',
    showSignatures: true,
    showPageFooter: true,
    subTitle,
    sections,
  };
}

import { ColumnDef } from '../../../../shared/components/common-table';
import {
  PdfSummaryRow,
  PdfTemplateSection,
  PdfReportContext,
} from '../../../../shared/pdf-templates';

// ─── Context Shape ──────────────────────────────────────────────────────────────
export interface VoucherReportContext {
  voucher_no: string;
  voucher_date: string;
  voucher_type_name: string;
  voucher_narration?: string;
  currency_name: string;
  company_name: string;
  company_registration?: string;
  ref_no?: string;
  total_amount?: number;
  rows: VoucherLineRow[];
}

export interface VoucherLineRow {
  gl_code: string;
  gl_name: string;
  description?: string;
  debit: number;
  credit: number;
}

// ─── Columns ────────────────────────────────────────────────────────────────────
const voucherColumns: ColumnDef[] = [
  { title: 'G/L CODE', field: 'gl_code', width: '100px', cellType: 'text' },
  { title: 'G/L NAME', field: 'gl_name', width: '200px', cellType: 'text' },
  { title: 'DESCRIPTION', field: 'description', width: '200px', cellType: 'text' },
  { title: 'DEBIT', field: 'debit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
  { title: 'CREDIT', field: 'credit', width: '100px', cellType: 'currency', align: 'right', precision: 2 },
];

// ─── Helper: Summary Rows ───────────────────────────────────────────────────────
function buildVoucherInfoRows(context: VoucherReportContext): PdfSummaryRow[] {
  return [
    { label: 'Voucher No', value: context.voucher_no },
    { label: 'Date', value: context.voucher_date },
    { label: 'Voucher Type', value: context.voucher_type_name },
    { label: 'Currency', value: context.currency_name },
    { label: 'Ref No', value: context.ref_no || 'N/A' },
    { label: 'Narration', value: context.voucher_narration || 'N/A' },
  ];
}

// ─── Template Context Builder ───────────────────────────────────────────────────
export function buildVoucherReportContext(context: VoucherReportContext): PdfReportContext {
  const sections: PdfTemplateSection[] = [];

  // ── 2. Company Name (left) + Voucher No / Date (right) ──────────────────
  //    Drawn as a custom section to match the reference image layout.
  sections.push({
    type: 'custom',
    draw: (doc: any, startY: number, pageWidth: number, marginX: number) => {
      // Left: Company name with registration
      const companyLabel = context.company_registration
        ? `${context.company_name} (${context.company_registration})`
        : context.company_name;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(companyLabel, marginX, startY);

      // Right: NO, DATE, CURRENCY
      const rightX = pageWidth - marginX;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      doc.text(`NO    : ${context.voucher_no}`, rightX, startY, { align: 'right' });
      doc.text(`DATE  : ${context.voucher_date}`, rightX, startY + 5, { align: 'right' });
      doc.text(`CURR  : ${context.currency_name}`, rightX, startY + 10, { align: 'right' });

      return startY + 16;
    },
  });

  sections.push({ type: 'separator', thickness: 0.5 });
  sections.push({ type: 'spacer', height: 3 });

  // ── 3. GL Lines Table ────────────────────────────────────────────────────
  if (context.rows.length === 0) {
    sections.push({ type: 'text', text: 'No GL lines found for this voucher.', align: 'center' });
  } else {
    sections.push({
      type: 'table',
      columns: voucherColumns,
      rows: context.rows as unknown as Record<string, unknown>[],
      showRowNumbers: false,
    });
  }

  // ── 4. Total Amount Footer ───────────────────────────────────────────────
  //    Matches the image: two horizontal lines with total in between.
  const totalDebit = context.rows.reduce((sum, r) => sum + (r.debit || 0), 0);
  const totalCredit = context.rows.reduce((sum, r) => sum + (r.credit || 0), 0);
  const totalAmount = context.total_amount ?? (totalDebit || totalCredit);

  sections.push({
    type: 'custom',
    draw: (doc: any, startY: number, pageWidth: number, marginX: number) => {
      // First separator line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(marginX, startY, pageWidth - marginX, startY);

      const y2 = startY + 6;

      // Total label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Total amount of this voucher :', pageWidth - marginX - 70, y2, { align: 'right' });

      // Total amount (right aligned)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(totalAmount.toFixed(2), pageWidth - marginX, y2, { align: 'right' });

      // Second separator line
      const y3 = startY + 9;
      doc.line(marginX, y3, pageWidth - marginX, y3);

      return y3 + 4;
    },
  });

  // ── 5. Spacer before signatures ────────────────────────────────────────
  sections.push({ type: 'spacer', height: 12 });

  // ── 6. Signature Block ───────────────────────────────────────────────────
  //    Matches the image: left text + right "APPROVED BY" with line.
  sections.push({
    type: 'custom',
    draw: (doc: any, startY: number, pageWidth: number, marginX: number) => {
      // Left: prepared by text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const typeLabel = context.voucher_type_name.toLowerCase();
      doc.text(
        `This ${typeLabel} voucher was prepared by Aidly ERP`,
        marginX,
        startY,
      );

      // Right: APPROVED BY with underline
      const approvedLabel = 'APPROVED BY';
      const labelWidth = doc.getTextWidth(approvedLabel);
      const startX = pageWidth - marginX - labelWidth - 60;

      doc.setTextColor(71, 85, 105);
      doc.text(approvedLabel, startX, startY);

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.line(startX + labelWidth + 2, startY + 1, pageWidth - marginX, startY + 1);

      return startY + 8;
    },
  });

  return {
    module: 'FIN',
    formId: 'FIN_1101',
    title: 'Voucher',
    fileName: 'voucher',
    orientation: 'portrait',
    showSignatures: false, // We draw a custom signature block matching the image
    showPageFooter: true,
    subTitle: `${context.voucher_type_name} Voucher   |   NO: ${context.voucher_no}`,
    sections,
  };
}

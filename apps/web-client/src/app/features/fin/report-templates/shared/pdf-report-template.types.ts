import { ColumnDef } from '../../../../shared/components/common-table';
import {
  PdfTemplate,
  PdfModuleCode,
  PdfPageOrientation,
  PdfPageSize,
  PdfTemplateSection,
} from '../../../../shared/pdf-templates';

// ─── Re-export shared types for convenience ────────────────────────────────────
export type { PdfTemplate };

export interface PdfReportContext {
  module: PdfModuleCode;
  formId: string;
  title: string;
  fileName: string;
  orientation?: PdfPageOrientation;
  pageSize?: PdfPageSize;
  showSignatures?: boolean;
  showPageFooter?: boolean;
  subTitle?: string;
  sections: PdfTemplateSection[];
}

// ─── FIN Report Context Types (module-specific) ────────────────────────────────
export interface FinVoucherReportContext {
  voucher_no: string;
  voucher_date: string;
  voucher_type_name: string;
  voucher_narration?: string;
  currency_name: string;
  company_name: string;
  company_registration?: string;
  ref_no?: string;
  total_amount?: number;
  rows: FinVoucherLineRow[];
}

export interface FinVoucherLineRow {
  gl_code: string;
  gl_name: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface CoaReportContext {
  currency_code: string;
  rows: CoaRow[];
}

export interface CoaRow {
  account_group_name: string;
  account_code: string;
  account_name: string;
  control_type?: number | null;
  control_type_label?: string;
  is_postable?: number | null;
}

export const controlTypeShortCode = (ct?: number | null): string => {
  switch (ct) {
    case 1:
      return 'AR';
    case 2:
      return 'AP';
    case 3:
      return 'BNK';
    case 4:
      return 'CSH';
    case 5:
      return 'INV';
    case 6:
      return 'TAX';
    case 7:
      return 'RE';
    default:
      return '';
  }
};

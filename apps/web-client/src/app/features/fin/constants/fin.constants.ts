/**
 * FIN module static enum / select-option lists — single source of truth (CLAUDE.md rule).
 * Most values are DB-first numeric SMALLINT codes; debit/credit side uses dr/cr strings.
 */
import { debitCreditOptions } from '../../../core/constants/common-options.constants';

export interface SelectOption { label: string; value: unknown; }

export const finConstants = {
  rootTypes: [
    { value: 1, label: 'Asset' },
    { value: 2, label: 'Liability' },
    { value: 3, label: 'Equity' },
    { value: 4, label: 'Income' },
    { value: 5, label: 'Expense' },
  ],
  drCr: debitCreditOptions,
  controlTypes: [
    { value: 1, label: 'Accounts Receivable' },
    { value: 2, label: 'Accounts Payable' },
    { value: 3, label: 'Bank' },
    { value: 4, label: 'Cash' },
    { value: 5, label: 'Inventory' },
    { value: 6, label: 'Tax' },
    { value: 7, label: 'Retained Earnings' },
  ],
  voucherBaseKinds: [
    { value: 1, label: 'Journal' },
    { value: 2, label: 'Payment' },
    { value: 3, label: 'Receipt' },
    { value: 4, label: 'Contra' },
    { value: 5, label: 'Sales' },
    { value: 6, label: 'Purchase' },
    { value: 7, label: 'Opening' },
    { value: 8, label: 'Closing' },
  ],
  voucherStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ],
  partyTypes: [
    { value: 1, label: 'Customer' },
    { value: 2, label: 'Supplier' },
    { value: 3, label: 'Employee' },
  ],
  periodStatuses: [
    { value: 1, label: 'Open' },
    { value: 2, label: 'Closed' },
    { value: 3, label: 'Locked' },
  ],
  glEventTypes: [
    { value: 'PayrollPosted', label: 'Payroll Posted' },
    { value: 'PurchaseInvoicePosted', label: 'Purchase Invoice Posted' },
    { value: 'SupplierPaymentPosted', label: 'Supplier Payment Posted' },
    { value: 'SalesInvoicePosted', label: 'Sales Invoice Posted' },
    { value: 'CustomerReceiptPosted', label: 'Customer Receipt Posted' },
    { value: 'StockAdjustmentPosted', label: 'Stock Adjustment Posted' },
    { value: 'StockAdjustmentReversed', label: 'Stock Adjustment Reversed' },
    { value: 'OpeningStockPosted', label: 'Opening Stock Posted' },
    { value: 'SalesReturnPosted', label: 'Sales Return Posted' },
  ] as SelectOption[],
  glLegKeys: [
    { value: 'EXPENSE', label: 'EXPENSE' },
    { value: 'PAYABLE', label: 'PAYABLE' },
    { value: 'RECEIVABLE', label: 'RECEIVABLE' },
    { value: 'CASH', label: 'CASH' },
    { value: 'BANK', label: 'BANK' },
    { value: 'INVENTORY', label: 'INVENTORY' },
    { value: 'COGS', label: 'COGS' },
    { value: 'REVENUE', label: 'REVENUE' },
    { value: 'VAT_INPUT', label: 'VAT_INPUT' },
    { value: 'VAT_OUTPUT', label: 'VAT_OUTPUT' },
    { value: 'STATUTORY', label: 'STATUTORY' },
    { value: 'ROUNDING', label: 'ROUNDING' },
    { value: 'FX_GAIN', label: 'FX_GAIN' },
    { value: 'FX_LOSS', label: 'FX_LOSS' },
    { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
    { value: 'OPENING_EQUITY', label: 'OPENING_EQUITY' },
  ] as SelectOption[],
};

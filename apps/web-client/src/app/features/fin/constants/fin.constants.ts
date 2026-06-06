/**
 * FIN module static enum / select-option lists — single source of truth (CLAUDE.md rule).
 * Every `value` is the DB-first numeric SMALLINT code the column stores.
 */
export interface SelectOption { label: string; value: unknown; }

export const finConstants = {
  rootTypes: [
    { value: 1, label: 'Asset' },
    { value: 2, label: 'Liability' },
    { value: 3, label: 'Equity' },
    { value: 4, label: 'Income' },
    { value: 5, label: 'Expense' },
  ],
  drCr: [
    { value: 1, label: 'Debit' },
    { value: 2, label: 'Credit' },
  ],
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
};

export interface SelectOption { label: string; value: unknown; }

/** SAL module static enums (DB-first numeric values matching the backend CHECK codes). */
export const salConstants = {
  customerTypes: [
    { value: 1, label: 'Walk-in' },
    { value: 2, label: 'Retail' },
    { value: 3, label: 'Wholesale' },
    { value: 4, label: 'Corporate' },
  ] as SelectOption[],
  priceTiers: [
    { value: 1, label: 'Retail' },
    { value: 2, label: 'Wholesale' },
    { value: 3, label: 'Corporate' },
  ] as SelectOption[],
  saleTypes: [
    { value: 1, label: 'POS' },
    { value: 2, label: 'Credit Invoice' },
  ] as SelectOption[],
  invoiceStatuses: [
    { value: 1, label: 'Draft' },
    { value: 3, label: 'Posted' },
    { value: 4, label: 'Partially Returned' },
    { value: 5, label: 'Returned' },
    { value: 6, label: 'Cancelled' },
  ] as SelectOption[],
  paymentMethods: [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'Bank Transfer' },
    { value: 3, label: 'Cheque' },
    { value: 4, label: 'Mobile Banking' },
    { value: 5, label: 'Card' },
    { value: 6, label: 'Adjustment' },
  ] as SelectOption[],
  receiptStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
  returnReasons: [
    { value: 1, label: 'Defective' },
    { value: 2, label: 'Wrong Item' },
    { value: 3, label: 'Expired' },
    { value: 4, label: 'Customer Change' },
    { value: 5, label: 'Other' },
  ] as SelectOption[],
  refundMethods: [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'Card' },
    { value: 3, label: 'Mobile' },
    { value: 4, label: 'Bank' },
    { value: 5, label: 'Store Credit' },
    { value: 6, label: 'Against Due' },
  ] as SelectOption[],
  returnStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
};

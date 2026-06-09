export interface SelectOption { label: string; value: unknown; }

/** PUR module static enums (DB-first numeric values matching the backend CHECK codes). */
export const purConstants = {
  supplierTypes: [
    { value: 1, label: 'Distributor' },
    { value: 2, label: 'Manufacturer' },
    { value: 3, label: 'Importer' },
    { value: 4, label: 'Local Vendor' },
    { value: 5, label: 'Service' },
  ] as SelectOption[],
  paymentTerms: [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'Credit' },
    { value: 3, label: 'Advance' },
    { value: 4, label: 'Consignment' },
  ] as SelectOption[],
  invoiceStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Partially Returned' },
    { value: 4, label: 'Returned' },
    { value: 5, label: 'Cancelled' },
  ] as SelectOption[],
  paymentMethods: [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'Bank Transfer' },
    { value: 3, label: 'Cheque' },
    { value: 4, label: 'Mobile Banking' },
    { value: 5, label: 'Card' },
    { value: 6, label: 'Adjustment' },
  ] as SelectOption[],
  paymentStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
  returnReasons: [
    { value: 1, label: 'Defective' },
    { value: 2, label: 'Expired' },
    { value: 3, label: 'Excess' },
    { value: 4, label: 'Wrong Item' },
    { value: 5, label: 'Price Dispute' },
    { value: 6, label: 'Other' },
  ] as SelectOption[],
  settlementModes: [
    { value: 1, label: 'Adjust Payable (Debit Note)' },
    { value: 2, label: 'Cash Refund' },
    { value: 3, label: 'Replacement' },
  ] as SelectOption[],
  returnStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
  orderStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'Partially Received' },
    { value: 5, label: 'Received' },
    { value: 6, label: 'Closed' },
    { value: 7, label: 'Cancelled' },
  ] as SelectOption[],
  receiptStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Posted' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
  landedCostTypes: [
    { value: 1, label: 'Freight' },
    { value: 2, label: 'Duty' },
    { value: 3, label: 'Clearing' },
    { value: 4, label: 'Insurance' },
    { value: 5, label: 'Handling' },
    { value: 6, label: 'Other' },
  ] as SelectOption[],
  landedAllocBases: [
    { value: 1, label: 'Value' },
    { value: 2, label: 'Qty' },
  ] as SelectOption[],
  landedStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Applied' },
    { value: 3, label: 'Cancelled' },
  ] as SelectOption[],
};

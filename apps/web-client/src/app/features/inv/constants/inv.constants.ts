import { SelectOption } from '../../../shared/components/common-table';

export const invConstants = {
  productTypes: [
    { value: 1, label: 'Standard' },
    { value: 2, label: 'Variant Parent' },
    { value: 3, label: 'Service' },
    { value: 4, label: 'Bundle / Kit' },
  ] satisfies SelectOption[],

  barcodeTypes: [
    { value: 1, label: 'EAN-13' },
    { value: 2, label: 'UPC' },
    { value: 3, label: 'CODE-128' },
    { value: 4, label: 'QR' },
    { value: 5, label: 'Internal' },
  ] satisfies SelectOption[],

  batchExpiryStatuses: [
    { value: null, label: 'All' },
    { value: 'expired', label: 'Expired' },
    { value: 'near_expiry', label: 'Near Expiry' },
    { value: 'ok', label: 'OK' },
    { value: 'no_expiry', label: 'No Expiry' },
  ] satisfies SelectOption[],

  adjustmentTypes: [
    { value: 1, label: 'Correction' },
    { value: 3, label: 'Damage' },
    { value: 4, label: 'Loss / Theft' },
    { value: 5, label: 'Count Variance' },
    { value: 6, label: 'Revaluation' },
  ] satisfies SelectOption[],

  stockTransferStatuses: {
    1: 'Draft',
    2: 'Submitted',
    3: 'Dispatched',
    4: 'Received',
    5: 'Partially Received',
    6: 'Cancelled',
  } as Record<number, string>,

  stockTransferStatusOptions: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Dispatched' },
    { value: 4, label: 'Received' },
    { value: 5, label: 'Partially Received' },
    { value: 6, label: 'Cancelled' },
  ] satisfies SelectOption[],
} as const;

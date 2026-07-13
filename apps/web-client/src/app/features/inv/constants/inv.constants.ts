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
} as const;

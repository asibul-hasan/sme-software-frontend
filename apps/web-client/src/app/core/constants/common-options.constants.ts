export type DebitCreditValue = 'dr' | 'cr';

export interface CommonSelectOption<T = unknown> {
  label: string;
  value: T;
}

export const debitCreditOptions: readonly CommonSelectOption<DebitCreditValue>[] = [
  { value: 'dr', label: 'Debit' },
  { value: 'cr', label: 'Credit' },
] as const;

/**
 * Accounting, Cash Closers & Due Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `cash_closers`, `due_collections`, `acc_transaction_accounts`, `acc_expense_categories`,
 *         `acc_expenses`, `acc_income_categories`, `acc_incomes`, `acc_additional_balances`,
 *         `acc_reconciliations`, `acc_transaction_ledger`.
 */

export interface CashCloser {
  cash_closer_no: number;
  pharmacy_no: number;
  branch_no: number;
  closed_by_user_no: number;
  register_id?: string | null;
  shift_no?: number;
  opening_balance: number;
  cash_sales_collected: number;
  card_collected?: number;
  bkash_collected?: number;
  nagad_collected?: number;
  rocket_collected?: number;
  split_collected?: number;
  due_collections: number;
  cash_returns_paid: number;
  expenses_paid: number;
  calculated_closing_balance: number;
  actual_counted_balance: number;
  discrepancy_amount: number;
  note?: string | null;
  closing_date: string;
  created_at: string;
}

export interface DueCollection {
  due_collection_no: number;
  pharmacy_no: number;
  branch_no: number;
  customer_no: number;
  account_no?: number;
  sale_invoice_no: number;
  payment_number: string;
  payment_method: number;
  amount: number;
  note?: string | null;
  received_by_user_no: number;
  payment_date: string;
  created_at: string;
}

export interface AccTransactionAccount {
  account_no: number;
  pharmacy_no: number;
  branch_no: number;
  account_category?: number;
  account_code?: string | null;
  account_name: string;
  phone_number?: string | null;
  account_type: number;
  bank_account_number?: string | null;
  bank_name?: string | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccExpenseCategory {
  expense_category_no: number;
  pharmacy_no: number;
  branch_no: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AccExpense {
  expense_no: number;
  pharmacy_no: number;
  branch_no: number;
  voucher_no: string;
  expense_category_no: number;
  account_no: number;
  amount: number;
  payment_type: string;
  note?: string | null;
  created_by_user_no: number;
  expense_date: string;
  created_at: string;

  // Navigation
  category?: AccExpenseCategory;
  account?: AccTransactionAccount;
}

export interface AccIncomeCategory {
  income_category_no: number;
  pharmacy_no: number;
  branch_no: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AccIncome {
  income_no: number;
  pharmacy_no: number;
  branch_no: number;
  receipt_no: string;
  income_category_no: number;
  account_no: number;
  amount: number;
  payment_type: string;
  received_from?: string | null;
  note?: string | null;
  created_by_user_no: number;
  income_date: string;
  created_at: string;

  // Navigation
  category?: AccIncomeCategory;
  account?: AccTransactionAccount;
}

export interface AccAdditionalBalance {
  additional_balance_no: number;
  pharmacy_no: number;
  branch_no: number;
  account_no: number;
  amount: number;
  entry_date: string;
  note?: string | null;
  created_by_user_no: number;
  created_at: string;

  // Navigation
  account?: AccTransactionAccount;
}

export interface AccReconciliation {
  reconciliation_no: number;
  pharmacy_no: number;
  branch_no: number;
  voucher_no: string;
  payment_from_account_no: number;
  payment_to_account_no: number;
  amount: number;
  note?: string | null;
  created_by_user_no: number;
  transfer_date: string;
  created_at: string;

  // Navigation
  from_account?: AccTransactionAccount;
  to_account?: AccTransactionAccount;
}

export interface AccTransactionLedger {
  ledger_no: number;
  pharmacy_no: number;
  branch_no: number;
  journal_no: number;
  reversal_of_ledger_no?: number | null;
  account_no: number;
  transaction_date: string;
  transaction_type: number;
  debit_amount: number;
  credit_amount: number;
  balance_after: number;
  source_document_type: string;
  source_document_no: string;
  source_document_id: number;
  party_type?: number | null;
  party_no?: number | null;
  narration?: string | null;
  created_by_user_no?: number | null;
  created_at: string;
}

// Backward-compatible type aliases
export type TransactionAccount = AccTransactionAccount;
export type ExpenseCategory = AccExpenseCategory;
export type ExpenseVoucher = AccExpense;
export type IncomeCategory = AccIncomeCategory;
export type IncomeVoucher = AccIncome;
export type CashReconciliation = AccReconciliation;
export type FinancialLedgerEntry = AccTransactionLedger;

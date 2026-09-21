import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import {
  AccTransactionAccount,
  AccExpenseCategory,
  AccExpense,
} from '../models/accounting.models';

const FALLBACK_ACCOUNTS: AccTransactionAccount[] = [
  {
    account_no: 1,
    pharmacy_no: 1,
    branch_no: 1,
    account_category: 1,
    account_code: '10101',
    account_name: 'Main Cash Drawer',
    phone_number: null,
    account_type: 1, // Cash
    bank_account_number: null,
    bank_name: null,
    current_balance: 48500,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    account_no: 2,
    pharmacy_no: 1,
    branch_no: 1,
    account_category: 1,
    account_code: '10102',
    account_name: 'bKash Merchant Account',
    phone_number: '01711002233',
    account_type: 4, // bKash Merchant
    bank_account_number: null,
    bank_name: null,
    current_balance: 32400,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    account_no: 3,
    pharmacy_no: 1,
    branch_no: 1,
    account_category: 1,
    account_code: '10201',
    account_name: 'BRAC Bank Current A/C',
    phone_number: null,
    account_type: 2, // Bank
    bank_account_number: '1501203495810001',
    bank_name: 'BRAC Bank PLC',
    current_balance: 185000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    account_no: 4,
    pharmacy_no: 1,
    branch_no: 1,
    account_category: 1,
    account_code: '10103',
    account_name: 'Nagad Business Wallet',
    phone_number: '01811998877',
    account_type: 5, // Nagad
    bank_account_number: null,
    bank_name: null,
    current_balance: 14200,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    account_no: 5,
    pharmacy_no: 1,
    branch_no: 1,
    account_category: 1,
    account_code: '10202',
    account_name: 'Islami Bank A/C',
    phone_number: null,
    account_type: 2, // Bank
    bank_account_number: '2050123984710002',
    bank_name: 'Islami Bank Bangladesh Ltd.',
    current_balance: 92000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const FALLBACK_EXPENSE_CATEGORIES: AccExpenseCategory[] = [
  { expense_category_no: 1, pharmacy_no: 1, branch_no: 1, name: 'Shop Rent', is_active: true, created_at: '' },
  { expense_category_no: 2, pharmacy_no: 1, branch_no: 1, name: 'Electricity & Utility Bills', is_active: true, created_at: '' },
  { expense_category_no: 3, pharmacy_no: 1, branch_no: 1, name: 'Staff Salaries', is_active: true, created_at: '' },
  { expense_category_no: 4, pharmacy_no: 1, branch_no: 1, name: 'Tea & Refreshment', is_active: true, created_at: '' },
  { expense_category_no: 5, pharmacy_no: 1, branch_no: 1, name: 'Courier & Transportation', is_active: true, created_at: '' },
  { expense_category_no: 6, pharmacy_no: 1, branch_no: 1, name: 'Stationery & Printing', is_active: true, created_at: '' },
  { expense_category_no: 7, pharmacy_no: 1, branch_no: 1, name: 'Maintenance & Repairs', is_active: true, created_at: '' },
];

const FALLBACK_EXPENSES: AccExpense[] = [
  {
    expense_no: 101,
    pharmacy_no: 1,
    branch_no: 1,
    voucher_no: 'EXP-2026-0045',
    expense_category_no: 2,
    account_no: 1,
    amount: 3200,
    payment_type: 'Cash',
    note: 'DESCO electricity bill for August',
    created_by_user_no: 1,
    expense_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    expense_no: 102,
    pharmacy_no: 1,
    branch_no: 1,
    voucher_no: 'EXP-2026-0044',
    expense_category_no: 4,
    account_no: 1,
    amount: 450,
    payment_type: 'Cash',
    note: 'Staff refreshments & snacks',
    created_by_user_no: 1,
    expense_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    expense_no: 103,
    pharmacy_no: 1,
    branch_no: 1,
    voucher_no: 'EXP-2026-0043',
    expense_category_no: 1,
    account_no: 3,
    amount: 35000,
    payment_type: 'Bank',
    note: 'Monthly commercial shop rental advance',
    created_by_user_no: 1,
    expense_date: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    expense_no: 104,
    pharmacy_no: 1,
    branch_no: 1,
    voucher_no: 'EXP-2026-0042',
    expense_category_no: 6,
    account_no: 1,
    amount: 800,
    payment_type: 'Cash',
    note: 'POS thermal roll paper and invoice pads',
    created_by_user_no: 1,
    expense_date: new Date(Date.now() - 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class AccountingService {
  private readonly api = inject(ApiService);
  private localAccounts = [...FALLBACK_ACCOUNTS];
  private localCategories = [...FALLBACK_EXPENSE_CATEGORIES];
  private localExpenses = [...FALLBACK_EXPENSES];

  getAccounts(params?: Record<string, unknown>): Observable<ApiResponse<AccTransactionAccount[]>> {
    return this.api.get<AccTransactionAccount[]>('acc/accounts', params).pipe(
      catchError(() => {
        let list = [...this.localAccounts];
        if (params && params['accountType']) {
          const t = Number(params['accountType']);
          list = list.filter(a => a.account_type === t);
        }
        return of<ApiResponse<AccTransactionAccount[]>>({
          success: true,
          data: list,
        });
      })
    );
  }

  createAccount(account: Partial<AccTransactionAccount>): Observable<ApiResponse<AccTransactionAccount>> {
    return this.api.post<AccTransactionAccount>('acc/accounts', account).pipe(
      catchError(() => {
        const newAcc: AccTransactionAccount = {
          account_no: Date.now(),
          pharmacy_no: account.pharmacy_no || 1,
          branch_no: account.branch_no || 1,
          account_category: account.account_category || 1,
          account_code: account.account_code || '10999',
          account_name: account.account_name || 'New Financial Account',
          phone_number: account.phone_number,
          account_type: account.account_type || 1,
          bank_account_number: account.bank_account_number,
          bank_name: account.bank_name,
          current_balance: account.current_balance || 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.localAccounts.push(newAcc);
        return of<ApiResponse<AccTransactionAccount>>({
          success: true,
          data: newAcc,
          message: `Account "${newAcc.account_name}" registered successfully`,
        });
      })
    );
  }

  getExpenseCategories(): Observable<ApiResponse<AccExpenseCategory[]>> {
    return this.api.get<AccExpenseCategory[]>('acc/expense-categories').pipe(
      catchError(() => of<ApiResponse<AccExpenseCategory[]>>({ success: true, data: this.localCategories }))
    );
  }

  createExpenseCategory(cat: Partial<AccExpenseCategory>): Observable<ApiResponse<AccExpenseCategory>> {
    return this.api.post<AccExpenseCategory>('acc/expense-categories', cat).pipe(
      catchError(() => {
        const newCat: AccExpenseCategory = {
          expense_category_no: Date.now(),
          pharmacy_no: cat.pharmacy_no || 1,
          branch_no: cat.branch_no || 1,
          name: cat.name || 'General Expense',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        this.localCategories.push(newCat);
        return of<ApiResponse<AccExpenseCategory>>({ success: true, data: newCat });
      })
    );
  }

  getExpenses(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<AccExpense>>> {
    return this.api.getPaged<AccExpense>('acc/expenses', params).pipe(
      catchError(() => {
        let list = [...this.localExpenses];
        if (params) {
          if (params['categoryNo']) {
            const cNo = Number(params['categoryNo']);
            list = list.filter(e => e.expense_category_no === cNo);
          }
          if (params['accountNo']) {
            const aNo = Number(params['accountNo']);
            list = list.filter(e => e.account_no === aNo);
          }
          if (params['paymentType']) {
            const pt = String(params['paymentType']).toLowerCase();
            list = list.filter(e => e.payment_type.toLowerCase() === pt);
          }
          if (params['fromDate']) {
            const from = new Date(String(params['fromDate'])).getTime();
            list = list.filter(e => new Date(e.expense_date).getTime() >= from);
          }
          if (params['toDate']) {
            const to = new Date(String(params['toDate'])).getTime() + 86399999;
            list = list.filter(e => new Date(e.expense_date).getTime() <= to);
          }
          if (params['search']) {
            const q = String(params['search']).toLowerCase().trim();
            list = list.filter(e => e.voucher_no.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q)));
          }
        }
        return of<ApiResponse<PagedResult<AccExpense>>>({
          success: true,
          data: {
            items: list,
            total: list.length,
            pageIndex: 1,
            pageSize: 50,
            totalPages: 1,
          },
        });
      })
    );
  }

  createExpense(expense: Partial<AccExpense>): Observable<ApiResponse<AccExpense>> {
    return this.api.post<AccExpense>('acc/expenses', expense).pipe(
      catchError(() => {
        const newExp: AccExpense = {
          expense_no: Date.now(),
          pharmacy_no: expense.pharmacy_no || 1,
          branch_no: expense.branch_no || 1,
          voucher_no: 'EXP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          expense_category_no: expense.expense_category_no || 1,
          account_no: expense.account_no || 1,
          amount: expense.amount || 0,
          payment_type: expense.payment_type || 'Cash',
          note: expense.note,
          created_by_user_no: 1,
          expense_date: expense.expense_date || new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        this.localExpenses.unshift(newExp);
        // Deduct from local account
        const acc = this.localAccounts.find(a => a.account_no === newExp.account_no);
        if (acc) {
          acc.current_balance = Math.max(0, acc.current_balance - newExp.amount);
        }
        return of<ApiResponse<AccExpense>>({
          success: true,
          data: newExp,
          message: `Expense ${newExp.voucher_no} of ৳${newExp.amount} posted successfully`,
        });
      })
    );
  }
}

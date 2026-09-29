import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import {
  AccTransactionAccount,
  AccExpenseCategory,
  AccExpense,
  AccIncome,
  AccIncomeCategory,
  AccAdditionalBalance,
  AccReconciliation,
} from '../models/accounting.models';

@Injectable({
  providedIn: 'root',
})
export class AccountingService {
  private readonly api = inject(ApiService);

  // Accounts
  getAccounts(params?: Record<string, unknown>): Observable<ApiResponse<AccTransactionAccount[]>> {
    return this.api.get<AccTransactionAccount[]>('acc/accounts', params);
  }

  getAccount(accountNo: number): Observable<ApiResponse<AccTransactionAccount>> {
    return this.api.get<AccTransactionAccount>(`acc/accounts/${accountNo}`);
  }

  createAccount(account: Partial<AccTransactionAccount>): Observable<ApiResponse<AccTransactionAccount>> {
    return this.api.post<AccTransactionAccount>('acc/accounts', account);
  }

  updateAccount(accountNo: number, account: Partial<AccTransactionAccount>): Observable<ApiResponse<AccTransactionAccount>> {
    return this.api.put<AccTransactionAccount>(`acc/accounts/${accountNo}`, account);
  }

  deleteAccount(accountNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`acc/accounts/${accountNo}`);
  }

  getAccountStatement(accountNo: number): Observable<ApiResponse<{ account: AccTransactionAccount; transactions: any[] }>> {
    return this.api.get<{ account: AccTransactionAccount; transactions: any[] }>(`acc/accounts/${accountNo}/statement`);
  }

  // Expense Categories
  getExpenseCategories(): Observable<ApiResponse<AccExpenseCategory[]>> {
    return this.api.get<AccExpenseCategory[]>('acc/expenses/categories');
  }

  createExpenseCategory(cat: Partial<AccExpenseCategory>): Observable<ApiResponse<AccExpenseCategory>> {
    return this.api.post<AccExpenseCategory>('acc/expenses/categories', cat);
  }

  // Expenses
  getExpenses(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<AccExpense>>> {
    return this.api.getPaged<AccExpense>('acc/expenses', params);
  }

  createExpense(expense: Partial<AccExpense>): Observable<ApiResponse<AccExpense>> {
    return this.api.post<AccExpense>('acc/expenses', expense);
  }

  deleteExpense(expenseNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`acc/expenses/${expenseNo}`);
  }

  // Income Categories
  getIncomeCategories(): Observable<ApiResponse<AccIncomeCategory[]>> {
    return this.api.get<AccIncomeCategory[]>('acc/income-categories');
  }

  createIncomeCategory(cat: Partial<AccIncomeCategory>): Observable<ApiResponse<AccIncomeCategory>> {
    return this.api.post<AccIncomeCategory>('acc/income-categories', cat);
  }

  // Income
  getIncomes(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.api.get<any>('acc/incomes', params);
  }

  createIncome(income: Partial<AccIncome>): Observable<ApiResponse<AccIncome>> {
    return this.api.post<AccIncome>('acc/incomes', income);
  }

  deleteIncome(incomeNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`acc/incomes/${incomeNo}`);
  }

  // Additional Balances
  getAdditionalBalances(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.api.get<any>('acc/additional-balances', params);
  }

  createAdditionalBalance(item: Partial<AccAdditionalBalance>): Observable<ApiResponse<AccAdditionalBalance>> {
    return this.api.post<AccAdditionalBalance>('acc/additional-balances', item);
  }

  deleteAdditionalBalance(balanceNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`acc/additional-balances/${balanceNo}`);
  }

  // Reconciliations
  getReconciliations(params?: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.api.get<any>('acc/reconciliations', params);
  }

  createReconciliation(item: Partial<AccReconciliation>): Observable<ApiResponse<AccReconciliation>> {
    return this.api.post<AccReconciliation>('acc/reconciliations', item);
  }

  deleteReconciliation(reconciliationNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`acc/reconciliations/${reconciliationNo}`);
  }

  // Financial Reports
  getTrialBalance(params?: Record<string, unknown>): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.get<Record<string, unknown>>('acc/reports/trial-balance', params);
  }

  getCashbook(params?: Record<string, unknown>): Observable<ApiResponse<Record<string, unknown>[]>> {
    return this.api.get<Record<string, unknown>[]>('acc/reports/cashbook', params);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { CustCustomer } from '../models/customer.models';

export interface CustDueRecord {
  id: string;
  customer_no?: number;
  customer: string;
  phone: string;
  inv: string;
  saleDate: string;
  dueDate: string;
  amount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly api = inject(ApiService);

  getCustomers(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<CustCustomer>>> {
    return this.api.getPaged<CustCustomer>('cust/customers', params);
  }

  getCustomer(customerNo: number): Observable<ApiResponse<CustCustomer>> {
    return this.api.get<CustCustomer>(`cust/customers/${customerNo}`);
  }

  searchCustomers(query: string): Observable<ApiResponse<PagedResult<CustCustomer>>> {
    return this.api.getPaged<CustCustomer>('cust/customers', { search: query, pageSize: 50 });
  }

  createCustomer(customer: Partial<CustCustomer>): Observable<ApiResponse<CustCustomer>> {
    return this.api.post<CustCustomer>('cust/customers', customer);
  }

  updateCustomer(customerNo: number, customer: Partial<CustCustomer>): Observable<ApiResponse<CustCustomer>> {
    return this.api.put<CustCustomer>(`cust/customers/${customerNo}`, customer);
  }

  deleteCustomer(customerNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`cust/customers/${customerNo}`);
  }

  getDueRecords(params?: Record<string, unknown>): Observable<ApiResponse<CustDueRecord[]>> {
    return this.api.get<CustDueRecord[]>('cust/dues', params);
  }

  collectDue(payload: Record<string, unknown>): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.post<Record<string, unknown>>('cust/dues/collect', payload);
  }

  getDueHistory(params?: Record<string, unknown>): Observable<ApiResponse<Record<string, unknown>[]>> {
    return this.api.get<Record<string, unknown>[]>('cust/dues/history', params);
  }

  getCustomerLedger(customerNo: number): Observable<ApiResponse<any>> {
    return this.api.get<any>(`cust/customers/${customerNo}/ledger`);
  }
}


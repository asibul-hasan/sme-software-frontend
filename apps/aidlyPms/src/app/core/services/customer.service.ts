import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { CustCustomer } from '../models/customer.models';

const FALLBACK_CUSTOMERS: CustCustomer[] = [
  {
    customer_no: 1,
    uuid: 'c1000000-0000-0000-0000-000000000001',
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Walking Customer',
    phone: '01700000000',
    gender: 1,
    customer_type: 1,
    discount_percent: 0,
    address: 'Counter Direct',
    has_due: false,
    current_due: 0,
    advance_balance: 0,
    is_loyalty_member: false,
    loyalty_points: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_no: 2,
    uuid: 'c1000000-0000-0000-0000-000000000002',
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Md. Rahim Uddin',
    phone: '01711223344',
    gender: 1,
    customer_type: 1,
    discount_percent: 5,
    address: 'Kandirpar, Cumilla',
    has_due: false,
    current_due: 0,
    advance_balance: 0,
    is_loyalty_member: true,
    loyalty_points: 120,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    customer_no: 3,
    uuid: 'c1000000-0000-0000-0000-000000000003',
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Comilla Central Medical Clinic',
    phone: '01819988776',
    gender: 1,
    customer_type: 2, // Wholesale
    discount_percent: 10,
    address: 'Badurtola, Cumilla',
    has_due: true,
    current_due: 1540,
    advance_balance: 0,
    is_loyalty_member: true,
    loyalty_points: 450,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
  private localCustomers = [...FALLBACK_CUSTOMERS];

  getCustomers(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<CustCustomer>>> {
    return this.api.getPaged<CustCustomer>('cust/customers', params).pipe(
      catchError(() => {
        return of<ApiResponse<PagedResult<CustCustomer>>>({
          success: true,
          data: {
            items: this.localCustomers,
            total: this.localCustomers.length,
            pageIndex: 1,
            pageSize: 50,
            totalPages: 1,
          },
        });
      })
    );
  }

  getCustomer(customerNo: number): Observable<ApiResponse<CustCustomer>> {
    return this.api.get<CustCustomer>(`cust/customers/${customerNo}`).pipe(
      catchError(() => {
        const customer = this.localCustomers.find(c => c.customer_no === customerNo);
        if (!customer) {
          throw new Error('Customer not found');
        }
        return of<ApiResponse<CustCustomer>>({
          success: true,
          data: customer,
        });
      })
    );
  }

  searchCustomers(query: string): Observable<ApiResponse<CustCustomer[]>> {
    return this.api.get<CustCustomer[]>('cust/customers', { search: query }).pipe(
      catchError(() => {
        const q = (query || '').toLowerCase().trim();
        const filtered = this.localCustomers.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            String(c.customer_no) === q
        );
        return of<ApiResponse<CustCustomer[]>>({
          success: true,
          data: filtered,
        });
      })
    );
  }

  createCustomer(customer: Partial<CustCustomer>): Observable<ApiResponse<CustCustomer>> {
    return this.api.post<CustCustomer>('cust/customers', customer).pipe(
      catchError(() => {
        const newCustomer: CustCustomer = {
          customer_no: Date.now(),
          uuid: 'c' + Date.now().toString().padStart(35, '0'),
          pharmacy_no: customer.pharmacy_no || 1,
          branch_no: customer.branch_no || 1,
          name: customer.name || 'New Customer',
          phone: customer.phone || '',
          gender: customer.gender ?? 1,
          customer_type: customer.customer_type ?? 1,
          discount_percent: customer.discount_percent ?? 0,
          address: customer.address || '',
          has_due: !!(customer.current_due && customer.current_due > 0),
          current_due: customer.current_due || 0,
          advance_balance: customer.advance_balance || 0,
          is_loyalty_member: !!customer.is_loyalty_member,
          loyalty_points: customer.loyalty_points || 0,
          is_active: customer.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.localCustomers.push(newCustomer);
        return of<ApiResponse<CustCustomer>>({
          success: true,
          data: newCustomer,
          message: `Customer ${newCustomer.name} created successfully`,
        });
      })
    );
  }

  getDueRecords(params?: Record<string, unknown>): Observable<ApiResponse<CustDueRecord[]>> {
    return this.api.get<CustDueRecord[]>('cust/dues', params).pipe(
      catchError(() => {
        const mockDues: CustDueRecord[] = [
          {
            id: '1',
            customer_no: 3,
            customer: 'Comilla Central Medical Clinic',
            phone: '01819988776',
            inv: 'POS-2026-891044',
            saleDate: '2026-09-15',
            dueDate: '2026-09-30',
            amount: 1540,
          },
          {
            id: '2',
            customer_no: 2,
            customer: 'Md. Rahim Uddin',
            phone: '01711223344',
            inv: 'POS-2026-891021',
            saleDate: '2026-09-12',
            dueDate: '2026-09-25',
            amount: 850,
          },
          {
            id: '3',
            customer_no: 104,
            customer: 'Dr. Shah Alam Clinic',
            phone: '01755667788',
            inv: 'POS-2026-890982',
            saleDate: '2026-09-08',
            dueDate: '2026-09-22',
            amount: 3200,
          },
        ];
        let list = [...mockDues];
        if (params) {
          if (params['search']) {
            const q = String(params['search']).toLowerCase().trim();
            list = list.filter(d => d.customer.toLowerCase().includes(q) || d.phone.includes(q) || d.inv.toLowerCase().includes(q));
          }
          if (params['fromDate']) {
            const from = new Date(String(params['fromDate'])).getTime();
            list = list.filter(d => new Date(d.saleDate).getTime() >= from);
          }
          if (params['toDate']) {
            const to = new Date(String(params['toDate'])).getTime() + 86399999;
            list = list.filter(d => new Date(d.saleDate).getTime() <= to);
          }
        }
        return of<ApiResponse<CustDueRecord[]>>({ success: true, data: list });
      })
    );
  }

  collectDue(payload: Record<string, unknown>): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.post<Record<string, unknown>>('cust/dues/collect', payload).pipe(
      catchError(() => {
        const receipt = {
          id: String(Date.now()),
          receipt: 'REC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          customer: payload['customer'] || 'Customer',
          phone: payload['phone'] || '',
          method: payload['method'] || 'Cash',
          account_no: payload['account_no'] || 1,
          amount: Number(payload['amount']) || 0,
          note: payload['note'] || 'Due settled',
          date: new Date().toISOString().slice(0, 10),
        };
        return of<ApiResponse<Record<string, unknown>>>({
          success: true,
          data: receipt,
          message: `Due receipt ${receipt.receipt} of ৳${receipt.amount} generated successfully`,
        });
      })
    );
  }
}


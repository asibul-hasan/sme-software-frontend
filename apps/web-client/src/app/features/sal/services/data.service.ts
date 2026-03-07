import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalesDataService {
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) { }

  // Customer API
  getCustomers(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customers`, { params });
  }

  getCustomer(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customers`, data);
  }

  updateCustomer(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/customers/${id}`, data);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/customers/${id}`);
  }

  // Invoice API
  getInvoices(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices`, { params });
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invoices`, data);
  }

  updateInvoiceStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/invoices/${id}/status`, { status });
  }

  // Payment API
  getPayments(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payments`, { params });
  }

  recordPayment(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments`, data);
  }
}

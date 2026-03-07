import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryDataService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  // Product API
  getProducts(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }

  // Category API
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  createCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${id}`);
  }

  // Stock API
  getStock(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stock`, { params });
  }

  adjustStock(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/stock/adjust`, data);
  }

  // Warehouse API
  getWarehouses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/warehouses`);
  }
}

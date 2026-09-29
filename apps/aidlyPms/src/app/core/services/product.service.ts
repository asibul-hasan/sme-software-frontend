import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import {
  ProdProduct,
  ProdCompany,
  ProdGeneric,
  ProdProductBatch,
  ProdProductRequisition,
} from '../models/product.models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly api = inject(ApiService);

  // Products
  getProducts(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<ProdProduct>>> {
    return this.api.getPaged<ProdProduct>('prod/products', params);
  }

  getProduct(productNo: number): Observable<ApiResponse<ProdProduct>> {
    return this.api.get<ProdProduct>(`prod/products/${productNo}`);
  }

  searchProducts(query: string): Observable<ApiResponse<PagedResult<ProdProduct>>> {
    return this.api.getPaged<ProdProduct>('prod/products', { search: query, pageSize: 50 });
  }

  createProduct(product: Partial<ProdProduct>): Observable<ApiResponse<ProdProduct>> {
    return this.api.post<ProdProduct>('prod/products', product);
  }

  updateProduct(productNo: number, product: Partial<ProdProduct>): Observable<ApiResponse<ProdProduct>> {
    return this.api.put<ProdProduct>(`prod/products/${productNo}`, product);
  }

  deleteProduct(productNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`prod/products/${productNo}`);
  }

  // Companies
  getCompanies(params?: Record<string, unknown>): Observable<ApiResponse<ProdCompany[]>> {
    return this.api.get<ProdCompany[]>('prod/companies', params);
  }

  createCompany(company: Partial<ProdCompany>): Observable<ApiResponse<ProdCompany>> {
    return this.api.post<ProdCompany>('prod/companies', company);
  }

  updateCompany(companyNo: number, company: Partial<ProdCompany>): Observable<ApiResponse<ProdCompany>> {
    return this.api.put<ProdCompany>(`prod/companies/${companyNo}`, company);
  }

  deleteCompany(companyNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`prod/companies/${companyNo}`);
  }

  // Generics
  getGenerics(params?: Record<string, unknown>): Observable<ApiResponse<ProdGeneric[]>> {
    return this.api.get<ProdGeneric[]>('prod/generics', params);
  }

  createGeneric(generic: Partial<ProdGeneric>): Observable<ApiResponse<ProdGeneric>> {
    return this.api.post<ProdGeneric>('prod/generics', generic);
  }

  updateGeneric(genericNo: number, generic: Partial<ProdGeneric>): Observable<ApiResponse<ProdGeneric>> {
    return this.api.put<ProdGeneric>(`prod/generics/${genericNo}`, generic);
  }

  deleteGeneric(genericNo: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`prod/generics/${genericNo}`);
  }

  // Batches
  getBatches(params?: Record<string, unknown>): Observable<ApiResponse<ProdProductBatch[]>> {
    return this.api.get<ProdProductBatch[]>('inv/batches/active', params);
  }

  getExpiredBatches(): Observable<ApiResponse<ProdProductBatch[]>> {
    return this.api.get<ProdProductBatch[]>('inv/batches/expired');
  }

  getNearExpiryBatches(days = 90): Observable<ApiResponse<ProdProductBatch[]>> {
    return this.api.get<ProdProductBatch[]>('inv/batches/near-expiry', { daysThreshold: days });
  }

  // Requisitions
  getRequisitions(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<ProdProductRequisition>>> {
    return this.api.getPaged<ProdProductRequisition>('prod/requisitions', params);
  }

  createRequisition(payload: unknown): Observable<ApiResponse<ProdProductRequisition>> {
    return this.api.post<ProdProductRequisition>('prod/requisitions', payload);
  }

  getRequisitionRecords(params?: Record<string, unknown>): Observable<ApiResponse<ProdProductRequisition[]>> {
    return this.api.get<ProdProductRequisition[]>('prod/requisitions/records', params);
  }

  getRequisitionById(requisitionNo: number): Observable<ApiResponse<ProdProductRequisition>> {
    return this.api.get<ProdProductRequisition>(`prod/requisitions/${requisitionNo}`);
  }

  updateRequisitionStatus(requisitionNo: number, status: string): Observable<ApiResponse<boolean>> {
    return this.api.put<boolean>(`prod/requisitions/${requisitionNo}/status`, { status });
  }

  getLowStockProducts(companyNo?: number, fallbackLowest = true): Observable<ApiResponse<import('../models/product.models').LowStockProduct[]>> {
    const params: Record<string, unknown> = { fallbackLowest };
    if (companyNo) params['companyNo'] = companyNo;
    return this.api.get<import('../models/product.models').LowStockProduct[]>('prod/products/low-stock', params);
  }

  getProductBatches(productNo: number): Observable<ApiResponse<ProdProductBatch[]>> {
    return this.api.get<ProdProductBatch[]>(`inv/batches/product/${productNo}`);
  }

  adjustProductStock(productNo: number, payload: { target_stock_pcs: number; reason?: string; remarks?: string }): Observable<ApiResponse<any>> {
    return this.api.post<any>(`prod/products/${productNo}/adjust-stock`, payload);
  }
}


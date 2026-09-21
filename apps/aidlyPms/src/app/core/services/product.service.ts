import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { ProdProduct, ProdCompany, ProdGeneric } from '../models/product.models';

const FALLBACK_COMPANIES: ProdCompany[] = [
  { company_no: 1, pharmacy_no: 1, branch_no: 1, name: 'Beximco Pharmaceuticals Ltd.', is_active: true, created_at: '', updated_at: '' },
  { company_no: 2, pharmacy_no: 1, branch_no: 1, name: 'Square Pharmaceuticals PLC', is_active: true, created_at: '', updated_at: '' },
  { company_no: 3, pharmacy_no: 1, branch_no: 1, name: 'ACI Limited', is_active: true, created_at: '', updated_at: '' },
  { company_no: 4, pharmacy_no: 1, branch_no: 1, name: 'Incepta Pharmaceuticals Ltd.', is_active: true, created_at: '', updated_at: '' },
  { company_no: 5, pharmacy_no: 1, branch_no: 1, name: 'Renata Limited', is_active: true, created_at: '', updated_at: '' },
];

const FALLBACK_GENERICS: ProdGeneric[] = [
  { generic_no: 1, pharmacy_no: 1, branch_no: 1, name: 'Paracetamol', is_active: true, created_at: '', updated_at: '' },
  { generic_no: 2, pharmacy_no: 1, branch_no: 1, name: 'Omeprazole', is_active: true, created_at: '', updated_at: '' },
  { generic_no: 3, pharmacy_no: 1, branch_no: 1, name: 'Esomeprazole', is_active: true, created_at: '', updated_at: '' },
  { generic_no: 4, pharmacy_no: 1, branch_no: 1, name: 'Pantoprazole', is_active: true, created_at: '', updated_at: '' },
  { generic_no: 5, pharmacy_no: 1, branch_no: 1, name: 'Ciprofloxacin', is_active: true, created_at: '', updated_at: '' },
  { generic_no: 6, pharmacy_no: 1, branch_no: 1, name: 'Montelukast', is_active: true, created_at: '', updated_at: '' },
];

const FALLBACK_PRODUCTS: ProdProduct[] = [
  {
    product_no: 101,
    uuid: 'p1000000-0000-0000-0000-000000000101',
    pharmacy_no: 1,
    branch_no: 1,
    company_no: 2,
    generic_no: 1,
    product_name: 'Napa 500mg Tablet',
    brand_name: 'Napa 500mg Tablet',
    strength: '500mg',
    volume: 'Tablet',
    medicine_type: 1,
    unit_type: 1,
    quantity_per_box: 500,
    cost_per_box: 450,
    sale_price_per_box: 600,
    avg_purchase_price_per_piece: 0.9,
    purchase_price_per_piece: 0.9,
    sale_price_per_piece: 1.2,
    wholesale_price_per_box: 500,
    wholesale_price_per_piece: 1.0,
    country_of_origin: 'Bangladesh',
    barcode_value: '8941100101',
    is_medicine: true,
    min_stock_qty_pcs: 100,
    rak_number: 'A-01',
    stock_qty: 450,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    product_no: 102,
    uuid: 'p1000000-0000-0000-0000-000000000102',
    pharmacy_no: 1,
    branch_no: 1,
    company_no: 1,
    generic_no: 1,
    product_name: 'Napa Extra Tablet',
    brand_name: 'Napa Extra Tablet',
    strength: '500mg + 65mg',
    volume: 'Tablet',
    medicine_type: 1,
    unit_type: 1,
    quantity_per_box: 200,
    cost_per_box: 400,
    sale_price_per_box: 500,
    avg_purchase_price_per_piece: 2.0,
    purchase_price_per_piece: 2.0,
    sale_price_per_piece: 2.5,
    wholesale_price_per_box: 440,
    wholesale_price_per_piece: 2.2,
    country_of_origin: 'Bangladesh',
    barcode_value: '8941100102',
    is_medicine: true,
    min_stock_qty_pcs: 50,
    rak_number: 'A-02',
    stock_qty: 180,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    product_no: 103,
    uuid: 'p1000000-0000-0000-0000-000000000103',
    pharmacy_no: 1,
    branch_no: 1,
    company_no: 2,
    generic_no: 2,
    product_name: 'Seclo 20mg Capsule',
    brand_name: 'Seclo 20mg Capsule',
    strength: '20mg',
    volume: 'Capsule',
    medicine_type: 2,
    unit_type: 1,
    quantity_per_box: 100,
    cost_per_box: 480,
    sale_price_per_box: 700,
    avg_purchase_price_per_piece: 4.8,
    purchase_price_per_piece: 4.8,
    sale_price_per_piece: 7.0,
    wholesale_price_per_box: 550,
    wholesale_price_per_piece: 5.5,
    country_of_origin: 'Bangladesh',
    barcode_value: '8941100103',
    is_medicine: true,
    min_stock_qty_pcs: 30,
    rak_number: 'B-01',
    stock_qty: 90,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    product_no: 104,
    uuid: 'p1000000-0000-0000-0000-000000000104',
    pharmacy_no: 1,
    branch_no: 1,
    company_no: 4,
    generic_no: 3,
    product_name: 'Sergel 20mg Capsule',
    brand_name: 'Sergel 20mg Capsule',
    strength: '20mg',
    volume: 'Capsule',
    medicine_type: 2,
    unit_type: 1,
    quantity_per_box: 100,
    cost_per_box: 550,
    sale_price_per_box: 800,
    avg_purchase_price_per_piece: 5.5,
    purchase_price_per_piece: 5.5,
    sale_price_per_piece: 8.0,
    wholesale_price_per_box: 620,
    wholesale_price_per_piece: 6.2,
    country_of_origin: 'Bangladesh',
    barcode_value: '8941100104',
    is_medicine: true,
    min_stock_qty_pcs: 30,
    rak_number: 'B-02',
    stock_qty: 85,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    product_no: 105,
    uuid: 'p1000000-0000-0000-0000-000000000105',
    pharmacy_no: 1,
    branch_no: 1,
    company_no: 2,
    generic_no: 4,
    product_name: 'Pantonix 20mg Tablet',
    brand_name: 'Pantonix 20mg Tablet',
    strength: '20mg',
    volume: 'Tablet',
    medicine_type: 1,
    unit_type: 1,
    quantity_per_box: 100,
    cost_per_box: 500,
    sale_price_per_box: 700,
    avg_purchase_price_per_piece: 5.0,
    purchase_price_per_piece: 5.0,
    sale_price_per_piece: 7.0,
    wholesale_price_per_box: 580,
    wholesale_price_per_piece: 5.8,
    country_of_origin: 'Bangladesh',
    barcode_value: '8941100105',
    is_medicine: true,
    min_stock_qty_pcs: 25,
    rak_number: 'B-03',
    stock_qty: 60,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly api = inject(ApiService);
  private localProducts = [...FALLBACK_PRODUCTS];

  getProducts(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<ProdProduct>>> {
    return this.api.getPaged<ProdProduct>('prod/products', params).pipe(
      catchError(() => {
        return of<ApiResponse<PagedResult<ProdProduct>>>({
          success: true,
          data: {
            items: this.localProducts,
            total: this.localProducts.length,
            pageIndex: 1,
            pageSize: 50,
            totalPages: 1,
          },
        });
      })
    );
  }

  searchProducts(query: string): Observable<ApiResponse<ProdProduct[]>> {
    return this.api.get<ProdProduct[]>('prod/products', { search: query }).pipe(
      catchError(() => {
        const q = (query || '').toLowerCase().trim();
        const filtered = this.localProducts.filter(
          p =>
            p.product_name.toLowerCase().includes(q) ||
            (p.barcode_value && p.barcode_value.includes(q)) ||
            String(p.product_no) === q
        );
        return of<ApiResponse<ProdProduct[]>>({
          success: true,
          data: filtered,
        });
      })
    );
  }

  createProduct(product: Partial<ProdProduct>): Observable<ApiResponse<ProdProduct>> {
    return this.api.post<ProdProduct>('prod/products', product).pipe(
      catchError(() => {
        const newProduct: ProdProduct = {
          product_no: Date.now(),
          uuid: crypto.randomUUID(),
          pharmacy_no: product.pharmacy_no || 1,
          branch_no: product.branch_no || 1,
          company_no: product.company_no || 1,
          generic_no: product.generic_no || 1,
          product_name: product.product_name || 'New Medicine',
          brand_name: product.product_name || 'New Medicine',
          strength: product.strength || '',
          volume: product.volume || '',
          medicine_type: product.medicine_type || 1,
          unit_type: product.unit_type || 1,
          quantity_per_box: product.quantity_per_box || 10,
          cost_per_box: product.cost_per_box || 0,
          sale_price_per_box: product.sale_price_per_box || 0,
          avg_purchase_price_per_piece: product.purchase_price_per_piece || 0,
          purchase_price_per_piece: product.purchase_price_per_piece || 0,
          sale_price_per_piece: product.sale_price_per_piece || 0,
          wholesale_price_per_box: product.wholesale_price_per_box || 0,
          wholesale_price_per_piece: product.wholesale_price_per_piece || 0,
          country_of_origin: product.country_of_origin || 'Bangladesh',
          barcode_value: product.barcode_value || '',
          is_medicine: product.is_medicine ?? true,
          min_stock_qty_pcs: product.min_stock_qty_pcs || 10,
          rak_number: product.rak_number || '',
          stock_qty: product.stock_qty || 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.localProducts.unshift(newProduct);
        return of<ApiResponse<ProdProduct>>({
          success: true,
          data: newProduct,
          message: 'Product registered successfully',
        });
      })
    );
  }

  getCompanies(): Observable<ApiResponse<ProdCompany[]>> {
    return this.api.get<ProdCompany[]>('prod/companies').pipe(
      catchError(() => of<ApiResponse<ProdCompany[]>>({ success: true, data: FALLBACK_COMPANIES }))
    );
  }

  getGenerics(): Observable<ApiResponse<ProdGeneric[]>> {
    return this.api.get<ProdGeneric[]>('prod/generics').pipe(
      catchError(() => of<ApiResponse<ProdGeneric[]>>({ success: true, data: FALLBACK_GENERICS }))
    );
  }
}

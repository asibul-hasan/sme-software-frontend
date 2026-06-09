import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SupplierPriceRow {
  supplier_product_no?: number | null;
  supplier_no: number | null;
  supplier_name?: string | null;
  product_no: number | null;
  product_id?: string | null;
  product_name?: string | null;
  variant_no?: number | null;
  uom_no: number | null;
  uom_name?: string | null;
  supplier_sku?: string | null;
  last_price: number;
  discount_pct?: number | null;
  moq?: number | null;
  lead_time_days?: number | null;
  is_preferred?: number | null;
  remarks?: string | null;
  is_active?: number | null;
  row_version?: number | null;
}

const BASE = 'forms/pur1002';

@Injectable()
export class Pur1002DataService {
  private pur = inject(PurDataService);

  rows(supplierNo: number): Observable<ApiResponse<SupplierPriceRow[]>> {
    return this.pur.getList<SupplierPriceRow[]>(`${BASE}/suppliers/${supplierNo}/products`);
  }

  saveRows(supplierNo: number, rows: SupplierPriceRow[]): Observable<ApiResponse<SupplierPriceRow[]>> {
    return this.pur.insert<SupplierPriceRow[]>(`${BASE}/suppliers/${supplierNo}/products`, rows);
  }

  deleteRow(rowNo: number): Observable<ApiResponse<void>> {
    return this.pur.delete<void>(`${BASE}/products`, rowNo);
  }
}

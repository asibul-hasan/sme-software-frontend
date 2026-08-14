import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';

export interface SalOption { no: number; name: string; }

export interface PromoLookups {
  products: SalOption[];
  categories: SalOption[];
  brands: SalOption[];
}

export interface IPromoTarget {
  promotion_dtl_no?: number | null;
  /** 1=Condition (must be bought) 2=Reward (given free). */
  target_role: number;
  product_no?: number | null;
  product_name?: string | null;
  variant_no?: number | null;
  category_no?: number | null;
  brand_no?: number | null;
  qty?: number | null;
}

export interface IPromotion {
  promotion_no?: number | null;
  promotion_id: string;
  promotion_name: string;
  promo_type: number;
  scope_type: number;
  branch_no?: number | null;
  coupon_code?: string | null;
  priority: number;
  is_stackable: number;
  min_qty?: number | null;
  min_amount?: number | null;
  discount_pct?: number | null;
  discount_amount?: number | null;
  buy_qty?: number | null;
  get_qty?: number | null;
  max_discount_amount?: number | null;
  customer_type?: number | null;
  price_tier?: number | null;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  weekday_mask?: number | null;
  usage_limit?: number | null;
  used_count?: number;
  remarks?: string | null;
  is_active?: number | null;
  row_version?: number;
  /** False when the engine does not yet fire this type — the form warns. */
  is_supported?: boolean;
  targets: IPromoTarget[];
}

const BASE = 'forms/sal1104';

@Injectable()
export class Sal1104DataService {
  private sal = inject(SalDataService);

  lookups(): Observable<ApiResponse<PromoLookups>> {
    return this.sal.getList<PromoLookups>(`${BASE}/lookups`);
  }

  list(): Observable<ApiResponse<IPromotion[]>> {
    return this.sal.getList<IPromotion[]>(`${BASE}/promotions`);
  }

  detail(no: number): Observable<ApiResponse<IPromotion>> {
    return this.sal.getList<IPromotion>(`${BASE}/promotions/${no}`);
  }

  save(payload: IPromotion): Observable<ApiResponse<IPromotion>> {
    return this.sal.insert<IPromotion>(`${BASE}/promotions`, payload);
  }

  update(no: number, payload: IPromotion): Observable<ApiResponse<IPromotion>> {
    return this.sal.update<IPromotion>(`${BASE}/promotions`, no, payload);
  }

  remove(no: number): Observable<ApiResponse<void>> {
    return this.sal.delete<void>(`${BASE}/promotions`, no);
  }
}

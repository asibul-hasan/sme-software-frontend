import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import {
  InvStocktake,
  StocktakeCreateRequest,
  StocktakeCountSaveRequest,
  StocktakePostRequest,
  StockIntegrityResult,
  UnreceivedSaleItem,
} from '../models/inventory.models';

@Injectable({
  providedIn: 'root',
})
export class StocktakeService {
  private readonly api = inject(ApiService);

  getStocktakes(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<InvStocktake>>> {
    return this.api.getPaged<InvStocktake>('inv/stocktakes', params);
  }

  getStocktake(stocktakeNo: number): Observable<ApiResponse<InvStocktake>> {
    return this.api.get<InvStocktake>(`inv/stocktakes/${stocktakeNo}`);
  }

  createStocktake(payload: StocktakeCreateRequest): Observable<ApiResponse<InvStocktake>> {
    return this.api.post<InvStocktake>('inv/stocktakes', payload);
  }

  saveCounts(stocktakeNo: number, payload: StocktakeCountSaveRequest): Observable<ApiResponse<InvStocktake>> {
    return this.api.post<InvStocktake>(`inv/stocktakes/${stocktakeNo}/counts`, payload);
  }

  refreshSnapshot(stocktakeNo: number): Observable<ApiResponse<InvStocktake>> {
    return this.api.post<InvStocktake>(`inv/stocktakes/${stocktakeNo}/refresh`, {});
  }

  postStocktake(stocktakeNo: number, payload: StocktakePostRequest): Observable<ApiResponse<any>> {
    return this.api.post<any>(`inv/stocktakes/${stocktakeNo}/post`, payload);
  }

  cancelStocktake(stocktakeNo: number): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>(`inv/stocktakes/${stocktakeNo}/cancel`, {});
  }

  getIntegrityReport(): Observable<ApiResponse<StockIntegrityResult>> {
    return this.api.get<StockIntegrityResult>('inv/integrity');
  }

  getUnreceivedSales(): Observable<ApiResponse<UnreceivedSaleItem[]>> {
    return this.api.get<UnreceivedSaleItem[]>('inv/batches/unreceived-sales');
  }
}

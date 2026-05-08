import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Currency, RateHistory } from './model.service';

/**
 * Form-level HTTP service for SYS1004 – Currency Setup.
 * Owns all endpoint paths and request construction for the Currency form.
 * State and FormGroup live in Sys1004ModelService.
 */
@Injectable()
export class Sys1004DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<any[]>> {
    return this.sysService.getList<any[]>('branch/list');
  }

  loadCurrencies(): Observable<ApiResponse<Currency[]>> {
    return this.sysService.getList<Currency[]>('currency/list');
  }

  loadCurrencyDetail(currencyNo: number): Observable<ApiResponse<Currency>> {
    return this.sysService.getDetails<Currency>('currency/detail', { currency_no: currencyNo });
  }

  loadRateHistory(currencyNo: number): Observable<ApiResponse<RateHistory[]>> {
    return this.sysService.getDetails<RateHistory[]>('currency/rate-history', { currency_no: currencyNo });
  }

  saveCurrency(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.create<any>('currency/create', payload);
  }

  updateCurrency(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.update<any>('currency/update', payload);
  }

  deleteCurrency(currencyNo: number): Observable<ApiResponse<any>> {
    return this.sysService.delete<any>('currency/delete', { currency_no: currencyNo });
  }
}

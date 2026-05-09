import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { Currency, RateHistory } from './model.service';

/**
 * Form-level HTTP service for SYS1004 – Currency Setup.
 * Owns all endpoint paths and request construction for the Currency form.
 * State and FormGroup live in Sys1004ModelService.
 */
@Injectable()
export class Sys1004DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.sysService.getList<IBranch[]>('branch/list');
  }

  loadCurrencies(): Observable<ApiResponse<Currency[]>> {
    return this.sysService.getList<Currency[]>('currency/list');
  }

  loadCurrencyDetail(currencyNo: number): Observable<ApiResponse<Currency>> {
    return this.sysService.getDtl<Currency>('currency', currencyNo);
  }

  loadRateHistory(currencyNo: number): Observable<ApiResponse<RateHistory[]>> {
    return this.sysService.getList<RateHistory[]>('currency/rate-history', { currency_no: currencyNo });
  }

  saveCurrency(payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.insert<unknown>('currency', payload);
  }

  updateCurrency(currencyNo: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.update<unknown>('currency', currencyNo, payload);
  }

  deleteCurrency(currencyNo: number): Observable<ApiResponse<unknown>> {
    return this.sysService.delete<unknown>('currency', currencyNo);
  }
}

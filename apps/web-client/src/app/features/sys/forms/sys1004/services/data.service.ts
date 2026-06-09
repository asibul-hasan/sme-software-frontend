import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { Currency, CurrencyLookup, RateHistory } from './model.service';
import { CommonDataService } from '../../../../../shared/services/common-data.service';

/**
 * Form-level HTTP service for SYS1004 – Currency Setup.
 *
 * Common data (branches) uses the generic SysDataService endpoint.
 * Currency operations use form-specific endpoints:
 *   /api/v1/sys/forms/sys1004/currencies
 */
@Injectable()
export class Sys1004DataService {
  private sysService = inject(SysDataService);
  private commonDataService = inject(CommonDataService);

  /** Branch list (common). GET /api/v1/common/lookups/branches */
  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.commonDataService.getBranchList() as unknown as Observable<ApiResponse<IBranch[]>>;
  }

  /** GET /api/v1/common/lookups/currencies */
  loadCurrencies(): Observable<ApiResponse<CurrencyLookup[]>> {
    return this.commonDataService.getCurrencyList() as unknown as Observable<ApiResponse<CurrencyLookup[]>>;
  }

  /** GET /api/v1/sys/forms/sys1004/currencies/{currencyNo} */
  loadCurrencyDetail(currencyNo: number): Observable<ApiResponse<Currency>> {
    return this.sysService.getDtl<Currency>('forms/sys1004/currencies', currencyNo);
  }

  /** GET /api/v1/sys/forms/sys1004/currencies/rate-history?currency_no=... */
  loadRateHistory(currencyNo: number): Observable<ApiResponse<RateHistory[]>> {
    return this.sysService.getList<RateHistory[]>('forms/sys1004/currencies/rate-history', { currency_no: currencyNo });
  }

  /** POST /api/v1/sys/forms/sys1004/currencies */
  saveCurrency(payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.insert<unknown>('forms/sys1004/currencies', payload);
  }

  /** POST /api/v1/sys/forms/sys1004/currencies (update via same endpoint as insert) */
  updateCurrency(currencyNo: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.insert<unknown>('forms/sys1004/currencies', payload);
  }

  /** DELETE /api/v1/sys/forms/sys1004/currencies/{currencyNo} */
  deleteCurrency(currencyNo: number): Observable<ApiResponse<unknown>> {
    return this.sysService.delete<unknown>('forms/sys1004/currencies', currencyNo);
  }
}

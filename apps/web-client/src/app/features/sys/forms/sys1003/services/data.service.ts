import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { FinancialYear } from './model.service';

/**
 * Form-level HTTP service for SYS1003 – Financial Year Setup.
 * Owns all endpoint paths and request construction for the FY form.
 * State and FormGroup live in Sys1003ModelService.
 */
@Injectable()
export class Sys1003DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.sysService.getList<IBranch[]>('branch/list');
  }

  loadFinancialYears(): Observable<ApiResponse<FinancialYear[]>> {
    return this.sysService.getList<FinancialYear[]>('finyear/list');
  }

  loadFinancialYearDetail(finYearNo: number): Observable<ApiResponse<FinancialYear>> {
    return this.sysService.getDtl<FinancialYear>('finyear', finYearNo);
  }

  saveFinancialYear(payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.insert<unknown>('finyear', payload);
  }

  updateFinancialYear(finYearNo: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.sysService.update<unknown>('finyear', finYearNo, payload);
  }

  deleteFinancialYear(finYearNo: number): Observable<ApiResponse<unknown>> {
    return this.sysService.delete<unknown>('finyear', finYearNo);
  }
}

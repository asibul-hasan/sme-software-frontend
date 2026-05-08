import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { FinancialYear } from './model.service';

/**
 * Form-level HTTP service for SYS1003 – Financial Year Setup.
 * Owns all endpoint paths and request construction for the FY form.
 * State and FormGroup live in Sys1003ModelService.
 */
@Injectable()
export class Sys1003DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<any[]>> {
    return this.sysService.getList<any[]>('branch/list');
  }

  loadFinancialYears(): Observable<ApiResponse<FinancialYear[]>> {
    return this.sysService.getList<FinancialYear[]>('finyear/list');
  }

  loadFinancialYearDetail(finYearNo: number): Observable<ApiResponse<FinancialYear>> {
    return this.sysService.getDetails<FinancialYear>('finyear/detail', { fin_year_no: finYearNo });
  }

  saveFinancialYear(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.create<any>('finyear/create', payload);
  }

  updateFinancialYear(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.update<any>('finyear/update', payload);
  }

  deleteFinancialYear(finYearNo: number): Observable<ApiResponse<any>> {
    return this.sysService.delete<any>('finyear/delete', { fin_year_no: finYearNo });
  }
}

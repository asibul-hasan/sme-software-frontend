import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from '../../sys1002/services/model.service';
import { FinancialYear } from './model.service';
import { CommonDataService } from '../../../../../shared/services/common-data.service';

/**
 * Form-level HTTP service for SYS1003 – Financial Year Setup.
 *
 * Uses the form-specific endpoints:
 *   /api/v1/sys/forms/sys1003/financial-years
 *
 * Branch list uses the generic SysDataService endpoint since sys1003
 * does not expose its own branch list.
 */
@Injectable()
export class Sys1003DataService {
  private sysService = inject(SysDataService);
  private commonDataService = inject(CommonDataService);

  /**
   * Branch list for the dropdown.
   * Uses generic endpoint: GET /api/v1/common/lookups/branches
   */
  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.commonDataService.getBranchList() as unknown as Observable<ApiResponse<IBranch[]>>;
  }

  /**
   * GET /api/v1/sys/forms/sys1003/financial-years
   */
  loadFinancialYears(): Observable<ApiResponse<FinancialYear[]>> {
    return this.sysService.getList<FinancialYear[]>('forms/sys1003/financial-years');
  }

  /**
   * GET /api/v1/sys/forms/sys1003/financial-years/{finYearNo}
   */
  loadFinancialYearDetail(finYearNo: number): Observable<ApiResponse<FinancialYear>> {
    return this.sysService.getDtl<FinancialYear>('forms/sys1003/financial-years', finYearNo);
  }

  /**
   * POST /api/v1/sys/forms/sys1003/financial-years
   * Backend upserts: inserts if fin_year_no is null, updates otherwise.
   */
  saveFinancialYear(payload: object): Observable<ApiResponse<FinancialYear>> {
    return this.sysService.insert<FinancialYear>('forms/sys1003/financial-years', payload);
  }

  /**
   * DELETE /api/v1/sys/forms/sys1003/financial-years/{finYearNo}
   */
  deleteFinancialYear(finYearNo: number): Observable<ApiResponse<unknown>> {
    return this.sysService.delete<unknown>('forms/sys1003/financial-years', finYearNo);
  }
}

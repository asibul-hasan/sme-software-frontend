import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { TaxRule } from './model.service';
import { IBranch } from '../../sys1002/services/model.service';

/**
 * Form-level HTTP service for SYS1005 – VAT / Tax Setup.
 * Owns all endpoint paths and request construction for the Tax form.
 * State and FormGroup live in Sys1005ModelService.
 */
@Injectable()
export class Sys1005DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.sysService.getList<IBranch[]>('branches/list');
  }

  loadTaxRules(): Observable<ApiResponse<TaxRule[]>> {
    return this.sysService.getList<TaxRule[]>('forms/sys1005/vat-taxes');
  }

  loadTaxDetail(taxNo: number): Observable<ApiResponse<TaxRule>> {
    return this.sysService.getDtl<TaxRule>('forms/sys1005/vat-taxes', taxNo);
  }

  saveTaxRule(payload: Partial<TaxRule>): Observable<ApiResponse<TaxRule>> {
    return this.sysService.insert<TaxRule>('forms/sys1005/vat-taxes', payload);
  }

  updateTaxRule(taxNo: number, payload: Partial<TaxRule>): Observable<ApiResponse<TaxRule>> {
    return this.sysService.update<TaxRule>('forms/sys1005/vat-taxes', taxNo, payload);
  }

  deleteTaxRule(taxNo: number): Observable<ApiResponse<Record<string, unknown>>> {
    return this.sysService.delete<Record<string, unknown>>('forms/sys1005/vat-taxes', taxNo);
  }
}

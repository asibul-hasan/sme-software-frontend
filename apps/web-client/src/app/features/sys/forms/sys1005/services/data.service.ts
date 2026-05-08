import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { TaxRule } from './model.service';

/**
 * Form-level HTTP service for SYS1005 – VAT / Tax Setup.
 * Owns all endpoint paths and request construction for the Tax form.
 * State and FormGroup live in Sys1005ModelService.
 */
@Injectable()
export class Sys1005DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<any[]>> {
    return this.sysService.getList<any[]>('branch/list');
  }

  loadTaxRules(): Observable<ApiResponse<TaxRule[]>> {
    return this.sysService.getList<TaxRule[]>('tax/list');
  }

  loadTaxDetail(taxNo: number): Observable<ApiResponse<TaxRule>> {
    return this.sysService.getDetails<TaxRule>('tax/detail', { tax_no: taxNo });
  }

  saveTaxRule(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.create<any>('tax/create', payload);
  }

  updateTaxRule(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.update<any>('tax/update', payload);
  }

  deleteTaxRule(taxNo: number): Observable<ApiResponse<any>> {
    return this.sysService.delete<any>('tax/delete', { tax_no: taxNo });
  }
}

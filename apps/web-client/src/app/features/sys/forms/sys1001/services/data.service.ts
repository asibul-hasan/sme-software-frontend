import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ICompany } from './model.service';

/**
 * Form-level HTTP service for SYS1001 – Company Setup.
 *
 * Updated to use the standardized RESTful 5-API pattern via SysDataService.
 * Resources: companies
 */
@Injectable()
export class Sys1001DataService {
  private sysService = inject(SysDataService);

  getCompanies(): Observable<ApiResponse<ICompany[]>> {
    return this.sysService.getList<ICompany[]>('companies');
  }

  getCompanyDetails(companyNo: number): Observable<ApiResponse<ICompany>> {
    return this.sysService.getDtl<ICompany>('companies', companyNo);
  }

  createCompany(payload: Partial<ICompany>): Observable<ApiResponse<ICompany>> {
    return this.sysService.insert<ICompany>('companies', payload);
  }

  updateCompany(companyNo: number, payload: Partial<ICompany>): Observable<ApiResponse<ICompany>> {
    return this.sysService.update<ICompany>('companies', companyNo, payload);
  }

  deleteCompany(companyNo: number): Observable<ApiResponse<void>> {
    return this.sysService.delete<void>('companies', companyNo);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ICompany } from './model.service';

/**
 * Form-level HTTP service for SYS1001 – Company Setup.
 *
 * Updated to use the standardized RESTful 5-API pattern via CoreDataService.
 * Resources: companies
 */
@Injectable()
export class Sys1001DataService {
  private coreService = inject(CoreDataService);

  getCompanies(): Observable<ApiResponse<ICompany[]>> {
    return this.coreService.getList<ICompany[]>('companies');
  }

  getCompanyDetails(companyNo: number): Observable<ApiResponse<ICompany>> {
    return this.coreService.getDtl<ICompany>('companies', companyNo);
  }

  createCompany(payload: Partial<ICompany>): Observable<ApiResponse<ICompany>> {
    return this.coreService.insert<ICompany>('companies', payload);
  }

  updateCompany(companyNo: number, payload: Partial<ICompany>): Observable<ApiResponse<ICompany>> {
    return this.coreService.update<ICompany>('companies', companyNo, payload);
  }

  deleteCompany(companyNo: number): Observable<ApiResponse<void>> {
    return this.coreService.delete<void>('companies', companyNo);
  }
}

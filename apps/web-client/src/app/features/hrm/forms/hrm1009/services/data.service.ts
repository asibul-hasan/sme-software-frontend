import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { TaxSlabProfile } from './model.service';

@Injectable()
export class Hrm1009DataService {
  private hrService = inject(HrmDataService);

  loadProfiles(): Observable<ApiResponse<TaxSlabProfile[]>> {
    return this.hrService.getList<TaxSlabProfile[]>('forms/hrm1009/tax-slabs');
  }

  loadProfileDetail(taxSlabNo: number): Observable<ApiResponse<TaxSlabProfile>> {
    return this.hrService.getDtl<TaxSlabProfile>('forms/hrm1009/tax-slabs', taxSlabNo);
  }

  saveProfile(payload: Partial<TaxSlabProfile>): Observable<ApiResponse<TaxSlabProfile>> {
    return this.hrService.insert<TaxSlabProfile>('forms/hrm1009/tax-slabs', payload);
  }

  updateProfile(taxSlabNo: number, payload: Partial<TaxSlabProfile>): Observable<ApiResponse<TaxSlabProfile>> {
    return this.hrService.update<TaxSlabProfile>('forms/hrm1009/tax-slabs', taxSlabNo, payload);
  }

  deleteProfile(taxSlabNo: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1009/tax-slabs', taxSlabNo);
  }
}

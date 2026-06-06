import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { SalaryComponent } from './model.service';

/** Form-level HTTP service for HRM_1007 – Salary Component Setup (/api/v1/hrm/forms/hrm1007/components). */
@Injectable()
export class Hrm1007DataService {
  private hrService = inject(HrmDataService);

  loadComponents(): Observable<ApiResponse<SalaryComponent[]>> {
    return this.hrService.getList<SalaryComponent[]>('forms/hrm1007/components');
  }
  loadComponentDetail(no: number): Observable<ApiResponse<SalaryComponent>> {
    return this.hrService.getDtl<SalaryComponent>('forms/hrm1007/components', no);
  }
  saveComponent(payload: Partial<SalaryComponent>): Observable<ApiResponse<SalaryComponent>> {
    return this.hrService.insert<SalaryComponent>('forms/hrm1007/components', payload);
  }
  updateComponent(no: number, payload: Partial<SalaryComponent>): Observable<ApiResponse<SalaryComponent>> {
    return this.hrService.update<SalaryComponent>('forms/hrm1007/components', no, payload);
  }
  deleteComponent(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1007/components', no);
  }
}

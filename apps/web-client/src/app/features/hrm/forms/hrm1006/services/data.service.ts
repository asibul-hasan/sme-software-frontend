import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Holiday } from './model.service';

/** Form-level HTTP service for HRM_1006 – Holiday Calendar (/api/v1/hrm/forms/hrm1006/holidays). */
@Injectable()
export class Hrm1006DataService {
  private hrService = inject(HrmDataService);

  loadHolidays(): Observable<ApiResponse<Holiday[]>> {
    return this.hrService.getList<Holiday[]>('forms/hrm1006/holidays');
  }
  loadHolidayDetail(no: number): Observable<ApiResponse<Holiday>> {
    return this.hrService.getDtl<Holiday>('forms/hrm1006/holidays', no);
  }
  saveHoliday(payload: Partial<Holiday>): Observable<ApiResponse<Holiday>> {
    return this.hrService.insert<Holiday>('forms/hrm1006/holidays', payload);
  }
  updateHoliday(no: number, payload: Partial<Holiday>): Observable<ApiResponse<Holiday>> {
    return this.hrService.update<Holiday>('forms/hrm1006/holidays', no, payload);
  }
  deleteHoliday(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1006/holidays', no);
  }
}

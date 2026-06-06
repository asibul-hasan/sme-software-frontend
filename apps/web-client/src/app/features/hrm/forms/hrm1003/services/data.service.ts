import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Shift } from './model.service';

/** Form-level HTTP service for HRM_1003 – Shift Setup (/api/v1/hrm/forms/hrm1003/shifts). */
@Injectable()
export class Hrm1003DataService {
  private hrService = inject(HrmDataService);

  loadShifts(): Observable<ApiResponse<Shift[]>> {
    return this.hrService.getList<Shift[]>('forms/hrm1003/shifts');
  }
  loadShiftDetail(shiftNo: number): Observable<ApiResponse<Shift>> {
    return this.hrService.getDtl<Shift>('forms/hrm1003/shifts', shiftNo);
  }
  saveShift(payload: Partial<Shift>): Observable<ApiResponse<Shift>> {
    return this.hrService.insert<Shift>('forms/hrm1003/shifts', payload);
  }
  updateShift(shiftNo: number, payload: Partial<Shift>): Observable<ApiResponse<Shift>> {
    return this.hrService.update<Shift>('forms/hrm1003/shifts', shiftNo, payload);
  }
  deleteShift(shiftNo: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1003/shifts', shiftNo);
  }
}

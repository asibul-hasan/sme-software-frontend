import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Adjustment } from './model.service';

export interface ShiftLookup {
  shift_no: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: number;
}

/** Form-level HTTP service for HRM_1103 – Attendance Adjustment (/api/v1/hrm/forms/hrm1103/adjustments). */
@Injectable()
export class Hrm1103DataService {
  private hrService = inject(HrmDataService);

  loadAdjustments(): Observable<ApiResponse<Adjustment[]>> {
    return this.hrService.getList<Adjustment[]>('forms/hrm1103/adjustments');
  }
  loadAdjustmentDetail(no: number): Observable<ApiResponse<Adjustment>> {
    return this.hrService.getDtl<Adjustment>('forms/hrm1103/adjustments', no);
  }
  saveAdjustment(payload: Partial<Adjustment>): Observable<ApiResponse<Adjustment>> {
    return this.hrService.insert<Adjustment>('forms/hrm1103/adjustments', payload);
  }
  updateAdjustment(no: number, payload: Partial<Adjustment>): Observable<ApiResponse<Adjustment>> {
    return this.hrService.update<Adjustment>('forms/hrm1103/adjustments', no, payload);
  }
  deleteAdjustment(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1103/adjustments', no);
  }
  action(no: number, action: 'approve' | 'reject'): Observable<ApiResponse<Adjustment>> {
    return this.hrService.insert<Adjustment>(`forms/hrm1103/adjustments/${no}/${action}`, {});
  }

  loadShifts(): Observable<ApiResponse<ShiftLookup[]>> {
    return this.hrService.getList<ShiftLookup[]>('forms/hrm1003/shifts');
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Overtime } from './model.service';

type OvertimeAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** Form-level HTTP service for HRM_1105 – Overtime (/api/v1/hrm/forms/hrm1105/overtimes). */
@Injectable()
export class Hrm1105DataService {
  private hrService = inject(HrmDataService);

  loadOvertimes(): Observable<ApiResponse<Overtime[]>> {
    return this.hrService.getList<Overtime[]>('forms/hrm1105/overtimes');
  }
  loadOvertimeDetail(no: number): Observable<ApiResponse<Overtime>> {
    return this.hrService.getDtl<Overtime>('forms/hrm1105/overtimes', no);
  }
  saveOvertime(payload: Partial<Overtime>): Observable<ApiResponse<Overtime>> {
    return this.hrService.insert<Overtime>('forms/hrm1105/overtimes', payload);
  }
  updateOvertime(no: number, payload: Partial<Overtime>): Observable<ApiResponse<Overtime>> {
    return this.hrService.update<Overtime>('forms/hrm1105/overtimes', no, payload);
  }
  deleteOvertime(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1105/overtimes', no);
  }
  action(no: number, action: OvertimeAction): Observable<ApiResponse<Overtime>> {
    return this.hrService.insert<Overtime>(`forms/hrm1105/overtimes/${no}/${action}`, {});
  }
}

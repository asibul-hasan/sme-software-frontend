import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { BonusRun } from './model.service';

type RunAction = 'calculate' | 'approve' | 'reject' | 'pay' | 'cancel';

/** Form-level HTTP service for HRM_1205 – Bonus / Festival (/api/v1/hrm/forms/hrm1205/runs). */
@Injectable()
export class Hrm1205DataService {
  private hrService = inject(HrmDataService);

  loadRuns(): Observable<ApiResponse<BonusRun[]>> {
    return this.hrService.getList<BonusRun[]>('forms/hrm1205/runs');
  }
  loadRunDetail(no: number): Observable<ApiResponse<BonusRun>> {
    return this.hrService.getDtl<BonusRun>('forms/hrm1205/runs', no);
  }
  saveRun(payload: Partial<BonusRun>): Observable<ApiResponse<BonusRun>> {
    return this.hrService.insert<BonusRun>('forms/hrm1205/runs', payload);
  }
  updateRun(no: number, payload: Partial<BonusRun>): Observable<ApiResponse<BonusRun>> {
    return this.hrService.update<BonusRun>('forms/hrm1205/runs', no, payload);
  }
  deleteRun(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1205/runs', no);
  }
  action(no: number, action: RunAction): Observable<ApiResponse<BonusRun>> {
    return this.hrService.insert<BonusRun>(`forms/hrm1205/runs/${no}/${action}`, {});
  }
}

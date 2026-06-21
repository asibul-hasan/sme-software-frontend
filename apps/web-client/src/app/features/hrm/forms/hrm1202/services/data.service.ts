import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { BonusRunOption, PayrollRun } from './model.service';

/** Form-level HTTP service for HRM_1202 – Salary Processing (/api/v1/hrm/forms/hrm1202/runs). */
@Injectable()
export class Hrm1202DataService {
  private hrService = inject(HrmDataService);

  loadRuns(): Observable<ApiResponse<PayrollRun[]>> {
    return this.hrService.getList<PayrollRun[]>('forms/hrm1202/runs');
  }
  loadRunDetail(no: number): Observable<ApiResponse<PayrollRun>> {
    return this.hrService.getDtl<PayrollRun>('forms/hrm1202/runs', no);
  }
  loadBonusRuns(): Observable<ApiResponse<BonusRunOption[]>> {
    return this.hrService.getList<BonusRunOption[]>('forms/hrm1205/runs');
  }
  createRun(payload: Partial<PayrollRun>): Observable<ApiResponse<PayrollRun>> {
    return this.hrService.insert<PayrollRun>('forms/hrm1202/runs', payload);
  }
  deleteRun(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1202/runs', no);
  }

  /** Workflow transitions (POST with empty body). */
  action(no: number, action: 'calculate' | 'approve' | 'pay' | 'cancel'): Observable<ApiResponse<PayrollRun>> {
    return this.hrService.insert<PayrollRun>(`forms/hrm1202/runs/${no}/${action}`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { JobRequisition, GradeOption } from './model.service';

type ReqAction = 'submit' | 'approve' | 'reject' | 'hold' | 'resume' | 'close' | 'cancel';

/** Form-level HTTP service for HRM_1401 – Job Requisition (/api/v1/hrm/forms/hrm1401/requisitions). */
@Injectable()
export class Hrm1401DataService {
  private hrService = inject(HrmDataService);

  loadRequisitions(): Observable<ApiResponse<JobRequisition[]>> {
    return this.hrService.getList<JobRequisition[]>('forms/hrm1401/requisitions');
  }
  loadRequisitionDetail(no: number): Observable<ApiResponse<JobRequisition>> {
    return this.hrService.getDtl<JobRequisition>('forms/hrm1401/requisitions', no);
  }
  saveRequisition(payload: Partial<JobRequisition>): Observable<ApiResponse<JobRequisition>> {
    return this.hrService.insert<JobRequisition>('forms/hrm1401/requisitions', payload);
  }
  updateRequisition(no: number, payload: Partial<JobRequisition>): Observable<ApiResponse<JobRequisition>> {
    return this.hrService.update<JobRequisition>('forms/hrm1401/requisitions', no, payload);
  }
  deleteRequisition(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1401/requisitions', no);
  }
  action(no: number, action: ReqAction): Observable<ApiResponse<JobRequisition>> {
    return this.hrService.insert<JobRequisition>(`forms/hrm1401/requisitions/${no}/${action}`, {});
  }

  /** Grades for the line selector (reuses the HRM_1004 list endpoint). */
  loadGrades(): Observable<ApiResponse<GradeOption[]>> {
    return this.hrService.getList<GradeOption[]>('forms/hrm1004/grades');
  }
}

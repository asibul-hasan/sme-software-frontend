import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Candidate, RequisitionOption } from './model.service';

/** Form-level HTTP service for HRM_1402 – Candidate / Application (/api/v1/hrm/forms/hrm1402/candidates). */
@Injectable()
export class Hrm1402DataService {
  private hrService = inject(HrmDataService);

  loadCandidates(): Observable<ApiResponse<Candidate[]>> {
    return this.hrService.getList<Candidate[]>('forms/hrm1402/candidates');
  }
  loadCandidateDetail(no: number): Observable<ApiResponse<Candidate>> {
    return this.hrService.getDtl<Candidate>('forms/hrm1402/candidates', no);
  }
  saveCandidate(payload: Partial<Candidate>): Observable<ApiResponse<Candidate>> {
    return this.hrService.insert<Candidate>('forms/hrm1402/candidates', payload);
  }
  updateCandidate(no: number, payload: Partial<Candidate>): Observable<ApiResponse<Candidate>> {
    return this.hrService.update<Candidate>('forms/hrm1402/candidates', no, payload);
  }
  deleteCandidate(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1402/candidates', no);
  }

  /** Open requisitions for the "applied to" selector (reuses the HRM_1401 list endpoint). */
  loadRequisitions(): Observable<ApiResponse<RequisitionOption[]>> {
    return this.hrService.getList<RequisitionOption[]>('forms/hrm1401/requisitions');
  }
}

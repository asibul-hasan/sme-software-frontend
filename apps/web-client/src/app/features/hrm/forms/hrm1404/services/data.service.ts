import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Offer, OfferLetter, CandidateOption, GradeOption } from './model.service';

type OfferAction = 'send' | 'accept' | 'decline' | 'revoke';

/** Form-level HTTP service for HRM_1404 – Offer & Onboarding (/api/v1/hrm/forms/hrm1404/offers). */
@Injectable()
export class Hrm1404DataService {
  private hrService = inject(HrmDataService);

  loadOffers(): Observable<ApiResponse<Offer[]>> {
    return this.hrService.getList<Offer[]>('forms/hrm1404/offers');
  }
  loadOfferDetail(no: number): Observable<ApiResponse<Offer>> {
    return this.hrService.getDtl<Offer>('forms/hrm1404/offers', no);
  }
  saveOffer(payload: Partial<Offer>): Observable<ApiResponse<Offer>> {
    return this.hrService.insert<Offer>('forms/hrm1404/offers', payload);
  }
  updateOffer(no: number, payload: Partial<Offer>): Observable<ApiResponse<Offer>> {
    return this.hrService.update<Offer>('forms/hrm1404/offers', no, payload);
  }
  deleteOffer(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1404/offers', no);
  }
  action(no: number, action: OfferAction): Observable<ApiResponse<Offer>> {
    return this.hrService.insert<Offer>(`forms/hrm1404/offers/${no}/${action}`, {});
  }
  loadLetter(no: number): Observable<ApiResponse<OfferLetter>> {
    return this.hrService.getList<OfferLetter>(`forms/hrm1404/offers/${no}/letter`);
  }

  // ── Lookups ───────────────────────────────────────────────────────────────
  loadOfferableCandidates(): Observable<ApiResponse<CandidateOption[]>> {
    return this.hrService.getList<CandidateOption[]>('forms/hrm1402/candidates/offerable');
  }
  loadGrades(): Observable<ApiResponse<GradeOption[]>> {
    return this.hrService.getList<GradeOption[]>('forms/hrm1004/grades');
  }
}

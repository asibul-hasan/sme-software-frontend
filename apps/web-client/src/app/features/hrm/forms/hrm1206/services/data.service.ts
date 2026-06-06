import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Loan } from './model.service';

type LoanAction = 'submit' | 'approve' | 'reject' | 'disburse' | 'cancel';

/** Form-level HTTP service for HRM_1206 – Loan / Advance (/api/v1/hrm/forms/hrm1206/loans). */
@Injectable()
export class Hrm1206DataService {
  private hrService = inject(HrmDataService);

  loadLoans(): Observable<ApiResponse<Loan[]>> {
    return this.hrService.getList<Loan[]>('forms/hrm1206/loans');
  }
  loadLoanDetail(no: number): Observable<ApiResponse<Loan>> {
    return this.hrService.getDtl<Loan>('forms/hrm1206/loans', no);
  }
  saveLoan(payload: Partial<Loan>): Observable<ApiResponse<Loan>> {
    return this.hrService.insert<Loan>('forms/hrm1206/loans', payload);
  }
  updateLoan(no: number, payload: Partial<Loan>): Observable<ApiResponse<Loan>> {
    return this.hrService.update<Loan>('forms/hrm1206/loans', no, payload);
  }
  deleteLoan(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1206/loans', no);
  }
  action(no: number, action: LoanAction): Observable<ApiResponse<Loan>> {
    return this.hrService.insert<Loan>(`forms/hrm1206/loans/${no}/${action}`, {});
  }
  recover(no: number, amount: number): Observable<ApiResponse<Loan>> {
    return this.hrService.insert<Loan>(`forms/hrm1206/loans/${no}/recover`, { amount });
  }
}

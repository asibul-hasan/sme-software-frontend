import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { PayslipFull, PayslipLite, RunLite } from './model.service';

/** Form-level HTTP service for HRM_1204 – Payslip Generator (/api/v1/hrm/forms/hrm1204). */
@Injectable()
export class Hrm1204DataService {
  private hrService = inject(HrmDataService);

  loadRuns(): Observable<ApiResponse<RunLite[]>> {
    return this.hrService.getList<RunLite[]>('forms/hrm1204/runs');
  }
  loadPayslips(runNo: number): Observable<ApiResponse<PayslipLite[]>> {
    return this.hrService.getList<PayslipLite[]>('forms/hrm1204/payslips', { runNo });
  }
  loadPayslip(payslipNo: number): Observable<ApiResponse<PayslipFull>> {
    return this.hrService.getDtl<PayslipFull>('forms/hrm1204/payslip', payslipNo);
  }
}

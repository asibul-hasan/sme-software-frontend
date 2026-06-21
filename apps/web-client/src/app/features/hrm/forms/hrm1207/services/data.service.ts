import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Settlement } from './model.service';

type SettlementAction = 'submit' | 'approve' | 'reject' | 'pay' | 'cancel';

/** Form-level HTTP service for HRM_1207 – Final Settlement (/api/v1/hrm/forms/hrm1207/settlements). */
@Injectable()
export class Hrm1207DataService {
  private hrService = inject(HrmDataService);

  loadSettlements(): Observable<ApiResponse<Settlement[]>> {
    return this.hrService.getList<Settlement[]>('forms/hrm1207/settlements');
  }
  loadSettlementDetail(no: number): Observable<ApiResponse<Settlement>> {
    return this.hrService.getDtl<Settlement>('forms/hrm1207/settlements', no);
  }
  previewSettlement(employeeNo: number, lastWorkingDay: string, branchNo?: number | null): Observable<ApiResponse<Settlement>> {
    const params: Record<string, string | number> = { employeeNo, lastWorkingDay };
    if (branchNo != null) params['branchNo'] = branchNo;
    return this.hrService.getList<Settlement>('forms/hrm1207/settlements/preview', params);
  }
  saveSettlement(payload: Partial<Settlement>): Observable<ApiResponse<Settlement>> {
    return this.hrService.insert<Settlement>('forms/hrm1207/settlements', payload);
  }
  updateSettlement(no: number, payload: Partial<Settlement>): Observable<ApiResponse<Settlement>> {
    return this.hrService.update<Settlement>('forms/hrm1207/settlements', no, payload);
  }
  deleteSettlement(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1207/settlements', no);
  }
  action(no: number, action: SettlementAction): Observable<ApiResponse<Settlement>> {
    return this.hrService.insert<Settlement>(`forms/hrm1207/settlements/${no}/${action}`, {});
  }
}

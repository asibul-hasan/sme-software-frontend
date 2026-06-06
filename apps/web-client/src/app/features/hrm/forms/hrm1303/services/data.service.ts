import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { LeaveBalanceRow } from './model.service';

interface LeaveTypeLite { leave_type_no: number; leave_type_name: string; }

/** Form-level HTTP service for HRM_1303 – Leave Balance report (/api/v1/hrm/forms/hrm1303/balances). */
@Injectable()
export class Hrm1303DataService {
  private hrService = inject(HrmDataService);

  loadBalances(year: number): Observable<ApiResponse<LeaveBalanceRow[]>> {
    return this.hrService.getList<LeaveBalanceRow[]>('forms/hrm1303/balances', { year });
  }
  loadLeaveTypes(): Observable<ApiResponse<LeaveTypeLite[]>> {
    return this.hrService.getList<LeaveTypeLite[]>('forms/hrm1005/leave-types');
  }
}

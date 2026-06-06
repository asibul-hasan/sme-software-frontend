import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { LeaveType } from './model.service';

/** Form-level HTTP service for HRM_1005 – Leave Type Setup (/api/v1/hrm/forms/hrm1005/leave-types). */
@Injectable()
export class Hrm1005DataService {
  private hrService = inject(HrmDataService);

  loadLeaveTypes(): Observable<ApiResponse<LeaveType[]>> {
    return this.hrService.getList<LeaveType[]>('forms/hrm1005/leave-types');
  }
  loadLeaveTypeDetail(no: number): Observable<ApiResponse<LeaveType>> {
    return this.hrService.getDtl<LeaveType>('forms/hrm1005/leave-types', no);
  }
  saveLeaveType(payload: Partial<LeaveType>): Observable<ApiResponse<LeaveType>> {
    return this.hrService.insert<LeaveType>('forms/hrm1005/leave-types', payload);
  }
  updateLeaveType(no: number, payload: Partial<LeaveType>): Observable<ApiResponse<LeaveType>> {
    return this.hrService.update<LeaveType>('forms/hrm1005/leave-types', no, payload);
  }
  deleteLeaveType(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1005/leave-types', no);
  }
}

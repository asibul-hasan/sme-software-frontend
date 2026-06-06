import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { AttendanceRow, Punch, SyncResult } from './model.service';

interface ShiftLite { shift_no: number; shift_name: string; shift_id: string; }

/** Form-level HTTP service for HRM_1102 – Device-Sync Attendance (/api/v1/hrm/forms/hrm1102). */
@Injectable()
export class Hrm1102DataService {
  private hrService = inject(HrmDataService);

  sync(branchNo: number | null, punches: Punch[]): Observable<ApiResponse<SyncResult>> {
    return this.hrService.insert<SyncResult>('forms/hrm1102/sync', { branch_no: branchNo, punches });
  }
  loadRecent(): Observable<ApiResponse<AttendanceRow[]>> {
    return this.hrService.getList<AttendanceRow[]>('forms/hrm1102/recent');
  }
  loadShifts(): Observable<ApiResponse<ShiftLite[]>> {
    return this.hrService.getList<ShiftLite[]>('forms/hrm1003/shifts');
  }
}

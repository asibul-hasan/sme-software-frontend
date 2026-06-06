import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Attendance } from './model.service';

/** Form-level HTTP service for HRM_1101 – Manual Attendance (/api/v1/hrm/forms/hrm1101/attendances). */
@Injectable()
export class Hrm1101DataService {
  private hrService = inject(HrmDataService);

  loadAttendances(): Observable<ApiResponse<Attendance[]>> {
    return this.hrService.getList<Attendance[]>('forms/hrm1101/attendances');
  }
  loadAttendanceDetail(no: number): Observable<ApiResponse<Attendance>> {
    return this.hrService.getDtl<Attendance>('forms/hrm1101/attendances', no);
  }
  saveAttendance(payload: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.hrService.insert<Attendance>('forms/hrm1101/attendances', payload);
  }
  updateAttendance(no: number, payload: Partial<Attendance>): Observable<ApiResponse<Attendance>> {
    return this.hrService.update<Attendance>('forms/hrm1101/attendances', no, payload);
  }
  deleteAttendance(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1101/attendances', no);
  }
}

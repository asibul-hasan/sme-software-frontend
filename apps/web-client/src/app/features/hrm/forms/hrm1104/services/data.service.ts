import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Roster } from './model.service';

interface ShiftLite { shift_no: number; shift_name: string; shift_id: string; }

type RosterAction = 'publish' | 'cancel';

/** Form-level HTTP service for HRM_1104 – Shift Roster (/api/v1/hrm/forms/hrm1104/rosters). */
@Injectable()
export class Hrm1104DataService {
  private hrService = inject(HrmDataService);

  loadRosters(): Observable<ApiResponse<Roster[]>> {
    return this.hrService.getList<Roster[]>('forms/hrm1104/rosters');
  }
  loadRosterDetail(no: number): Observable<ApiResponse<Roster>> {
    return this.hrService.getDtl<Roster>('forms/hrm1104/rosters', no);
  }
  saveRoster(payload: Partial<Roster>): Observable<ApiResponse<Roster>> {
    return this.hrService.insert<Roster>('forms/hrm1104/rosters', payload);
  }
  updateRoster(no: number, payload: Partial<Roster>): Observable<ApiResponse<Roster>> {
    return this.hrService.update<Roster>('forms/hrm1104/rosters', no, payload);
  }
  deleteRoster(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1104/rosters', no);
  }
  action(no: number, action: RosterAction): Observable<ApiResponse<Roster>> {
    return this.hrService.insert<Roster>(`forms/hrm1104/rosters/${no}/${action}`, {});
  }
  loadShifts(): Observable<ApiResponse<ShiftLite[]>> {
    return this.hrService.getList<ShiftLite[]>('forms/hrm1003/shifts');
  }
}

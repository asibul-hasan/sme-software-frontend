import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Movement, GradeOption } from './model.service';

type MovementAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** Form-level HTTP service for HRM_1106 – Promotion / Transfer (/api/v1/hrm/forms/hrm1106/movements). */
@Injectable()
export class Hrm1106DataService {
  private hrService = inject(HrmDataService);

  loadMovements(): Observable<ApiResponse<Movement[]>> {
    return this.hrService.getList<Movement[]>('forms/hrm1106/movements');
  }
  loadMovementDetail(no: number): Observable<ApiResponse<Movement>> {
    return this.hrService.getDtl<Movement>('forms/hrm1106/movements', no);
  }
  saveMovement(payload: Partial<Movement>): Observable<ApiResponse<Movement>> {
    return this.hrService.insert<Movement>('forms/hrm1106/movements', payload);
  }
  updateMovement(no: number, payload: Partial<Movement>): Observable<ApiResponse<Movement>> {
    return this.hrService.update<Movement>('forms/hrm1106/movements', no, payload);
  }
  deleteMovement(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1106/movements', no);
  }
  action(no: number, action: MovementAction): Observable<ApiResponse<Movement>> {
    return this.hrService.insert<Movement>(`forms/hrm1106/movements/${no}/${action}`, {});
  }
  loadGrades(): Observable<ApiResponse<GradeOption[]>> {
    return this.hrService.getList<GradeOption[]>('forms/hrm1004/grades');
  }
}

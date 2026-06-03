import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Grade } from './model.service';

/**
 * Form-level HTTP service for HR_1004 – Grade / Pay-Scale Setup.
 * Owns all endpoint paths for the form; state + FormGroup live in Hr1004ModelService.
 * Routes resolve to /api/v1/hr/forms/hr1004/grades (form-wise API).
 */
@Injectable()
export class Hr1004DataService {
  private hrService = inject(HrDataService);

  loadGrades(): Observable<ApiResponse<Grade[]>> {
    return this.hrService.getList<Grade[]>('forms/hr1004/grades');
  }

  loadGradeDetail(gradeNo: number): Observable<ApiResponse<Grade>> {
    return this.hrService.getDtl<Grade>('forms/hr1004/grades', gradeNo);
  }

  saveGrade(payload: Partial<Grade>): Observable<ApiResponse<Grade>> {
    return this.hrService.insert<Grade>('forms/hr1004/grades', payload);
  }

  updateGrade(gradeNo: number, payload: Partial<Grade>): Observable<ApiResponse<Grade>> {
    return this.hrService.update<Grade>('forms/hr1004/grades', gradeNo, payload);
  }

  deleteGrade(gradeNo: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hr1004/grades', gradeNo);
  }
}

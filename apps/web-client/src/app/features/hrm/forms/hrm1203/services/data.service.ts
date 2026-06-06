import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { RunLite, SheetRow } from './model.service';

/** Form-level HTTP service for HRM_1203 – Salary Sheet (/api/v1/hrm/forms/hrm1203). */
@Injectable()
export class Hrm1203DataService {
  private hrService = inject(HrmDataService);

  loadRuns(): Observable<ApiResponse<RunLite[]>> {
    return this.hrService.getList<RunLite[]>('forms/hrm1203/runs');
  }
  loadSheet(runNo: number): Observable<ApiResponse<SheetRow[]>> {
    return this.hrService.getList<SheetRow[]>('forms/hrm1203/sheet', { runNo });
  }
}

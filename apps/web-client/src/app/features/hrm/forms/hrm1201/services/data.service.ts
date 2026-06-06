import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { SalaryStructure, ComponentOption } from './model.service';

/** Form-level HTTP service for HRM_1201 – Salary Structure Setup (/api/v1/hrm/forms/hrm1201/structures). */
@Injectable()
export class Hrm1201DataService {
  private hrService = inject(HrmDataService);

  loadStructures(): Observable<ApiResponse<SalaryStructure[]>> {
    return this.hrService.getList<SalaryStructure[]>('forms/hrm1201/structures');
  }
  loadStructureDetail(no: number): Observable<ApiResponse<SalaryStructure>> {
    return this.hrService.getDtl<SalaryStructure>('forms/hrm1201/structures', no);
  }
  saveStructure(payload: Partial<SalaryStructure>): Observable<ApiResponse<SalaryStructure>> {
    return this.hrService.insert<SalaryStructure>('forms/hrm1201/structures', payload);
  }
  updateStructure(no: number, payload: Partial<SalaryStructure>): Observable<ApiResponse<SalaryStructure>> {
    return this.hrService.update<SalaryStructure>('forms/hrm1201/structures', no, payload);
  }
  deleteStructure(no: number): Observable<ApiResponse<void>> {
    return this.hrService.delete<void>('forms/hrm1201/structures', no);
  }

  /** Salary components for the line selector (reuses the HRM_1007 list endpoint). */
  loadComponents(): Observable<ApiResponse<ComponentOption[]>> {
    return this.hrService.getList<ComponentOption[]>('forms/hrm1007/components');
  }
}

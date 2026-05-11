import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IDepartment, IDesignation } from './model.service';

@Injectable()
export class Hr1002DataService {
  private hrService = inject(HrDataService);

  // ─── Departments ────────────────────────────────────────────────────────────

  loadDepartments(): Observable<ApiResponse<IDepartment[]>> {
    return this.hrService.getDepartments() as Observable<ApiResponse<IDepartment[]>>;
  }

  loadDepartmentDetail(no: number): Observable<ApiResponse<IDepartment>> {
    return this.hrService.getDepartmentDtl(no) as Observable<ApiResponse<IDepartment>>;
  }

  saveDepartment(payload: Partial<IDepartment>): Observable<ApiResponse<IDepartment>> {
    return this.hrService.insertDepartment(payload) as Observable<ApiResponse<IDepartment>>;
  }

  updateDepartment(payload: Partial<IDepartment>): Observable<ApiResponse<IDepartment>> {
    const no = payload.department_no;
    if (!no) throw new Error('department_no is required for update');
    return this.hrService.updateDepartment(no, payload) as Observable<ApiResponse<IDepartment>>;
  }

  deleteDepartment(no: number): Observable<ApiResponse<void>> {
    return this.hrService.deleteDepartment(no);
  }

  // ─── Designations ───────────────────────────────────────────────────────────

  loadDesignations(): Observable<ApiResponse<IDesignation[]>> {
    return this.hrService.getDesignations() as Observable<ApiResponse<IDesignation[]>>;
  }

  loadDesignationDetail(no: number): Observable<ApiResponse<IDesignation>> {
    return this.hrService.getDesignationDtl(no) as Observable<ApiResponse<IDesignation>>;
  }

  saveDesignation(payload: Partial<IDesignation>): Observable<ApiResponse<IDesignation>> {
    return this.hrService.insertDesignation(payload) as Observable<ApiResponse<IDesignation>>;
  }

  updateDesignation(payload: Partial<IDesignation>): Observable<ApiResponse<IDesignation>> {
    const no = payload.designation_no;
    if (!no) throw new Error('designation_no is required for update');
    return this.hrService.updateDesignation(no, payload) as Observable<ApiResponse<IDesignation>>;
  }

  deleteDesignation(no: number): Observable<ApiResponse<void>> {
    return this.hrService.deleteDesignation(no);
  }
}

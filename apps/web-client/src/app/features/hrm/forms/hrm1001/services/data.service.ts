import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { GradeOption, IEmployee } from './model.service';

/**
 * Form-level HTTP service for Hrm1001 – Employee Management.
 */
@Injectable()
export class Hrm1001DataService {
  private hrService = inject(HrmDataService);

  loadEmployees(): Observable<ApiResponse<IEmployee[]>> {
    return this.hrService.getEmployees() as Observable<ApiResponse<IEmployee[]>>;
  }

  loadEmployeeDetail(employeeNo: number): Observable<ApiResponse<IEmployee>> {
    return this.hrService.getEmployeeDtl(employeeNo) as Observable<ApiResponse<IEmployee>>;
  }

  loadGrades(): Observable<ApiResponse<GradeOption[]>> {
    return this.hrService.getList<GradeOption[]>('forms/hrm1004/grades');
  }

  saveEmployee(payload: Partial<IEmployee>): Observable<ApiResponse<IEmployee>> {
    return this.hrService.insertEmployee(payload) as Observable<ApiResponse<IEmployee>>;
  }

  bulkImportEmployees(payload: Partial<IEmployee>[]): Observable<ApiResponse<IEmployee[]>> {
    return this.hrService.insert<IEmployee[]>('employees/bulk', payload);
  }

  updateEmployee(payload: Partial<IEmployee>): Observable<ApiResponse<IEmployee>> {
    const employeeNo = payload.employee_no;
    if (!employeeNo) throw new Error('employee_no is required for update');
    return this.hrService.updateEmployee(employeeNo, payload) as Observable<ApiResponse<IEmployee>>;
  }

  deleteEmployee(employeeNo: number): Observable<ApiResponse<void>> {
    return this.hrService.deleteEmployee(employeeNo);
  }
}

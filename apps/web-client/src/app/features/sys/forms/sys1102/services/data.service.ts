import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IRole } from './model.service';

/**
 * Form-level HTTP service for SYS1102 – Role Management.
 */
@Injectable()
export class Sys1102DataService {
  private coreService = inject(CoreDataService);

  loadRoles(): Observable<ApiResponse<IRole[]>> {
    return this.coreService.getRoles() as Observable<ApiResponse<IRole[]>>;
  }

  loadRoleDetail(roleNo: number): Observable<ApiResponse<IRole>> {
    return this.coreService.getRoleDtl(roleNo) as Observable<ApiResponse<IRole>>;
  }

  saveRole(payload: Partial<IRole>): Observable<ApiResponse<IRole>> {
    return this.coreService.insertRole(payload) as Observable<ApiResponse<IRole>>;
  }

  updateRole(payload: Partial<IRole>): Observable<ApiResponse<IRole>> {
    const roleNo = payload.role_no;
    if (!roleNo) throw new Error('role_no is required for update');
    return this.coreService.updateRole(roleNo, payload) as Observable<ApiResponse<IRole>>;
  }

  deleteRole(roleNo: number): Observable<ApiResponse<void>> {
    return this.coreService.deleteRole(roleNo);
  }
}

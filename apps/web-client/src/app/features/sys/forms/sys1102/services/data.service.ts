import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IRole, IBranchLookup } from './model.service';
import { CommonDataService } from '../../../../../shared/services/common-data.service';

/**
 * Form-level HTTP service for SYS1102 – Role Management.
 */
@Injectable()
export class Sys1102DataService {
  private sysService = inject(SysDataService);
  private commonDataService = inject(CommonDataService);

  loadRoles(): Observable<ApiResponse<IRole[]>> {
    return this.sysService.getRoleLookupList() as Observable<ApiResponse<IRole[]>>;
  }

  loadBranches(): Observable<ApiResponse<IBranchLookup[]>> {
    return this.commonDataService.getBranchList() as unknown as Observable<ApiResponse<IBranchLookup[]>>;
  }

  loadRoleDetail(roleNo: number): Observable<ApiResponse<IRole>> {
    return this.sysService.getRoleDtl(roleNo) as Observable<ApiResponse<IRole>>;
  }

  saveRole(payload: Partial<IRole>): Observable<ApiResponse<IRole>> {
    return this.sysService.insertRole(payload) as Observable<ApiResponse<IRole>>;
  }

  updateRole(payload: Partial<IRole>): Observable<ApiResponse<IRole>> {
    const roleNo = payload.role_no;
    if (!roleNo) throw new Error('role_no is required for update');
    return this.sysService.updateRole(roleNo, payload) as Observable<ApiResponse<IRole>>;
  }

  deleteRole(roleNo: number): Observable<ApiResponse<void>> {
    return this.sysService.deleteRole(roleNo);
  }
}

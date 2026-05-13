import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from './model.service';

/**
 * Form-level HTTP service for SYS1002 – Branch Setup.
 *
 * Updated to use the standardized RESTful 5-API pattern:
 * - list:   GET /api/v1/sys/branches
 * - detail: GET /api/v1/sys/branches/{no}
 * - insert: POST /api/v1/sys/branches
 * - update: PUT /api/v1/sys/branches/{no}
 * - delete: DELETE /api/v1/sys/branches/{no}
 */
@Injectable()
export class Sys1002DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.sysService.getList<IBranch[]>('branches');
  }

  loadBranchDetail(branchNo: number): Observable<ApiResponse<IBranch>> {
    return this.sysService.getDtl<IBranch>('branches', branchNo);
  }

  saveBranch(payload: Partial<IBranch>): Observable<ApiResponse<IBranch>> {
    return this.sysService.insert<IBranch>('branches', payload);
  }

  updateBranch(payload: Partial<IBranch>): Observable<ApiResponse<IBranch>> {
    const branchNo = payload.branch_no;
    if (!branchNo) throw new Error('branch_no is required for update');
    return this.sysService.update<IBranch>('branches', branchNo, payload);
  }

  deleteBranch(branchNo: number): Observable<ApiResponse<Record<string, unknown>>> {
    return this.sysService.delete<Record<string, unknown>>('branches', branchNo);
  }
}

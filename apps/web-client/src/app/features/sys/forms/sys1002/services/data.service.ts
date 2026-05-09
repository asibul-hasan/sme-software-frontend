import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBranch } from './model.service';

/**
 * Form-level HTTP service for SYS1002 – Branch Setup.
 *
 * Updated to use the standardized RESTful 5-API pattern:
 * - list:   GET /api/v1/branches
 * - detail: GET /api/v1/branches/{no}
 * - insert: POST /api/v1/branches
 * - update: PUT /api/v1/branches/{no}
 * - delete: DELETE /api/v1/branches/{no}
 */
@Injectable()
export class Sys1002DataService {
  private coreService = inject(CoreDataService);

  loadBranches(): Observable<ApiResponse<IBranch[]>> {
    return this.coreService.getList<IBranch[]>('branches');
  }

  loadBranchDetail(branchNo: number): Observable<ApiResponse<IBranch>> {
    return this.coreService.getDtl<IBranch>('branches', branchNo);
  }

  saveBranch(payload: Partial<IBranch>): Observable<ApiResponse<IBranch>> {
    return this.coreService.insert<IBranch>('branches', payload);
  }

  updateBranch(payload: Partial<IBranch>): Observable<ApiResponse<IBranch>> {
    const branchNo = payload.branch_no;
    if (!branchNo) throw new Error('branch_no is required for update');
    return this.coreService.update<IBranch>('branches', branchNo, payload);
  }

  deleteBranch(branchNo: number): Observable<ApiResponse<Record<string, unknown>>> {
    return this.coreService.delete<Record<string, unknown>>('branches', branchNo);
  }
}

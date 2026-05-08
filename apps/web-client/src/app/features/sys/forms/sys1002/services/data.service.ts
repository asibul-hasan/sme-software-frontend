import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Branch } from './model.service';

/**
 * Form-level HTTP service for SYS1002 – Branch Setup.
 *
 * Delegates all network calls to SysDataService and is responsible
 * ONLY for constructing the correct endpoint paths and payloads.
 * State management lives in Sys1002ModelService.
 */
@Injectable()
export class Sys1002DataService {
  private sysService = inject(SysDataService);

  loadBranches(): Observable<ApiResponse<Branch[]>> {
    return this.sysService.getList<Branch[]>('branch/list');
  }

  loadBranchDetail(branchNo: number): Observable<ApiResponse<Branch>> {
    return this.sysService.getDetails<Branch>('branch/detail', { branch_no: branchNo });
  }

  saveBranch(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.create<any>('branch/create', payload);
  }

  updateBranch(payload: object): Observable<ApiResponse<any>> {
    return this.sysService.update<any>('branch/update', payload);
  }

  deleteBranch(branchNo: number): Observable<ApiResponse<any>> {
    return this.sysService.delete<any>('branch/delete', { branch_no: branchNo });
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../../core/services/base-data.service';
import { ApiResponse } from '../../../core/models/response.model';

/**
 * HTTP gateway for the HR module (/api/v1/hr/...).
 *
 * Generic CRUD (getList, getDetails, create, update, delete) is
 * inherited from BaseDataService.
 *
 * HR-domain methods previously scattered in SysDataService are
 * consolidated here.
 */
@Injectable({
  providedIn: 'root',
})
export class HrDataService extends BaseDataService {
  protected override readonly modulePath = 'hr';

  // ─── Designation ────────────────────────────────────────────────────────────

  getDesignations(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('settings/designation');
  }

  createDesignation(data: object): Observable<ApiResponse<any>> {
    return this.create<any>('settings/designation', data);
  }

  updateDesignation(id: number, data: object): Observable<ApiResponse<any>> {
    return this.update<any>(`settings/designation/${id}`, data);
  }

  deleteDesignation(id: number): Observable<ApiResponse<any>> {
    return this.delete<any>(`settings/designation/${id}`, {});
  }

  // ─── Role / Permission ───────────────────────────────────────────────────────

  getPermissions(designationId: number): Observable<ApiResponse<any>> {
    return this.getList<any>(`settings/permission/${designationId}`);
  }

  updatePermissions(designationId: number, permissions: object): Observable<ApiResponse<any>> {
    return this.update<any>(`settings/permission/${designationId}`, permissions);
  }

  // ─── Module Toggle ───────────────────────────────────────────────────────────

  getModules(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('settings/module-toggle');
  }

  toggleModule(moduleId: string, enabled: boolean): Observable<ApiResponse<any>> {
    return this.create<any>('settings/module-toggle/toggle', { moduleId, enabled });
  }
}

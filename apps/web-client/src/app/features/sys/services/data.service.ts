import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../../core/services/base-data.service';
import { ApiResponse } from '../../../core/models/response.model';

/**
 * HTTP gateway for the SYS module (/api/v1/sys/...).
 *
 * Updated to use the standardized RESTful 5-API pattern via BaseDataService.
 * Resources: menus, modules, submodules.
 */
@Injectable({
  providedIn: 'root',
})
export class SysDataService extends BaseDataService {
  protected override readonly modulePath = 'sys';

  // ─── Menus ──────────────────────────────────────────────────────────────────

  getMenus(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('menus');
  }

  getMenuDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('menus', no);
  }

  insertMenu(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('menus', payload);
  }

  updateMenu(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('menus', no, payload);
  }

  deleteMenu(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('menus', no);
  }

  // ─── Modules ───────────────────────────────────────────────────────────────

  getModules(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('modules');
  }

  getModuleDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('modules', no);
  }

  insertModule(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('modules', payload);
  }

  updateModule(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('modules', no, payload);
  }

  deleteModule(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('modules', no);
  }

  // ─── Submodules ────────────────────────────────────────────────────────────

  getSubmodules(): Observable<ApiResponse<unknown[]>> {
    return this.getList<unknown[]>('submodules');
  }

  getSubmoduleDtl(no: number): Observable<ApiResponse<unknown>> {
    return this.getDtl<unknown>('submodules', no);
  }

  insertSubmodule(payload: object): Observable<ApiResponse<unknown>> {
    return this.insert<unknown>('submodules', payload);
  }

  updateSubmodule(no: number, payload: object): Observable<ApiResponse<unknown>> {
    return this.update<unknown>('submodules', no, payload);
  }

  deleteSubmodule(no: number): Observable<ApiResponse<void>> {
    return this.delete<void>('submodules', no);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';
import { ApiResponse } from '../../../core/models/response.model';

@Injectable({
  providedIn: 'root',
})
export class SysDataService {
  private get apiUrl() {
    return `${this.config.apiUrl}/sys`;
  }

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
  ) {}

  // Generic CRUD Methods
  getList<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`);
  }

  getDetails<T>(path: string, params: any): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`, { params });
  }

  create<T>(path: string, payload: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload);
  }

  update<T>(path: string, payload: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload);
  }

  delete<T>(path: string, params: any): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}/${path}`, {
      params,
    });
  }

  // Specific Methods (if any)
  getDesignations(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('settings/designation');
  }

  createDesignation(data: any): Observable<ApiResponse<any>> {
    return this.create<any>('settings/designation', data);
  }

  updateDesignation(id: number, data: any): Observable<ApiResponse<any>> {
    return this.update<any>(`settings/designation/${id}`, data);
  }

  deleteDesignation(id: number): Observable<ApiResponse<any>> {
    return this.delete<any>(`settings/designation/${id}`, {});
  }

  getPermissions(designationId: number): Observable<ApiResponse<any>> {
    return this.getList<any>(`settings/permission/${designationId}`);
  }

  updatePermissions(
    designationId: number,
    permissions: any,
  ): Observable<ApiResponse<any>> {
    return this.update<any>(
      `settings/permission/${designationId}`,
      permissions,
    );
  }

  getModules(): Observable<ApiResponse<any[]>> {
    return this.getList<any[]>('settings/module-toggle');
  }

  toggleModule(
    moduleId: string,
    enabled: boolean,
  ): Observable<ApiResponse<any>> {
    return this.create<any>('settings/module-toggle/toggle', {
      moduleId,
      enabled,
    });
  }
}

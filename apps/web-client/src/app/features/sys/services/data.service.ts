import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class SysDataService {
  private get apiUrl() { return `${this.config.apiUrl}/sys`; }

  constructor(private http: HttpClient, private config: AppConfigService) { }

  // Generic CRUD Methods
  getList<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${path}`);
  }

  getDetails<T>(path: string, params: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${path}`, { params });
  }

  create<T>(path: string, payload: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${path}`, payload);
  }

  update<T>(path: string, payload: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${path}`, payload);
  }

  delete<T>(path: string, params: any): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${path}`, { params });
  }

  // Specific Methods (if any)
  getDesignations(): Observable<any[]> {
    return this.getList<any[]>('settings/designation');
  }

  createDesignation(data: any): Observable<any> {
    return this.create<any>('settings/designation', data);
  }

  updateDesignation(id: number, data: any): Observable<any> {
    return this.update<any>(`settings/designation/${id}`, data);
  }

  deleteDesignation(id: number): Observable<any> {
    return this.delete<any>(`settings/designation/${id}`, {});
  }

  getPermissions(designationId: number): Observable<any> {
    return this.getList<any>(`settings/permission/${designationId}`);
  }

  updatePermissions(designationId: number, permissions: any): Observable<any> {
    return this.update<any>(`settings/permission/${designationId}`, permissions);
  }

  getModules(): Observable<any[]> {
    return this.getList<any[]>('settings/module-toggle');
  }

  toggleModule(moduleId: string, enabled: boolean): Observable<any> {
    return this.create<any>('settings/module-toggle/toggle', { moduleId, enabled });
  }
}

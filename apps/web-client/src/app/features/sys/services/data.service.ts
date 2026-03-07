import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SettingsDataService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) { }

  // Roles/Designations API
  getDesignations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/designation`);
  }

  createDesignation(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/designation`, data);
  }

  updateDesignation(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/designation/${id}`, data);
  }

  deleteDesignation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/designation/${id}`);
  }

  // Permissions API
  getPermissions(designationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permission/${designationId}`);
  }

  updatePermissions(designationId: number, permissions: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/permission/${designationId}`, permissions);
  }

  // Module Toggles API
  getModules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/module-toggle`);
  }

  toggleModule(moduleId: string, enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/module-toggle/toggle`, { moduleId, enabled });
  }
}

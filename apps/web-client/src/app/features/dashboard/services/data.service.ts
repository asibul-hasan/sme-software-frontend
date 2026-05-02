import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private get apiUrl() { return `${this.config.apiUrl}/dashboard`; }

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
}

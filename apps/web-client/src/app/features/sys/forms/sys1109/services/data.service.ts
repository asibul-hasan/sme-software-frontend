import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { SessionRow, LoginAttemptRow } from './model.service';

@Injectable()
export class Sys1109DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1109`;

  getSessions(limit = 200): Observable<ApiResponse<SessionRow[]>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ApiResponse<SessionRow[]>>(`${this.baseUrl}/sessions`, { params });
  }

  getLoginAttempts(limit = 200): Observable<ApiResponse<LoginAttemptRow[]>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<ApiResponse<LoginAttemptRow[]>>(`${this.baseUrl}/login-attempts`, { params });
  }

  revokeSession(sessionNo: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/sessions/${sessionNo}/revoke`, {});
  }
}

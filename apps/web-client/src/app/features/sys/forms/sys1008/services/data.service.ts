import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ISetting } from './model.service';

@Injectable()
export class Sys1008DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1008`;

  getList(): Observable<ApiResponse<ISetting[]>> {
    return this.http.get<ApiResponse<ISetting[]>>(`${this.baseUrl}/settings`);
  }
  save(payload: Partial<ISetting>): Observable<ApiResponse<ISetting>> {
    return this.http.post<ApiResponse<ISetting>>(`${this.baseUrl}/settings`, payload);
  }
  delete(settingNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/settings/${settingNo}`);
  }
}

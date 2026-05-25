import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { AuditLogRow, AuditLogFilter } from './model.service';

@Injectable()
export class Sys1105DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1105`;

  search(filter: AuditLogFilter): Observable<ApiResponse<AuditLogRow[]>> {
    let params = new HttpParams();
    if (filter.table_name)  params = params.set('table_name', filter.table_name);
    if (filter.action_type) params = params.set('action_type', filter.action_type);
    if (filter.user_no != null) params = params.set('user_no', String(filter.user_no));
    if (filter.from_at)     params = params.set('from_at', filter.from_at);
    if (filter.to_at)       params = params.set('to_at', filter.to_at);
    if (filter.limit != null) params = params.set('limit', String(filter.limit));
    return this.http.get<ApiResponse<AuditLogRow[]>>(`${this.baseUrl}/logs`, { params });
  }
}

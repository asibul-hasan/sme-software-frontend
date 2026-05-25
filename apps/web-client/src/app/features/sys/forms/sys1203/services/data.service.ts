import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { FileMeta } from './model.service';

@Injectable()
export class Sys1203DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1203`;

  getFiles(entityType?: number | null, entityNo?: number | null): Observable<ApiResponse<FileMeta[]>> {
    let params = new HttpParams();
    if (entityType != null) params = params.set('entity_type', String(entityType));
    if (entityNo != null) params = params.set('entity_no', String(entityNo));
    return this.http.get<ApiResponse<FileMeta[]>>(`${this.baseUrl}/files`, { params });
  }

  upload(form: FormData): Observable<ApiResponse<FileMeta>> {
    return this.http.post<ApiResponse<FileMeta>>(`${this.baseUrl}/files`, form);
  }

  /** Auth-aware content fetch (the JWT interceptor adds the bearer token). */
  getContent(fileNo: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/files/${fileNo}/content`, { responseType: 'blob' });
  }

  delete(fileNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/files/${fileNo}`);
  }
}

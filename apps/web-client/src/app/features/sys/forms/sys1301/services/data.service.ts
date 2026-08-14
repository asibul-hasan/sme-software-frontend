import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import {
  IIdGeneratorRow,
  ISys1301MenuOption,
  ISys1301PreviewRequest,
  ISys1301PreviewResponse,
  ISysLookupOption,
} from './model.service';

/**
 * HTTP layer for SYS_1301 ID Generator.
 *
 * Every endpoint lives under `/sys/forms/sys1301/*` — per the "form-wise API"
 * rule, forms never call generic CRUD.
 */
@Injectable()
export class Sys1301DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1301`;

  getList(menuNo?: number | null): Observable<ApiResponse<IIdGeneratorRow[]>> {
    let params = new HttpParams();
    if (menuNo != null) params = params.set('menu_no', menuNo);
    return this.http.get<ApiResponse<IIdGeneratorRow[]>>(`${this.baseUrl}/configs`, { params });
  }

  getMenuOptions(): Observable<ApiResponse<ISys1301MenuOption[]>> {
    return this.http.get<ApiResponse<ISys1301MenuOption[]>>(`${this.baseUrl}/menu-options`);
  }

  getFinYearOptions(): Observable<ApiResponse<ISysLookupOption[]>> {
    return this.http.get<ApiResponse<ISysLookupOption[]>>(`${this.baseUrl}/fin-year-options`);
  }

  getSupportedTokens(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.baseUrl}/tokens`);
  }

  preview(req: ISys1301PreviewRequest): Observable<ApiResponse<ISys1301PreviewResponse>> {
    return this.http.post<ApiResponse<ISys1301PreviewResponse>>(`${this.baseUrl}/preview`, req);
  }

  save(dto: Partial<IIdGeneratorRow>): Observable<ApiResponse<IIdGeneratorRow>> {
    return this.http.post<ApiResponse<IIdGeneratorRow>>(`${this.baseUrl}/configs`, dto);
  }

  delete(docSequenceNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/configs/${docSequenceNo}`);
  }
}

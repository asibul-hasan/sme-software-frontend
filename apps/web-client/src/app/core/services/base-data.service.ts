import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse } from '../models/response.model';

/**
 * Abstract base for all module-level data services.
 *
 * This service provides the standardized 5-API CRUD pattern:
 * - getList: GET /api/v1/{resource}
 * - getDtl:  GET /api/v1/{resource}/{no}
 * - insert:  POST /api/v1/{resource}
 * - update:  PUT /api/v1/{resource}/{no}
 * - delete:  DELETE /api/v1/{resource}/{no}
 */
export abstract class BaseDataService {
  /** 
   * Optional module prefix, e.g. 'sys' or 'hr'. 
   * If set, URLs will be /api/v1/{modulePath}/{resource}.
   */
  protected abstract readonly modulePath: string;

  protected readonly http   = inject(HttpClient);
  protected readonly config = inject(AppConfigService);

  protected get baseUrl(): string {
    const prefix = this.modulePath ? `/${this.modulePath}` : '';
    return `${this.config.apiUrl}${prefix}`;
  }

  // ─── Standardized 5-API CRUD ───────────────────────────────────────────────

  /**
   * Fetches a list of active records.
   * GET /api/v1/[module]/resource
   */
  getList<T>(resource: string, params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${resource}`, { params });
  }

  /**
   * Fetches a single record by its primary key (_no).
   * GET /api/v1/[module]/resource/{no}
   */
  getDtl<T>(resource: string, no: number | string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${resource}/${no}`);
  }

  /**
   * Inserts a new record.
   * POST /api/v1/[module]/resource
   */
  insert<T>(resource: string, payload: object): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${resource}`, payload);
  }

  /**
   * Updates an existing record.
   * PUT /api/v1/[module]/resource/{no}
   */
  update<T>(resource: string, no: number | string, payload: object): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${resource}/${no}`, payload);
  }

  /**
   * Soft-deletes a record.
   * DELETE /api/v1/[module]/resource/{no}
   */
  delete<T>(resource: string, no: number | string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${resource}/${no}`);
  }
}

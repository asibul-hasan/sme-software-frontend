import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/error.interceptor';

export interface RequestOptions {
  params?: Record<string, unknown>;
  silent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  get<T>(endpoint: string, paramsOrOptions?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<T>> {
    let params: Record<string, unknown> | undefined;
    let silent = false;

    if (paramsOrOptions && ('silent' in paramsOrOptions || 'params' in paramsOrOptions)) {
      const opts = paramsOrOptions as RequestOptions;
      params = opts.params;
      silent = !!opts.silent;
    } else {
      params = paramsOrOptions as Record<string, unknown> | undefined;
    }

    const httpParams = this.buildParams(params);
    const context = silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, { params: httpParams, context });
  }

  getPaged<T>(endpoint: string, paramsOrOptions?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<T>>> {
    let params: Record<string, unknown> | undefined;
    let silent = false;

    if (paramsOrOptions && ('silent' in paramsOrOptions || 'params' in paramsOrOptions)) {
      const opts = paramsOrOptions as RequestOptions;
      params = opts.params;
      silent = !!opts.silent;
    } else {
      params = paramsOrOptions as Record<string, unknown> | undefined;
    }

    const httpParams = this.buildParams(params);
    const context = silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.get<ApiResponse<PagedResult<T>>>(`${this.baseUrl}/${endpoint}`, { params: httpParams, context });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    const context = options?.silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body, { context });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    const context = options?.silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body, { context });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    const context = options?.silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, { context });
  }

  private buildParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }
}

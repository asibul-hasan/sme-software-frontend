import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SKIP_ERROR_NOTIFICATION } from '../interceptors/error.interceptor';

import { BackendDiscoveryService } from './backend-discovery.service';

export interface RequestOptions {
  params?: Record<string, unknown>;
  silent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly discovery = inject(BackendDiscoveryService);

  /**
   * Dynamic API base URL (switches automatically between localhost and Hugging Face live)
   */
  get baseUrl(): string {
    return this.discovery.currentApiBase();
  }

  private buildUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

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
    return this.http.get<ApiResponse<T>>(this.buildUrl(endpoint), { params: httpParams, context });
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
    return this.http.get<ApiResponse<PagedResult<T>>>(this.buildUrl(endpoint), { params: httpParams, context });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    const context = options?.silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.post<ApiResponse<T>>(this.buildUrl(endpoint), body, { context });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    const context = options?.silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.put<ApiResponse<T>>(this.buildUrl(endpoint), body, { context });
  }

  delete<T>(endpoint: string, bodyOrOptions?: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    let body: unknown = undefined;
    let silent = false;
    if (bodyOrOptions && typeof bodyOrOptions === 'object' && ('silent' in (bodyOrOptions as object) || 'params' in (bodyOrOptions as object))) {
      silent = !!(bodyOrOptions as RequestOptions).silent;
    } else {
      body = bodyOrOptions;
      silent = !!options?.silent;
    }
    const context = silent ? new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) : undefined;
    return this.http.delete<ApiResponse<T>>(this.buildUrl(endpoint), { body, context });
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

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse } from '../models/response.model';

/**
 * Abstract base for all module-level data services.
 *
 * Subclasses must declare `modulePath` (e.g. 'sys', 'hr', 'fin').
 * The five generic CRUD methods are implemented once here and
 * reused by every module — never duplicated.
 *
 * Usage:
 *   @Injectable({ providedIn: 'root' })
 *   export class SysDataService extends BaseDataService {
 *     protected override readonly modulePath = 'sys';
 *   }
 */
export abstract class BaseDataService {
  /** Module URL segment, e.g. 'sys' → '/api/v1/sys' */
  protected abstract readonly modulePath: string;

  protected readonly http   = inject(HttpClient);
  protected readonly config = inject(AppConfigService);

  protected get apiUrl(): string {
    return `${this.config.apiUrl}/${this.modulePath}`;
  }

  // ─── Generic CRUD ───────────────────────────────────────────────────────────

  getList<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`);
  }

  getDetails<T>(path: string, params: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${path}`, { params });
  }

  create<T>(path: string, payload: object): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload);
  }

  update<T>(path: string, payload: object): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}/${path}`, payload);
  }

  delete<T>(path: string, params: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}/${path}`, { params });
  }
}

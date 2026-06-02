import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { ApiResponse } from '../models/response.model';

/**
 * Metadata returned by every file operation.
 * {@code serve_path} is the relative URL to fetch the bytes via {@link fetchAsObjectUrl}.
 */
export interface SysFileDto {
  file_no:           number;
  entity_type:       number;
  entity_type_label: string;
  entity_no:         number | null;
  file_name:         string;
  content_type:      string;
  file_extension:    string | null;
  file_size:         number;
  is_primary:        number;
  width_px:          number | null;
  height_px:         number | null;
  serve_path:        string;   // e.g. "/api/v1/sys/files/42/content"
  created_at:        string;
  row_version:       number;
}

/**
 * Reusable service for the core file API  {@code /api/v1/sys/files}.
 * Inject {@code providedIn: 'root'} — any form can use it without local providers.
 *
 * ALL requests go through Angular's {@code HttpClient}.  The auth interceptor adds the
 * JWT automatically, ensuring every file operation is scoped to the authenticated company.
 *
 * Entity type codes (matches backend SysFile.entity_type):
 *   1 = CompanyLogo | 2 = EmpPhoto | 3 = EmpSign | 4 = UserAvatar
 *   5 = ProductImage | 6 = BranchLogo | 7 = Document | 8 = Other
 */
@Injectable({ providedIn: 'root' })
export class CoreFileApiService {
  private http   = inject(HttpClient);
  private config = inject(AppConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/sys/files`;
  }

  /**
   * Upload a new file for an entity.
   * Use {@link replace} for single-slot entities (logo, photo) where old must be removed first.
   */
  upload(
    entityType: number,
    entityNo: number | null,
    file: File,
    isPrimary = 1,
  ): Observable<ApiResponse<SysFileDto>> {
    const form = new FormData();
    form.append('file', file);
    form.append('entity_type', String(entityType));
    if (entityNo != null) form.append('entity_no', String(entityNo));
    form.append('is_primary', String(isPrimary));
    return this.http.post<ApiResponse<SysFileDto>>(this.baseUrl, form);
  }

  /**
   * Atomically replace the primary file for an entity.
   * The server soft-deletes every existing file for (companyNo, entityType, entityNo)
   * then saves the new one.  Use for company logo, employee photo, branch logo, etc.
   */
  replace(
    entityType: number,
    entityNo: number | null,
    file: File,
  ): Observable<ApiResponse<SysFileDto>> {
    const form = new FormData();
    form.append('file', file);
    form.append('entity_type', String(entityType));
    if (entityNo != null) form.append('entity_no', String(entityNo));
    return this.http.post<ApiResponse<SysFileDto>>(`${this.baseUrl}/replace`, form);
  }

  /** Soft-delete a file. Company scope is enforced server-side via JWT. */
  delete(fileNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${fileNo}`);
  }

  /** List file metadata for an entity. Bytes are never included in the response. */
  list(entityType: number, entityNo?: number): Observable<ApiResponse<SysFileDto[]>> {
    let url = `${this.baseUrl}?entity_type=${entityType}`;
    if (entityNo != null) url += `&entity_no=${entityNo}`;
    return this.http.get<ApiResponse<SysFileDto[]>>(url);
  }

  /**
   * Fetch file bytes via {@code HttpClient} (JWT is sent automatically) and return
   * a temporary object URL safe to use in {@code <img [src]>}.
   *
   * IMPORTANT — the caller must revoke the previous URL when replacing or removing
   * to avoid memory leaks:
   * ```ts
   * const old = this.logoPreview();
   * if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
   * this.logoPreview.set(newUrl);
   * ```
   * Prefer {@link fetchAsBlob} when you need to persist the data (e.g. base64 to sessionStorage).
   */
  fetchAsObjectUrl(servePath: string): Observable<string> {
    const url = this.toAbsoluteUrl(servePath);
    return this.http
      .get(url, { responseType: 'blob' })
      .pipe(map(blob => URL.createObjectURL(blob)));
  }

  /**
   * Fetch file bytes and return the raw {@code Blob}.
   * Use this when you need to convert to a base64 data-URL for persistent caching
   * (e.g. storing a company logo in {@code sessionStorage} so it survives page refresh).
   */
  fetchAsBlob(servePath: string): Observable<Blob> {
    const url = this.toAbsoluteUrl(servePath);
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Extract the fileNo from a serve_path string.
   * {@code "/api/v1/sys/files/42/content"} → {@code 42}.
   * Returns {@code null} if the path is not in the expected format.
   */
  fileNoFromPath(servePath: string | null | undefined): number | null {
    if (!servePath) return null;
    const parts = servePath.split('/');
    const idx   = parts.indexOf('files');
    if (idx < 0 || idx + 1 >= parts.length) return null;
    const n = Number(parts[idx + 1]);
    return isNaN(n) ? null : n;
  }

  // ─── private ──────────────────────────────────────────────────────────────

  /** Convert a relative serve_path to an absolute URL using the configured API host. */
  private toAbsoluteUrl(servePath: string): string {
    const host = this.config.apiUrl.replace(/\/api\/v1$/, '');
    return `${host}${servePath}`;
  }
}

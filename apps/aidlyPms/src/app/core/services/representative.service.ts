import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';

export interface SysRepresentative {
  user_no: number;
  uuid?: string;
  pharmacy_no: number;
  branch_no: number;
  role_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  gender?: number;
  is_active: boolean;
  role_name?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RepresentativeService {
  private readonly api = inject(ApiService);

  getRepresentatives(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<SysRepresentative>>> {
    return this.api.getPaged<SysRepresentative>('representative', params);
  }

  getRepresentativeById(id: number): Observable<ApiResponse<SysRepresentative>> {
    return this.api.get<SysRepresentative>(`representative/${id}`);
  }

  createRepresentative(model: Partial<SysRepresentative>): Observable<ApiResponse<SysRepresentative>> {
    return this.api.post<SysRepresentative>('representative', model);
  }

  updateRepresentative(id: number, model: Partial<SysRepresentative>): Observable<ApiResponse<SysRepresentative>> {
    return this.api.put<SysRepresentative>(`representative/${id}`, model);
  }

  deleteRepresentative(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`representative/${id}`);
  }
}

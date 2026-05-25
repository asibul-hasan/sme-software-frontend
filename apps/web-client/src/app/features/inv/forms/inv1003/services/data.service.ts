import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { ICategory, Option } from './model.service';

@Injectable()
export class Inv1003DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1003`;

  getList(): Observable<ApiResponse<ICategory[]>> {
    return this.http.get<ApiResponse<ICategory[]>>(`${this.baseUrl}/categories`);
  }
  getParentOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/parent-options`);
  }
  getTaxOptions(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/tax-options`);
  }
  save(payload: Partial<ICategory>): Observable<ApiResponse<ICategory>> {
    return this.http.post<ApiResponse<ICategory>>(`${this.baseUrl}/categories`, payload);
  }
  delete(categoryNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/categories/${categoryNo}`);
  }
}

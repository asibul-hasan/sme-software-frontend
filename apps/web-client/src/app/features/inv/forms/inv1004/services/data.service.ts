import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IBrand } from './model.service';

@Injectable()
export class Inv1004DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1004`;

  getList(): Observable<ApiResponse<IBrand[]>> {
    return this.http.get<ApiResponse<IBrand[]>>(`${this.baseUrl}/brands`);
  }
  save(payload: Partial<IBrand>): Observable<ApiResponse<IBrand>> {
    return this.http.post<ApiResponse<IBrand>>(`${this.baseUrl}/brands`, payload);
  }
  delete(brandNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/brands/${brandNo}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IAttribute } from './model.service';

@Injectable()
export class Inv1006DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1006`;

  getList(): Observable<ApiResponse<IAttribute[]>> {
    return this.http.get<ApiResponse<IAttribute[]>>(`${this.baseUrl}/attributes`);
  }
  save(payload: Partial<IAttribute>): Observable<ApiResponse<IAttribute>> {
    return this.http.post<ApiResponse<IAttribute>>(`${this.baseUrl}/attributes`, payload);
  }
  delete(attributeNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/attributes/${attributeNo}`);
  }
}

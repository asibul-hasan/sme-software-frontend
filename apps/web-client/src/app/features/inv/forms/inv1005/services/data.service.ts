import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IUom } from './model.service';

@Injectable()
export class Inv1005DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/inv/forms/inv1005`;

  getList(): Observable<ApiResponse<IUom[]>> {
    return this.http.get<ApiResponse<IUom[]>>(`${this.baseUrl}/uoms`);
  }
  save(payload: Partial<IUom>): Observable<ApiResponse<IUom>> {
    return this.http.post<ApiResponse<IUom>>(`${this.baseUrl}/uoms`, payload);
  }
  delete(uomNo: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/uoms/${uomNo}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Option, MenuRow } from './model.service';

@Injectable()
export class Sys1202DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1202`;

  getCompanies(): Observable<ApiResponse<Option[]>> {
    return this.http.get<ApiResponse<Option[]>>(`${this.baseUrl}/companies`);
  }

  getMenus(companyNo: number): Observable<ApiResponse<MenuRow[]>> {
    return this.http.get<ApiResponse<MenuRow[]>>(`${this.baseUrl}/companies/${companyNo}/menus`);
  }

  saveEnrollments(companyNo: number, rows: MenuRow[]): Observable<ApiResponse<MenuRow[]>> {
    return this.http.post<ApiResponse<MenuRow[]>>(`${this.baseUrl}/companies/${companyNo}/menus`, rows);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../../../core/services/app-config.service';
import { ApiResponse } from '../../../../../core/models/response.model';

/**
 * Form-specific DTO for SYS1001 Company Setup.
 */
export interface Sys1001CompanyDto {
  company_no: number | null;
  company_id: string;
  company_name: string;
  company_name_nls: string | null;
  company_type: string | null;
  trade_license_no: string | null;
  vat_reg_no: string | null;
  tin_no: string | null;
  bin_no: string | null;
  reg_no: string | null;
  company_addr1: string | null;
  company_addr2: string | null;
  city: string | null;
  state_province: string | null;
  post_code: string | null;
  country_code: string | null;
  mobile_no: string | null;
  contact_no: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  is_active: number;
  row_version: number | null;
}

/**
 * Form-level HTTP service for SYS1001 Company Setup.
 * All API calls go through the dedicated Sys1001Controller.
 */
@Injectable()
export class Sys1001DataService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private baseUrl = `${this.config.apiUrl}/sys/forms/sys1001`;

  getDetail(companyNo: number): Observable<ApiResponse<Sys1001CompanyDto>> {
    return this.http.get<ApiResponse<Sys1001CompanyDto>>(`${this.baseUrl}/${companyNo}`);
  }

  save(payload: Sys1001CompanyDto): Observable<ApiResponse<Sys1001CompanyDto>> {
    return this.http.post<ApiResponse<Sys1001CompanyDto>>(this.baseUrl, payload);
  }
}

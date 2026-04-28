import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CompanyListResponse {
  success: boolean;
  message: string;
  data: any[];
}

export interface CompanyDetailResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/sys/company`;

  constructor(private http: HttpClient) {}

  listCompanies(): Observable<CompanyListResponse> {
    return this.http.post<CompanyListResponse>(`${this.apiUrl}/list`, {});
  }

  getCompanyDetails(companyNo: number): Observable<CompanyDetailResponse> {
    return this.http.post<CompanyDetailResponse>(`${this.apiUrl}/detail`, { company_no: companyNo });
  }

  writeCompany(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/write`, payload);
  }
}

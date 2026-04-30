import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private get apiUrl() { return `${this.config.apiUrl}/sys/company`; }

  constructor(private http: HttpClient, private config: AppConfigService) {}

  listCompanies(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/list`);
  }

  getCompanyDetails(companyNo: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detail`, {
      params: { company_no: companyNo },
    });
  }

  createCompany(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }

  updateCompany(payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update`, payload);
  }

  deleteCompany(companyNo: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete`, {
      params: { company_no: companyNo },
    });
  }
}

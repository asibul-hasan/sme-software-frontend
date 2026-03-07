import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportsDataService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) { }

  getSalesReport(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/sales`, { params });
  }

  getInventoryReport(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/inventory`, { params });
  }

  getAttendanceReport(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/attendance`, { params });
  }

  getEmployeeReport(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employee`, { params });
  }
}

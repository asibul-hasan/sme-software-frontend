import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HrDataService {
  private apiUrl = `${environment.apiUrl}/hr`;

  constructor(private http: HttpClient) { }

  // Employee API
  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employees`);
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employees/${id}`);
  }

  createEmployee(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/employees`, data);
  }

  updateEmployee(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/employees/${id}`, data);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/employees/${id}`);
  }

  // Attendance API
  getAttendance(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/attendance`, { params });
  }

  markAttendance(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/attendance`, data);
  }

  // Leave API
  getLeaves(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leave`, { params });
  }

  applyLeave(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/leave`, data);
  }

  updateLeaveStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/leave/${id}/status`, { status });
  }
}


import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Employee, CreateEmployeeDto } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/hr/employees`;

  constructor(private http: HttpClient) { }

  findAll(params?: any): Observable<Employee[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return this.http.get<Employee[]>(this.apiUrl, { params: httpParams });
  }

  findOne(id: number | string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, data);
  }

  update(id: number | string, data: Partial<CreateEmployeeDto>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

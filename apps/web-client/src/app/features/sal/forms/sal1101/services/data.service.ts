import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SalDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Customer } from './model.service';

const BASE = 'forms/sal1101/customers';

/** Form-level HTTP service for SAL_1101 – Customer. */
@Injectable()
export class Sal1101DataService {
  private sal = inject(SalDataService);

  loadCustomers(): Observable<ApiResponse<Customer[]>> {
    return this.sal.getList<Customer[]>(BASE);
  }
  save(payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.sal.insert<Customer>(BASE, payload);
  }
  update(no: number, payload: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.sal.update<Customer>(BASE, no, payload);
  }
  remove(no: number): Observable<ApiResponse<void>> {
    return this.sal.delete<void>(BASE, no);
  }
}

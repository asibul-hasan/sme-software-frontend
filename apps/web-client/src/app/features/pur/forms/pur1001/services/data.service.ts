import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PurDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Supplier } from './model.service';

const BASE = 'forms/pur1001/suppliers';

/** Form-level HTTP service for PUR_1001 – Supplier. */
@Injectable()
export class Pur1001DataService {
  private pur = inject(PurDataService);

  loadSuppliers(): Observable<ApiResponse<Supplier[]>> {
    return this.pur.getList<Supplier[]>(BASE);
  }
  save(payload: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.pur.insert<Supplier>(BASE, payload);
  }
  update(no: number, payload: Partial<Supplier>): Observable<ApiResponse<Supplier>> {
    return this.pur.update<Supplier>(BASE, no, payload);
  }
  remove(no: number): Observable<ApiResponse<void>> {
    return this.pur.delete<void>(BASE, no);
  }
}

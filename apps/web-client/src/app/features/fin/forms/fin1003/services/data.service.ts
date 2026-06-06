import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { VoucherType } from './model.service';

/** Form-level HTTP service for FIN_1003 – Voucher Type (/api/v1/fin/forms/fin1003/voucher-types). */
@Injectable()
export class Fin1003DataService {
  private fin = inject(FinDataService);
  loadTypes(): Observable<ApiResponse<VoucherType[]>> { return this.fin.getList<VoucherType[]>('forms/fin1003/voucher-types'); }
  loadDetail(no: number): Observable<ApiResponse<VoucherType>> { return this.fin.getDtl<VoucherType>('forms/fin1003/voucher-types', no); }
  save(p: Partial<VoucherType>): Observable<ApiResponse<VoucherType>> { return this.fin.insert<VoucherType>('forms/fin1003/voucher-types', p); }
  update(no: number, p: Partial<VoucherType>): Observable<ApiResponse<VoucherType>> { return this.fin.update<VoucherType>('forms/fin1003/voucher-types', no, p); }
  remove(no: number): Observable<ApiResponse<void>> { return this.fin.delete<void>('forms/fin1003/voucher-types', no); }
}

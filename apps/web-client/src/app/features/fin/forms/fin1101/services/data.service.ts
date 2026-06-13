import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { Voucher, AccountLite, VoucherTypeLite } from './model.service';
import { CommonDataService, CurrencyLookup } from '../../../../../shared/services/common-data.service';

type VoucherAction = 'submit' | 'approve' | 'reject' | 'cancel';

/** Form-level HTTP service for FIN_1101 – Voucher Entry (/api/v1/fin/forms/fin1101/vouchers). */
@Injectable()
export class Fin1101DataService {
  private fin = inject(FinDataService);
  private common = inject(CommonDataService);
  loadVouchers(): Observable<ApiResponse<Voucher[]>> { return this.fin.getList<Voucher[]>('forms/fin1101/vouchers'); }
  loadDetail(no: number): Observable<ApiResponse<Voucher>> { return this.fin.getDtl<Voucher>('forms/fin1101/vouchers', no); }
  save(p: Partial<Voucher>): Observable<ApiResponse<Voucher>> { return this.fin.insert<Voucher>('forms/fin1101/vouchers', p); }
  update(no: number, p: Partial<Voucher>): Observable<ApiResponse<Voucher>> { return this.fin.update<Voucher>('forms/fin1101/vouchers', no, p); }
  remove(no: number): Observable<ApiResponse<void>> { return this.fin.delete<void>('forms/fin1101/vouchers', no); }
  action(no: number, action: VoucherAction): Observable<ApiResponse<Voucher>> { return this.fin.insert<Voucher>(`forms/fin1101/vouchers/${no}/${action}`, {}); }
  loadAccounts(): Observable<ApiResponse<AccountLite[]>> { return this.fin.getList<AccountLite[]>('forms/fin1001/accounts'); }
  loadVoucherTypes(): Observable<ApiResponse<VoucherTypeLite[]>> { return this.fin.getList<VoucherTypeLite[]>('forms/fin1003/voucher-types'); }
  loadCurrencies(): Observable<ApiResponse<CurrencyLookup[]>> { return this.common.getCurrencyList(); }
}

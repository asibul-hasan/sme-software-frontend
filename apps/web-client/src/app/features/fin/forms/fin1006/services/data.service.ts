import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { GlMap, AccountLite } from './model.service';

/** Form-level HTTP service for FIN_1006 – GL Account Mapping. */
@Injectable()
export class Fin1006DataService {
  private fin = inject(FinDataService);
  loadMaps(): Observable<ApiResponse<GlMap[]>> { return this.fin.getList<GlMap[]>('forms/fin1006/maps'); }
  loadDetail(no: number): Observable<ApiResponse<GlMap>> { return this.fin.getDtl<GlMap>('forms/fin1006/maps', no); }
  save(p: Partial<GlMap>): Observable<ApiResponse<GlMap>> { return this.fin.insert<GlMap>('forms/fin1006/maps', p); }
  update(no: number, p: Partial<GlMap>): Observable<ApiResponse<GlMap>> { return this.fin.update<GlMap>('forms/fin1006/maps', no, p); }
  remove(no: number): Observable<ApiResponse<void>> { return this.fin.delete<void>('forms/fin1006/maps', no); }
  loadAccounts(): Observable<ApiResponse<AccountLite[]>> { return this.fin.getList<AccountLite[]>('forms/fin1001/accounts'); }
}

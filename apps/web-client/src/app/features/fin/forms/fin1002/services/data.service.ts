import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FinDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { AccountGroup } from './model.service';

/** Form-level HTTP service for FIN_1002 – Account Group (/api/v1/fin/forms/fin1002/groups). */
@Injectable()
export class Fin1002DataService {
  private fin = inject(FinDataService);
  loadGroups(): Observable<ApiResponse<AccountGroup[]>> { return this.fin.getList<AccountGroup[]>('forms/fin1002/groups'); }
  loadDetail(no: number): Observable<ApiResponse<AccountGroup>> { return this.fin.getDtl<AccountGroup>('forms/fin1002/groups', no); }
  save(p: Partial<AccountGroup>): Observable<ApiResponse<AccountGroup>> { return this.fin.insert<AccountGroup>('forms/fin1002/groups', p); }
  update(no: number, p: Partial<AccountGroup>): Observable<ApiResponse<AccountGroup>> { return this.fin.update<AccountGroup>('forms/fin1002/groups', no, p); }
  remove(no: number): Observable<ApiResponse<void>> { return this.fin.delete<void>('forms/fin1002/groups', no); }
}

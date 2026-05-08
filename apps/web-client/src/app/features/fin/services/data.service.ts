import { Injectable } from '@angular/core';
import { BaseDataService } from '../../../core/services/base-data.service';

/**
 * HTTP gateway for the FIN module (/api/v1/fin/...).
 *
 * Generic CRUD (getList, getDetails, create, update, delete) is
 * inherited from BaseDataService. Add fin-specific methods here
 * as the Finance module forms are built out.
 */
@Injectable({
  providedIn: 'root',
})
export class FinDataService extends BaseDataService {
  protected override readonly modulePath = 'fin';
}

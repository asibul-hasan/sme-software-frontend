import { Injectable } from '@angular/core';
import { BaseDataService } from '../../../core/services/base-data.service';

/**
 * HTTP gateway for the PUR module (/api/v1/pur/...).
 * Generic CRUD (getList/getDtl/insert/update/delete) inherited from BaseDataService.
 */
@Injectable({ providedIn: 'root' })
export class PurDataService extends BaseDataService {
  protected override readonly modulePath = 'pur';
}

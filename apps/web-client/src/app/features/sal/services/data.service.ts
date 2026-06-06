import { Injectable } from '@angular/core';
import { BaseDataService } from '../../../core/services/base-data.service';

/**
 * HTTP gateway for the SAL module (/api/v1/sal/...).
 * Generic CRUD (getList/getDtl/insert/update/delete) inherited from BaseDataService.
 */
@Injectable({ providedIn: 'root' })
export class SalDataService extends BaseDataService {
  protected override readonly modulePath = 'sal';
}

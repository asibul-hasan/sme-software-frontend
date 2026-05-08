import { Injectable } from '@angular/core';
import { BaseDataService } from '../../../core/services/base-data.service';

/**
 * HTTP gateway for the SYS module (/api/v1/sys/...).
 *
 * Generic CRUD (getList, getDetails, create, update, delete) is
 * inherited from BaseDataService — do not re-implement them here.
 *
 * Designation / permission methods previously living here have been
 * moved to HrDataService where they belong by domain.
 */
@Injectable({
  providedIn: 'root',
})
export class SysDataService extends BaseDataService {
  protected override readonly modulePath = 'sys';
}

import { Injectable } from '@angular/core';
import { BaseDataService } from './base-data.service';

/**
 * HTTP gateway for core system entities.
 *
 * @deprecated Most methods moved to module-specific data services (e.g. SysDataService).
 */
@Injectable({
  providedIn: 'root',
})
export class CoreDataService extends BaseDataService {
  protected override readonly modulePath = 'sys';
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HrmDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { HrmSettings } from './model.service';

/** Form-level HTTP service for HRM_1008 – HR Settings (/api/v1/hrm/forms/hrm1008/settings). */
@Injectable()
export class Hrm1008DataService {
  private hrService = inject(HrmDataService);

  loadSettings(): Observable<ApiResponse<HrmSettings>> {
    return this.hrService.getList<HrmSettings>('forms/hrm1008/settings');
  }
  saveSettings(payload: Partial<HrmSettings>): Observable<ApiResponse<HrmSettings>> {
    return this.hrService.insert<HrmSettings>('forms/hrm1008/settings', payload);
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { User } from '../../../../../core/models/user.model';

/**
 * Form-level HTTP service for SYS1101 – User Management.
 */
@Injectable()
export class Sys1101DataService {
  private coreService = inject(CoreDataService);

  loadUsers(): Observable<ApiResponse<User[]>> {
    return this.coreService.getUsers() as Observable<ApiResponse<User[]>>;
  }

  loadUserDetail(userNo: number): Observable<ApiResponse<User>> {
    return this.coreService.getUserDtl(userNo) as Observable<ApiResponse<User>>;
  }

  saveUser(payload: Partial<User>): Observable<ApiResponse<User>> {
    return this.coreService.insertUser(payload) as Observable<ApiResponse<User>>;
  }

  updateUser(payload: Partial<User>): Observable<ApiResponse<User>> {
    const userNo = payload.user_no;
    if (!userNo) throw new Error('user_no is required for update');
    return this.coreService.updateUser(userNo, payload) as Observable<ApiResponse<User>>;
  }

  deleteUser(userNo: number): Observable<ApiResponse<void>> {
    return this.coreService.deleteUser(userNo);
  }
}

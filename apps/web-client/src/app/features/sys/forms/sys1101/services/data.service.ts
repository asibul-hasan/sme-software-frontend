import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreDataService } from '../../../../../core/services/core-data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IUser } from './model.service';

/**
 * Form-level HTTP service for SYS1101 – User Management.
 */
@Injectable()
export class Sys1101DataService {
  private coreService = inject(CoreDataService);

  loadUsers(params?: Record<string, string | number | boolean>): Observable<ApiResponse<IUser[]>> {
    return this.coreService.searchUsers(params) as Observable<ApiResponse<IUser[]>>;
  }

  loadUserDetail(userNo: number): Observable<ApiResponse<IUser>> {
    return this.coreService.getUserDtl(userNo) as Observable<ApiResponse<IUser>>;
  }

  loadUserByEmployeeNo(employeeNo: number): Observable<ApiResponse<IUser>> {
    return this.coreService.getUserByEmployeeNo(employeeNo) as Observable<ApiResponse<IUser>>;
  }

  saveUser(payload: Partial<IUser>): Observable<ApiResponse<IUser>> {
    return this.coreService.insertUser(payload) as Observable<ApiResponse<IUser>>;
  }

  updateUser(payload: Partial<IUser>): Observable<ApiResponse<IUser>> {
    const userNo = payload.user_no;
    if (!userNo) throw new Error('user_no is required for update');
    return this.coreService.updateUser(userNo, payload) as Observable<ApiResponse<IUser>>;
  }

  deleteUser(userNo: number): Observable<ApiResponse<void>> {
    return this.coreService.deleteUser(userNo);
  }

  setLocked(userNo: number, locked: number): Observable<ApiResponse<IUser>> {
    return this.coreService.setUserLocked(userNo, locked) as Observable<ApiResponse<IUser>>;
  }

  resetPassword(userNo: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.coreService.resetUserPassword(userNo, { new_password: newPassword });
  }
}

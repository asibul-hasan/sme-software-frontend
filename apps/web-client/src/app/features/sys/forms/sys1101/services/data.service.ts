import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SysDataService } from '../../../services/data.service';
import { ApiResponse } from '../../../../../core/models/response.model';
import { IUser, IUserRole } from './model.service';

/**
 * Form-level HTTP service for SYS1101 – User Management.
 */
@Injectable()
export class Sys1101DataService {
  private sysService = inject(SysDataService);

  loadUsers(params?: Record<string, string | number | boolean>): Observable<ApiResponse<IUser[]>> {
    return this.sysService.searchUsers(params) as Observable<ApiResponse<IUser[]>>;
  }

  loadUsersSummary(params?: Record<string, string | number | boolean>): Observable<ApiResponse<any[]>> {
    return this.sysService.getUserSummary(params);
  }

  loadUserRoles(userNo: number): Observable<ApiResponse<IUserRole[]>> {
    return this.sysService.getUserRoles(userNo) as Observable<ApiResponse<IUserRole[]>>;
  }

  loadUserDetail(userNo: number): Observable<ApiResponse<IUser>> {
    return this.sysService.getUserDtl(userNo) as Observable<ApiResponse<IUser>>;
  }

  loadUserByEmployeeNo(employeeNo: number): Observable<ApiResponse<IUser>> {
    return this.sysService.getUserByEmployeeNo(employeeNo) as Observable<ApiResponse<IUser>>;
  }

  saveUser(payload: Partial<IUser>): Observable<ApiResponse<IUser>> {
    return this.sysService.insertUser(payload) as Observable<ApiResponse<IUser>>;
  }

  updateUser(payload: Partial<IUser>): Observable<ApiResponse<IUser>> {
    const userNo = payload.user_no;
    if (!userNo) throw new Error('user_no is required for update');
    return this.sysService.updateUser(userNo, payload) as Observable<ApiResponse<IUser>>;
  }

  deleteUser(userNo: number): Observable<ApiResponse<void>> {
    return this.sysService.deleteUser(userNo);
  }

  setLocked(userNo: number, locked: number): Observable<ApiResponse<IUser>> {
    return this.sysService.setUserLocked(userNo, locked) as Observable<ApiResponse<IUser>>;
  }

  resetPassword(userNo: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.sysService.resetUserPassword(userNo, { new_password: newPassword });
  }
}

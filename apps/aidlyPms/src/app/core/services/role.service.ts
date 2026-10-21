import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/common.models';
import { RoleMenuPermissionItem } from '../models/menu.models';

export interface SysRole {
  role_no: number;
  pharmacy_no: number;
  branch_no?: number;
  role_name?: string;
  alias: string;
  description?: string;
  is_system: boolean;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
}

export interface SysPermission {
  permission_no: number;
  code: string;
  module_group: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly api = inject(ApiService);

  getRoles(): Observable<ApiResponse<SysRole[]>> {
    return this.api.get<SysRole[]>('role/roles');
  }

  getRoleById(id: number): Observable<ApiResponse<SysRole>> {
    return this.api.get<SysRole>(`role/roles/${id}`);
  }

  createRole(role: Partial<SysRole>): Observable<ApiResponse<SysRole>> {
    return this.api.post<SysRole>('role/roles', role);
  }

  updateRole(id: number, role: Partial<SysRole>): Observable<ApiResponse<SysRole>> {
    return this.api.put<SysRole>(`role/roles/${id}`, role);
  }

  deleteRole(id: number): Observable<ApiResponse<boolean>> {
    return this.api.delete<boolean>(`role/roles/${id}`);
  }

  getPermissions(): Observable<ApiResponse<SysPermission[]>> {
    return this.api.get<SysPermission[]>('role/permissions');
  }

  getRoleMenuPermissions(roleNo: number): Observable<ApiResponse<RoleMenuPermissionItem[]>> {
    return this.api.get<RoleMenuPermissionItem[]>(`role/${roleNo}/menu-permissions`);
  }

  saveRoleMenuPermissions(roleNo: number, permissions: RoleMenuPermissionItem[]): Observable<ApiResponse<boolean>> {
    return this.api.post<boolean>(`role/${roleNo}/menu-permissions`, permissions);
  }

  getMyMenuPermissions(): Observable<ApiResponse<RoleMenuPermissionItem[]>> {
    return this.api.get<RoleMenuPermissionItem[]>('role/my-menu-permissions');
  }
}

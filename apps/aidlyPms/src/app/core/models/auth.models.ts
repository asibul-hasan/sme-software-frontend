/**
 * Authentication and RBAC Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `sys_roles`, `sys_permissions`, `sys_role_permissions`, `sys_users`.
 */
import { SysPharmacy } from './pharmacy.models';

export interface SysRole {
  role_no: number;
  pharmacy_no: number;
  branch_no?: number | null;
  role_name?: string | null;
  alias: string;
  description?: string | null;
  is_system: boolean;
  status: boolean;
  created_at: string;
  updated_at: string;
  permissions?: readonly SysPermission[];
}

export interface SysPermission {
  permission_no: number;
  code: string;
  module_group: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface SysRolePermission {
  role_no: number;
  permission_no: number;
  pharmacy_no: number;
  branch_no?: number | null;
}

export interface SysUser {
  user_no: number;
  uuid: string;
  pharmacy_no: number;
  branch_no?: number;
  role_no: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  password_hash: string;
  gender: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: SysRole;
  pharmacy?: SysPharmacy;
  permissions?: readonly string[];
}

// Backward-compatible type aliases
export type User = SysUser;
export type Role = SysRole;
export type Permission = SysPermission;

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: SysUser;
  activeBranch: SysPharmacy;
  branches: readonly SysPharmacy[];
}

export interface LoginCredentials {
  phone: string;
  password_hash: string;
}

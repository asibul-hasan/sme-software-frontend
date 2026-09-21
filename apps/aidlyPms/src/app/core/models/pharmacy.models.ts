/**
 * Pharmacy Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `sys_pharmacies`, `sys_user_pharmacy_access`.
 */

export interface SysPharmacy {
  pharmacy_no: number;
  branch_no?: number;
  uuid: string;
  name: string;
  trade_license_no?: string | null;
  tin_no?: string | null;
  bin_no?: string | null;
  drug_license_no?: string | null;
  contact_phone: string;
  contact_email?: string | null;
  address: string;
  area?: string | null;
  district: string;
  postal_code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SysUserPharmacyAccess {
  user_pharmacy_access_no: number;
  pharmacy_no: number;
  branch_no?: number;
  user_no: number;
  is_default: boolean;
  created_at: string;
  pharmacy?: SysPharmacy;
}

// Backward-compatible type aliases
export type PharmacyBranch = SysPharmacy;
export type UserPharmacyAccess = SysUserPharmacyAccess;

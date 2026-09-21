/**
 * System Tenancy, RBAC & Infrastructure Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `sys_pharmacies`, `sys_branches`, `sys_roles`, `sys_permissions`,
 *         `sys_role_permissions`, `sys_users`, `sys_user_pharmacy_access`,
 *         `sys_doc_sequence`, `sys_event_outbox`, `sys_idempotency_log`, `sys_audit_logs`.
 */

export interface SysBranch {
  branch_no: number;
  pharmacy_no: number;
  uuid: string;
  name: string;
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

export interface SysDocSequence {
  sequence_no: number;
  pharmacy_no: number;
  branch_no: number;
  doc_type: string;
  fin_year: string;
  last_seq_number: number;
  prefix_format: string;
  updated_at: string;
}

export interface SysEventOutbox {
  event_no: number;
  pharmacy_no: number;
  branch_no: number;
  aggregate_type: string;
  aggregate_id: number;
  event_type: string;
  payload: string;
  status: number;
  retry_count: number;
  created_at: string;
  published_at?: string | null;
}

export interface SysIdempotencyLog {
  idempotency_no: number;
  idempotency_key: string;
  pharmacy_no: number;
  user_no?: number | null;
  endpoint: string;
  request_hash: string;
  response_status?: number | null;
  response_payload?: string | null;
  created_at: string;
  expires_at: string;
}

export interface SysAuditLog {
  audit_no: number;
  pharmacy_no: number;
  branch_no: number;
  user_no?: number | null;
  table_name: string;
  record_id: number;
  action: string;
  old_data?: string | null;
  new_data?: string | null;
  ip_address?: string | null;
  created_at: string;
}

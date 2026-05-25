/**
 * Module codes — must match `sys_module.module_code` in the backend DB.
 *
 * These are the canonical short codes used everywhere in the app
 * (route prefixes, permission lookups, menu grouping).
 */
export enum ModuleEnum {
  SYS = 'SYS',  // System Administration
  HR  = 'HR',   // Human Resources
  INV = 'INV',  // Inventory
  SAL = 'SAL',  // Sales / POS
  PUR = 'PUR',  // Procurement
  FIN = 'FIN',  // Financial Management
  RPT = 'RPT',  // Reports
}

/**
 * Action codes — must match the boolean columns on `sys_role_permission`
 * in the backend schema. Keeping these aligned with the DB column names
 * lets us hand the backend's permission row straight into a check
 * without translation.
 *
 * The legacy `sys_enroll_module_menu` table has been replaced by
 * `sys_enroll_menu` (branch × menu); permission flags now live exclusively
 * on `sys_role_permission`.
 */
export enum ActionEnum {
  VIEW    = 'can_view',
  INSERT  = 'can_insert',
  UPDATE  = 'can_update',
  DELETE  = 'can_delete',
  APPROVE = 'can_approve',
  EXPORT  = 'can_export',
  PRINT   = 'can_print',
}

/** Per-form permission record. Flat keys so JSON from the API maps directly. */
export interface IFormPermission {
  can_view?:    boolean;
  can_insert?:  boolean;
  can_update?:  boolean;
  can_delete?:  boolean;
  can_approve?: boolean;
  can_export?:  boolean;
  can_print?:   boolean;
}

export interface IModulePermission {
  module: ModuleEnum | string;
  enabled: boolean;
  /** Keyed by `form_id` (e.g. `'SYS_1001'`). */
  forms: Record<string, IFormPermission>;
}

export interface IPermissionConfig {
  modules: IModulePermission[];
}

/**
 * Raw menu form as received from the backend `LoginResponse.menu` array.
 */
export interface IRawMenuForm {
  form_id: string;
  type: string;
  form_name: string;
  icon?: string;
  route?: string;
  module: string;
  code: string;
  sub_module?: string;
  module_icon?: string;
  sub_module_icon?: string;
  module_serial?: number;
  can_insert?: boolean;
  can_update?: boolean;
  can_view?: boolean;
  can_delete?: boolean;
}


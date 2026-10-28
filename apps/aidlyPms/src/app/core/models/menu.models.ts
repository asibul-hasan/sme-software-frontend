export interface MenuActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface SysMenu {
  menu_no: number;
  menu_code: string;
  title: string;
  title_bn: string;
  path?: string | null;
  route?: string | null;
  icon?: string | null;
  parent_menu_no?: number | null;
  parent_title?: string | null;
  order_no: number;
  menu_type: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: MenuActionPermissions;
  children?: SysMenu[];
}

export interface RoleMenuPermissionItem {
  role_menu_perm_no?: number | null;
  menu_no: number;
  menu_code?: string;
  title: string;
  title_bn?: string;
  path?: string | null;
  route?: string | null;
  icon?: string | null;
  parent_menu_no?: number | null;
  parent_title?: string | null;
  order_no: number;
  menu_type?: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface SaveRoleMenuPermissionsPayload {
  role_no: number;
  permissions: RoleMenuPermissionItem[];
}

export interface SysRoleMenuPermission {
  role_menu_perm_no: number;
  pharmacy_no: number;
  role_no: number;
  menu_no: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

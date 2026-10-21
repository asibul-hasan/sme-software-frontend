export interface SysMenu {
  menu_no: number;
  title: string;
  path?: string | null;
  icon?: string | null;
  parent_menu_no?: number | null;
  parent_title?: string | null;
  order_no: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
  children?: SysMenu[];
}

export interface RoleMenuPermissionItem {
  menu_no: number;
  title: string;
  path?: string | null;
  icon?: string | null;
  parent_menu_no?: number | null;
  parent_title?: string | null;
  order_no: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface SaveRoleMenuPermissionsPayload {
  role_no: number;
  permissions: RoleMenuPermissionItem[];
}

import { Injectable } from '@angular/core';
import { MenuItem } from '../models/menu.model';
import { ModuleEnum } from '../../../../core/models/permission.model';

export interface RawMenuForm {
  module: string;
  moduleIcon?: string;
  subModule: string;
  subModuleIcon?: string;
  formId: string;
  formName: string;
  icon?: string;
  code: string;
  type: string;
  badge?: string;
  badgeColor?: string;
  serial?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  public menu = [
    {
      formId: 'SYS_1001',
      type: 'form',
      formName: 'Company Setup',
      icon: 'corporate_fare',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Company Configuration',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'business',
      serial: 6,
    },
    {
      formId: 'SYS_1002',
      type: 'form',
      formName: 'Branch Setup',
      icon: 'store',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Company Configuration',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'business',
      serial: 6,
    },
    {
      formId: 'SYS_1003',
      type: 'form',
      formName: 'Financial Year Setup',
      icon: 'calendar_today',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Company Configuration',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'business',
      serial: 6,
    },
    {
      formId: 'SYS_1004',
      type: 'form',
      formName: 'Currency Setup',
      icon: 'payments',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Company Configuration',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'business',
      serial: 6,
    },
    {
      formId: 'SYS_1005',
      type: 'form',
      formName: 'VAT / Tax Setup',
      icon: 'request_quote',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Company Configuration',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'business',
      serial: 6,
    },
    {
      formId: 'SYS_1101',
      type: 'form',
      formName: 'User Management',
      icon: 'person',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'User & Security',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'security',
      serial: 6,
    },
    {
      formId: 'SYS_1102',
      type: 'form',
      formName: 'Role Management',
      icon: 'manage_accounts',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'User & Security',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'security',
      serial: 6,
    },
    {
      formId: 'SYS_1103',
      type: 'report',
      formName: 'Role Permission Matrix',
      icon: 'rule',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'User & Security',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'security',
      serial: 6,
    },
    {
      formId: 'SYS_1104',
      type: 'form',
      formName: 'User Branch Mapping',
      icon: 'map',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'User & Security',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'security',
      serial: 6,
    },
    {
      formId: 'SYS_1105',
      type: 'report',
      formName: 'Activity Log Viewer',
      icon: 'history',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'User & Security',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'security',
      serial: 6,
    },
    {
      formId: 'SYS_1201',
      type: 'form',
      formName: 'Dynamic Menu Builder',
      icon: 'list_alt',
      module: 'System Administration',
      code: 'SYS',
      subModule: 'Menu Builder',
      moduleIcon: 'admin_panel_settings',
      subModuleIcon: 'menu',
      serial: 6,
    },
    {
      formId: 'INV_1001',
      type: 'form',
      formName: 'Product Master Setup',
      icon: 'inventory_2',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Product Management',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'category',
      serial: 2,
    },
    {
      formId: 'INV_1002',
      type: 'form',
      formName: 'Barcode Generator',
      icon: 'qr_code_2',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Product Management',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'category',
      serial: 2,
    },
    {
      formId: 'INV_1101',
      type: 'form',
      formName: 'Opening Stock Entry',
      icon: 'list_alt',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Stock Initialization',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'inventory',
      serial: 2,
    },
    {
      formId: 'INV_1102',
      type: 'form',
      formName: 'Stock Adjustment',
      icon: 'balance',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Stock Initialization',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'inventory',
      serial: 2,
    },
    {
      formId: 'SAL_1001',
      type: 'form',
      formName: 'POS Sales Screen',
      icon: 'point_of_sale',
      module: 'Sales & POS',
      code: 'SAL',
      subModule: 'POS',
      moduleIcon: 'point_of_sale',
      subModuleIcon: 'shopping_cart',
      serial: 4,
    },
    {
      formId: 'SAL_1002',
      type: 'form',
      formName: 'Draft / Hold Sales',
      icon: 'pause_circle',
      module: 'Sales & POS',
      code: 'SAL',
      subModule: 'POS',
      moduleIcon: 'point_of_sale',
      subModuleIcon: 'shopping_cart',
      serial: 4,
    },
    {
      formId: 'SAL_1003',
      type: 'form',
      formName: 'POS Closing',
      icon: 'lock',
      module: 'Sales & POS',
      code: 'SAL',
      subModule: 'POS',
      moduleIcon: 'point_of_sale',
      subModuleIcon: 'shopping_cart',
      serial: 4,
    },
    {
      formId: 'SAL_1101',
      type: 'form',
      formName: 'Customer Management',
      icon: 'account_circle',
      module: 'Sales & POS',
      code: 'SAL',
      subModule: 'Customer',
      moduleIcon: 'point_of_sale',
      subModuleIcon: 'group',
      serial: 4,
    },
    {
      formId: 'SAL_1102',
      type: 'form',
      formName: 'Customer Due Collection',
      icon: 'payments',
      module: 'Sales & POS',
      code: 'SAL',
      subModule: 'Customer',
      moduleIcon: 'point_of_sale',
      subModuleIcon: 'group',
      serial: 4,
    },
    {
      formId: 'PUR_1001',
      type: 'form',
      formName: 'Supplier Management',
      icon: 'supervised_user_circle',
      module: 'Procurement Management',
      code: 'PUR',
      subModule: 'Supplier',
      moduleIcon: 'shopping_bag',
      subModuleIcon: 'local_shipping',
      serial: 3,
    },
    {
      formId: 'PUR_1101',
      type: 'form',
      formName: 'Purchase Order',
      icon: 'shopping_cart',
      module: 'Procurement Management',
      code: 'PUR',
      subModule: 'Purchase Workflow',
      moduleIcon: 'shopping_bag',
      subModuleIcon: 'receipt_long',
      serial: 3,
    },
    {
      formId: 'PUR_1102',
      type: 'form',
      formName: 'Purchase Invoice',
      icon: 'request_quote',
      module: 'Procurement Management',
      code: 'PUR',
      subModule: 'Purchase Workflow',
      moduleIcon: 'shopping_bag',
      subModuleIcon: 'receipt_long',
      serial: 3,
    },
    {
      formId: 'PUR_1103',
      type: 'form',
      formName: 'Purchase Return',
      icon: 'keyboard_return',
      module: 'Procurement Management',
      code: 'PUR',
      subModule: 'Purchase Workflow',
      moduleIcon: 'shopping_bag',
      subModuleIcon: 'receipt_long',
      serial: 3,
    },
    {
      formId: 'PUR_1104',
      type: 'form',
      formName: 'Supplier Payment',
      icon: 'payments',
      module: 'Procurement Management',
      code: 'PUR',
      subModule: 'Purchase Workflow',
      moduleIcon: 'shopping_bag',
      subModuleIcon: 'receipt_long',
      serial: 3,
    },
    {
      formId: 'FIN_1001',
      type: 'form',
      formName: 'Chart of Accounts Setup',
      icon: 'account_tree',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Chart of Accounts',
      moduleIcon: 'account_balance',
      subModuleIcon: 'account_tree',
      serial: 1,
    },
    {
      formId: 'FIN_1002',
      type: 'form',
      formName: 'Account Head Mapping',
      icon: 'sync_alt',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Chart of Accounts',
      moduleIcon: 'account_balance',
      subModuleIcon: 'account_tree',
      serial: 1,
    },
    {
      formId: 'FIN_1003',
      type: 'form',
      formName: 'Opening Balance Entry',
      icon: 'input',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Chart of Accounts',
      moduleIcon: 'account_balance',
      subModuleIcon: 'account_tree',
      serial: 1,
    },
    {
      formId: 'FIN_1101',
      type: 'form',
      formName: 'Cash Voucher',
      icon: 'payments',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Voucher System',
      moduleIcon: 'account_balance',
      subModuleIcon: 'receipt',
      serial: 1,
    },
    {
      formId: 'FIN_1102',
      type: 'form',
      formName: 'Bank Voucher',
      icon: 'account_balance_wallet',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Voucher System',
      moduleIcon: 'account_balance',
      subModuleIcon: 'receipt',
      serial: 1,
    },
    {
      formId: 'FIN_1103',
      type: 'form',
      formName: 'Journal Voucher',
      icon: 'book',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Voucher System',
      moduleIcon: 'account_balance',
      subModuleIcon: 'receipt',
      serial: 1,
    },
    {
      formId: 'FIN_1104',
      type: 'form',
      formName: 'Contra Voucher',
      icon: 'swap_vert',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Voucher System',
      moduleIcon: 'account_balance',
      subModuleIcon: 'receipt',
      serial: 1,
    },
    {
      formId: 'FIN_1201',
      type: 'form',
      formName: 'Expense Category',
      icon: 'category',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Expense',
      moduleIcon: 'account_balance',
      subModuleIcon: 'money_off',
      serial: 1,
    },
    {
      formId: 'FIN_1202',
      type: 'form',
      formName: 'Expense Entry',
      icon: 'money_off',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Expense',
      moduleIcon: 'account_balance',
      subModuleIcon: 'money_off',
      serial: 1,
    },
    {
      formId: 'INV_2301',
      type: 'form',
      formName: 'Warehouse Setup',
      icon: 'domain',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Warehouse',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'warehouse',
      serial: 2,
    },
    {
      formId: 'INV_2302',
      type: 'form',
      formName: 'Rack/Shelf Setup',
      icon: 'view_week',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Warehouse',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'warehouse',
      serial: 2,
    },
    {
      formId: 'INV_2303',
      type: 'form',
      formName: 'Stock Transfer',
      icon: 'swap_horiz',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Stock Transfer',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'local_shipping',
      serial: 2,
    },
    {
      formId: 'INV_2304',
      type: 'form',
      formName: 'Batch & Expiry Management',
      icon: 'date_range',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Batch Control',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'sell',
      serial: 2,
    },
    {
      formId: 'INV_2305',
      type: 'form',
      formName: 'Reorder Level Setup',
      icon: 'trending_down',
      module: 'Inventory Management',
      code: 'INV',
      subModule: 'Reorder Control',
      moduleIcon: 'inventory_2',
      subModuleIcon: 'shopping_cart_checkout',
      serial: 2,
    },
    {
      formId: 'FIN_1301',
      type: 'report',
      formName: 'Branch-wise Ledger',
      icon: 'menu_book',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Branch Finance',
      moduleIcon: 'account_balance',
      subModuleIcon: 'store',
      serial: 1,
    },
    {
      formId: 'FIN_1302',
      type: 'form',
      formName: 'Inter Branch Transfer',
      icon: 'sync',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Branch Finance',
      moduleIcon: 'account_balance',
      subModuleIcon: 'store',
      serial: 1,
    },
    {
      formId: 'FIN_1303',
      type: 'report',
      formName: 'Consolidated Report Setup',
      icon: 'summarize',
      module: 'Financial Management',
      code: 'FIN',
      subModule: 'Branch Finance',
      moduleIcon: 'account_balance',
      subModuleIcon: 'store',
      serial: 1,
    },
    {
      formId: 'HR_1001',
      type: 'form',
      formName: 'Employee Management',
      icon: 'person_add',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Employee Setup',
      moduleIcon: 'people',
      subModuleIcon: 'person_search',
      serial: 5,
    },
    {
      formId: 'HR_1002',
      type: 'form',
      formName: 'Department & Designation Setup',
      icon: 'badge',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Employee Setup',
      moduleIcon: 'people',
      subModuleIcon: 'person_search',
      serial: 5,
    },
    {
      formId: 'HR_1003',
      type: 'form',
      formName: 'Shift Setup',
      icon: 'schedule',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Employee Setup',
      moduleIcon: 'people',
      subModuleIcon: 'person_search',
      serial: 5,
    },
    {
      formId: 'HR_1101',
      type: 'form',
      formName: 'Manual Attendance',
      icon: 'touch_app',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Attendance',
      moduleIcon: 'people',
      subModuleIcon: 'event_available',
      serial: 5,
    },
    {
      formId: 'HR_1102',
      type: 'form',
      formName: 'Device Sync Attendance',
      icon: 'devices',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Attendance',
      moduleIcon: 'people',
      subModuleIcon: 'event_available',
      serial: 5,
    },
    {
      formId: 'HR_1103',
      type: 'form',
      formName: 'Attendance Adjustment',
      icon: 'edit_calendar',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Attendance',
      moduleIcon: 'people',
      subModuleIcon: 'event_available',
      serial: 5,
    },
    {
      formId: 'HR_1201',
      type: 'form',
      formName: 'Salary Structure Setup',
      icon: 'payments',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Payroll',
      moduleIcon: 'people',
      subModuleIcon: 'monetization_on',
      serial: 5,
    },
    {
      formId: 'HR_1202',
      type: 'form',
      formName: 'Salary Processing',
      icon: 'reorder',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Payroll',
      moduleIcon: 'people',
      subModuleIcon: 'monetization_on',
      serial: 5,
    },
    {
      formId: 'HR_1203',
      type: 'report',
      formName: 'Salary Sheet',
      icon: 'description',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Payroll',
      moduleIcon: 'people',
      subModuleIcon: 'monetization_on',
      serial: 5,
    },
    {
      formId: 'HR_1204',
      type: 'report',
      formName: 'Payslip Generator',
      icon: 'picture_as_pdf',
      module: 'Human Resource',
      code: 'HR',
      subModule: 'Payroll',
      moduleIcon: 'people',
      subModuleIcon: 'monetization_on',
      serial: 5,
    },
  ];

  buildMenu(forms: RawMenuForm[]): MenuItem[] {
    interface SubModuleMap {
      formId: string;
      formName: string;
      icon: string;
      children: MenuItem[];
    }
    interface ModuleMap {
      formId: string;
      formName: string;
      icon: string;
      expanded: boolean;
      serial: number;
      children: Record<string, SubModuleMap>;
    }

    const moduleMap: Record<string, ModuleMap> = {};

    forms.forEach((form) => {
      const moduleKey = form.module || 'Unknown';

      // Module level
      if (!moduleMap[moduleKey]) {
        moduleMap[moduleKey] = {
          formId: moduleKey,
          formName: this.toCamelCaseRoute(moduleKey),
          icon: form.moduleIcon || 'folder',
          expanded: false,
          serial: form.serial || 999,
          children: {},
        };
      }

      const module = moduleMap[moduleKey];
      const subModuleKey = form.subModule || 'General';

      // Submodule level
      if (!module.children[subModuleKey]) {
        module.children[subModuleKey] = {
          formId: subModuleKey,
          formName: this.toCamelCaseRoute(subModuleKey),
          icon: form.subModuleIcon || 'folder_open',
          children: [],
        };
      }

      // Form level
      module.children[subModuleKey].children.push({
        formId: form.formId,
        formName: this.toCamelCaseRoute(form.formName),
        icon: form.icon || 'description',
        route: `${this.toLowerCase(form.code)}/${form.type}/${this.toLowerCase(
          form.formName,
        )
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
          .replace(/\s+/g, '-')}`,
        code: form.code,
        type: form.type as 'form' | 'report',
        module: moduleKey as ModuleEnum,
        subModule: this.toCamelCaseRoute(subModuleKey),
        badge: form.badge,
        badgeColor: form.badgeColor as 'primary' | 'accent' | 'warn',
      });
    });

    // Convert map → array
    const menu: MenuItem[] = Object.values(moduleMap)
      .map(
        (m) =>
          ({
            ...m,
            children: Object.values(m.children),
          }) as MenuItem,
      )
      .sort((a, b) => (a.serial || 999) - (b.serial || 999));

    return menu;
  }

  toLowerCase(value: string | undefined | null): string {
    return (value || '').toLowerCase();
  }
  toCamelCaseRoute(value: string): string {
    if (!value) return '';

    return value
      .replace(/&/g, 'and') // replace & with and
      .replace(/\//g, 'or') // replace / with or
      .replace(/[^a-zA-Z0-9 ]/g, '') // remove other special characters
      .split(' ') // split words
      .filter(Boolean)
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }
}

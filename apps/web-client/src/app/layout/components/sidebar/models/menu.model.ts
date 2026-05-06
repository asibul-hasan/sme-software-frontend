import { ModuleEnum } from '../../../../core/models/permission.model';

export interface MenuItem {
    formId: string;
    type?: 'form'| 'report'
    formName: string;
    icon: string;
    route?: string;
    module?: ModuleEnum;
    code?: string;
    subModule?: string;
    children?: MenuItem[];
    badge?: string;
    badgeColor?: 'primary' | 'accent' | 'warn';
    expanded?: boolean;
    dividerAfter?: boolean; 
}
// Module	Code	Submodule	Form ID	Form Name
export const MENU_ITEMS: MenuItem[] = [
    // {
    //     formId: 'dashboard',
    //     formName: 'dashboard',
    //     icon: 'dashboard',
    //     route: '/dashboard',
    // },
    // {
    //     formId: 'hr',
    //     formName: 'hr',
    //     icon: 'people',
    //     module: ModuleEnum.HR,
    //     children: [
    //         {
    //             formId: 'employee-mgmt',
    //             formName: 'employee-management',
    //             icon: 'badge',
    //             children: [
    //                 {
    //                     formId: 'employee-list',
    //                     formName: 'employee-list',
    //                     icon: 'list',
    //                     route: '/hr/employees/list',
    //                 },
    //                 {
    //                     formId: 'employee-create',
    //                     formName: 'employee-create',
    //                     icon: 'person_add',
    //                     route: '/hr/employees/create',
    //                 },
    //             ]
    //         },
    //         {
    //             formId: 'attendance',
    //             formName: 'attendance',
    //             icon: 'event_available',
    //             route: '/hr/attendance',
    //         },
    //         {
    //             formId: 'leave',
    //             formName: 'HR.LEAVE.TITLE',
    //             icon: 'event_busy',
    //             route: '/hr/leave',
    //         },
    //     ],
    // },
    // {
    //     formId: 'inventory',
    //     formName: 'INVENTORY.TITLE',
    //     icon: 'inventory_2',
    //     module: ModuleEnum.INVENTORY,
    //     children: [
    //         {
    //             formId: 'products',
    //             formName: 'INVENTORY.PRODUCT.TITLE',
    //             icon: 'shopping_bag',
    //             route: '/inventory/products',
    //         },
    //         {
    //             formId: 'categories',
    //             formName: 'INVENTORY.CATEGORY.TITLE',
    //             icon: 'category',
    //             route: '/inventory/categories',
    //         },
    //         {
    //             formId: 'stock',
    //             formName: 'INVENTORY.STOCK.TITLE',
    //             icon: 'assessment',
    //             route: '/inventory/stock',
    //         },
    //     ],
    // },
    // {
    //     formId: 'sales',
    //     formName: 'SALES.TITLE',
    //     icon: 'point_of_sale',
    //     module: ModuleEnum.SALES,
    //     children: [
    //         {
    //             formId: 'pos',
    //             formName: 'SALES.POS.TITLE',
    //             icon: 'shopping_cart',
    //             route: '/sales/pos',
    //         },
    //         {
    //             formId: 'invoices',
    //             formName: 'SALES.INVOICE.TITLE',
    //             icon: 'receipt',
    //             route: '/sales/invoices',
    //         },
    //         {
    //             formId: 'customers',
    //             formName: 'SALES.CUSTOMER.TITLE',
    //             icon: 'group',
    //             route: '/sales/customers',
    //         },
    //     ],
    // },
    // {
    //     formId: 'reports',
    //     formName: 'REPORTS.TITLE',
    //     icon: 'analytics',
    //     module: ModuleEnum.REPORTS,
    //     route: '/reports',
    // },
    // {
    //     formId: 'settings',
    //     formName: 'SETTINGS.TITLE',
    //     icon: 'settings',
    //     module: ModuleEnum.SETTINGS,
    //     children: [
    //         {
    //             formId: 'company',
    //             formName: 'SETTINGS.COMPANY',
    //             icon: 'business',
    //             route: '/settings/company',
    //         },
    //         {
    //             formId: 'branches',
    //             formName: 'SETTINGS.BRANCH',
    //             icon: 'store',
    //             route: '/settings/branches',
    //         },
    //         {
    //             formId: 'users',
    //             formName: 'SETTINGS.USERS',
    //             icon: 'manage_accounts',
    //             route: '/settings/users',
    //         },
    //         {
    //             formId: 'designations',
    //             formName: 'SETTINGS.DESIGNATION',
    //             icon: 'badge',
    //             route: '/settings/designations',
    //         },
    //     ],
    // },
];
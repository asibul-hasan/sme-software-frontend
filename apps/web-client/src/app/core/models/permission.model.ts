export enum ModuleEnum {
    HR = 'HR',
    INVENTORY = 'INVENTORY',
    SALES = 'SALES',
    REPORTS = 'REPORTS',
    SETTINGS = 'SETTINGS',
}

export enum FormEnum {
    DEFAULT = 'DEFAULT',
    
    // HR Forms (HR_1xxx)
    HR_EMPLOYEE = 'HR_1001',
    HR_ATTENDANCE = 'HR_1002',
    HR_PAYROLL = 'HR_1003',
    HR_LEAVE = 'HR_1004',

    // Inventory Forms (IN_1xxx)
    IN_PRODUCT = 'IN_1001',
    IN_CATEGORY = 'IN_1002',
    IN_STOCK = 'IN_1003',
    IN_WAREHOUSE = 'IN_1004',

    // Sales Forms (SL_1xxx)
    SL_CUSTOMER = 'SL_1001',
    SL_INVOICE = 'SL_1002',
    SL_PAYMENT = 'SL_1003',
    SL_RETURN = 'SL_1004',

    // Settings Forms (ST_1xxx)
    ST_USER = 'ST_1001',
    ST_ROLE = 'ST_1002',
    ST_PERMISSION = 'ST_1003',
    ST_COMPANY = 'ST_1004',

    // Reports (RP_1xxx)
    RP_SALES = 'RP_1001',
    RP_INVENTORY = 'RP_1002',
}

export enum ActionEnum {
    CREATE = 'create',
    READ = 'view', // Backend uses 'view'
    UPDATE = 'edit', // Backend uses 'edit'
    DELETE = 'delete',
    APPROVE = 'approve',
    REJECT = 'reject',
    CANCEL = 'cancel',
    PRINT = 'print',
    IMPORT = 'import',
    EXPORT = 'export',
    VIEW = 'view', // Add alias if needed
    EDIT = 'edit', // Add alias if needed
}

export interface IModulePermission {
    module: ModuleEnum | string;
    enabled: boolean;
    forms: Record<string, Record<string, boolean>>; // Use string keys for flexibility
}

export interface IPermissionConfig {
    modules: IModulePermission[];
}

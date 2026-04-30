export interface SelectOption {
  label: string;
  value: any;
}

export const sysConstants = {
  companyTypes: [
    { label: 'Proprietorship', value: 'Proprietorship' },
    { label: 'LLC', value: 'LLC' },
    { label: 'Partnership', value: 'Partnership' },
    { label: 'Others', value: 'Others' }
  ],
  countries: [
    { label: 'Bangladesh (BD)', value: 'BD' },
    { label: 'United States (US)', value: 'US' },
    { label: 'United Kingdom (GB)', value: 'GB' }
  ],
  currencies: [
    { label: 'BDT (Taka)', value: 1 },
    { label: 'USD (Dollar)', value: 2 },
    { label: 'EUR (Euro)', value: 3 }
  ],
  fiscalMonths: [
    { label: 'January', value: 1 },
    { label: 'April', value: 4 },
    { label: 'July', value: 7 },
    { label: 'October', value: 10 }
  ],
  dateFormats: [
    { label: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
    { label: 'MM-DD-YYYY', value: 'MM-DD-YYYY' },
    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
  ],
  timeZones: [
    { label: 'Asia/Dhaka (GMT+6)', value: 'Asia/Dhaka' },
    { label: 'UTC', value: 'UTC' }
  ],
  branchManagers: [
    { label: 'Alice Smith (Admin)', value: 101 },
    { label: 'Bob Johnson (Manager)', value: 102 },
    { label: 'Carol Davis (Supervisor)', value: 103 }
  ],
  branchTypes: [
    { label: 'Main Branch', value: 'Main' },
    { label: 'Sub Branch', value: 'Sub' },
    { label: 'Sales Center', value: 'Sales' }
  ],
  financialYearStatuses: [
    { label: 'Open', value: 'Open' },
    { label: 'Closed', value: 'Closed' },
    { label: 'Locked', value: 'Locked' }
  ],
  taxTypes: [
    { label: 'VAT', value: 'VAT' },
    { label: 'SD (Supplementary Duty)', value: 'SD' },
    { label: 'TAX (Income Tax)', value: 'TAX' },
    { label: 'EXEMPT', value: 'EXEMPT' },
    { label: 'ZERO (Zero Rated)', value: 'ZERO' },
    { label: 'COMPOSITE', value: 'COMPOSITE' }
  ]
};

const fs = require('fs');

const items = [
  "Financial Management", "Inventory Management", "Procurement Management", "Sales & POS",
  "GL Setup", "Transactions", "Voucher System", "Expense", "Financial Reports", 
  "Product & Setup", "Stock Operations", "Warehouse", "Warehouse & Transfer", 
  "Stock Transfer", "Batch Control", "Reorder Control", "Purchase Setup", 
  "Purchase Transactions", "POS", "Sales Setup", "Sales Transactions",
  "Chart of Accounts", "Account Group", "Voucher Type", "Bank Account", "GL Mapping", 
  "Opening Balance", "Voucher Entry", "Bank Reconciliation", "Auto-Posting Monitor", 
  "Period / Year-End Close", "Journal Voucher", "Contra Voucher", "Expense Entry", 
  "Trial Balance", "Account Ledger", "Day Book", "Profit & Loss", "Balance Sheet", 
  "Cash Flow", "AR / AP Aging", "Product Master", "Barcode Generator", "Category Setup", 
  "Brand Setup", "Unit of Measure Setup", "Product Attribute Setup", "Opening Stock", 
  "Stock Adjustment", "Warehouse Setup", "Rack/Shelf Setup", "Batch / Expiry Management", 
  "Reorder Level Setup", "Batch & Expiry Management", "Supplier Management", "Purchase Order", 
  "Purchase Invoice", "Supplier Payment", "Purchase Return", "Draft / Hold Sales", "POS Closing", 
  "Customer Management", "Sales Invoice"
];

function toCamelCase(str) {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[A-Z]/, chr => chr.toLowerCase());
}

const enPath = './apps/web-client/src/assets/i18n/en.json';
const bnPath = './apps/web-client/src/assets/i18n/bn.json';

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const bn = JSON.parse(fs.readFileSync(bnPath, 'utf8'));

let enAdded = 0;
let bnAdded = 0;

items.forEach(item => {
  const key = toCamelCase(item);
  
  if (!en[key]) {
    en[key] = item;
    enAdded++;
  }
  
  if (!bn[key]) {
    bn[key] = item; // default to English for bn if missing
    bnAdded++;
  }
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2) + '\n');

console.log(`Added ${enAdded} keys to en.json`);
console.log(`Added ${bnAdded} keys to bn.json`);

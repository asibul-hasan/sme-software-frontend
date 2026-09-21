# Unified System Menu Structure

All forms and screens are organized by Module Code and 4-digit Series Number:
- **`ACC_1101` – `ACC_1110`**: Accounting & Financials
- **`CASH_1201` – `CASH_1205`**: Cash Counter & Reconciliation
- **`DUE_1301` – `DUE_1302`**: Due & Credit Collection
- **`SALE_1401` – `SALE_1410`**: Customer & Point of Sale (POS)
- **`PUR_1501` – `PUR_1509`**: Suppliers & Purchase Invoicing
- **`PROD_1601` – `PROD_1610`**: Products & Inventory Stock
- **`DOC_1701` – `DOC_1703`**: Doctors Portal & Prescriptions
- **`REP_1801` – `REP_1802`**: Representatives & Staff Users
- **`ROLE_1901` – `ROLE_1902`**: Roles & Permissions (RBAC)
- **`CFG_2001` – `CFG_2005`**: System & POS Configuration
- **`SUB_2101` – `SUB_2102`**: SaaS Subscription & Billing
- **`PHAR_2201`**: Multi-Branch Store Switcher
- **`DASH_2301` – `DASH_2303`**: Dashboard & Executive Analytics

---

## Screen-Level Menu Table

| # | Module | Sub-Module | Form Title | Form ID | Type | Route / URL | Permission Node |
| :-: | :--- | :--- | :--- | :-: | :-: | :--- | :--- |
| **1** | Accounting | Transactions | Chart of Accounts Register | `ACC_1101` | Main Screen | `/accounting/transaction` | `PMS-Chart-Of-Accounting-Module` |
| **2** | | | Create Transaction Account | `ACC_1102` | Modal Dialog | `/accounting/transaction/add` | `PMS-Chart-Of-Accounting-Module` |
| **3** | | Expenses | Expense Vouchers Register | `ACC_1103` | Main Screen | `/accounting/expenses` | `PMS-Expense-Module` |
| **4** | | | Add Expense Voucher | `ACC_1104` | Modal Dialog | `/accounting/expenses/add` | `PMS-Expense-Module` |
| **5** | | | Add Expense Category | `ACC_1105` | Modal Dialog | `/accounting/expense-category/add` | `PMS-Expense-Category-Module` |
| **6** | | Income | Miscellaneous Income Register | `ACC_1106` | Main Screen | `/accounting/income` | `PMS-Income-Module` |
| **7** | | | Add Income Voucher | `ACC_1107` | Modal Dialog | `/accounting/income/add` | `PMS-Income-Module` |
| **8** | | | Add Income Category | `ACC_1108` | Modal Dialog | `/accounting/income-category/add` | `PMS-Income-Category-Module` |
| **9** | | Additional Balance | Capital / Equity Balance Log | `ACC_1109` | Main Screen | `/accounting/additional-balance` | `Account-Module` |
| **10** | | | Add Capital Balance | `ACC_1110` | Modal Dialog | `/accounting/additional-balance/add`| `Account-Module` |
| **11** | Cash & Recon | Cash Handover | Received Cash Register | `CASH_1201` | Main Screen | `/cash/receive` | `PMS-Sale-Module` |
| **12** | | | Bulk Cash Handover Action | `CASH_1202` | Action Modal | `/cash/receive/check-all` | `PMS-Sale-Module` |
| **13** | | Reconciliations | Inter-Account Fund Transfers | `CASH_1203` | Main Screen | `/reconciliation` | `PMS-Reconciliation-Module` |
| **14** | | | Add Fund Transfer | `CASH_1204` | Modal Dialog | `/reconciliation/add` | `PMS-Reconciliation-Module` |
| **15** | | Register Closing | Daily Cash Register Closer | `CASH_1205` | Global Modal | `/cash/closer` | `PMS-Sale-Module` |
| **16** | Due Collect | Credit Dues | Due Collection Workbench | `DUE_1301` | Main Screen | `/due-collect` | `PMS-Customer-Module` |
| **17** | | | Due Paid Collections Audit | `DUE_1302` | Sub-Screen | `/pms-due-paid-payments` | `PMS-Customer-Module` |
| **18** | Customer & Sales | Point of Sale (POS) | Retail POS Counter | `SALE_1401` | Main Screen | `/customer/sale` | `PMS-Sale-Module` |
| **19** | | | Wholesale POS Counter | `SALE_1402` | Main Screen | `/customer/sale?mode=wholesale` | `PMS-Sale-Module` |
| **20** | | | POS Sales Return & Refund | `SALE_1403` | Drawer View | `/customer/sale/return` | `PMS-Sale-Module` |
| **21** | | | Quick Add Product (POS) | `SALE_1404` | Modal Dialog | `/products/quick-add` | `PMS-Product-Module` |
| **22** | | | Quick Add Company (POS) | `SALE_1405` | Modal Dialog | `/products/company/quick-add` | `POS-Shop-Company-Module` |
| **23** | | | Quick Add Generic (POS) | `SALE_1406` | Modal Dialog | `/products/generic/quick-add` | `POS-Shop-Generic-Module` |
| **24** | | Directory | Customer Directory & Ledger | `CUST_1407` | Main Screen | `/customer/list` | `PMS-Customer-Module` |
| **25** | | | Add / Edit Customer Profile | `CUST_1408` | Modal Dialog | `/customer/add` | `PMS-Customer-Module` |
| **26** | | Returns | Customer Return Invoices | `SALE_1409` | Main Screen | `/customer/returns` | `PMS-Sale-Module` |
| **27** | | Sales History | Sales Invoices Audit Log | `SALE_1410` | Main Screen | `/customer/sales` | `PMS-Sale-Module` |
| **28** | Suppliers & Purchases | Directory | Supplier Directory & Ledger | `SUPP_1501` | Main Screen | `/supplier/list` | `PMS-Vendor-Module` |
| **29** | | | Add / Edit Supplier | `SUPP_1502` | Modal Dialog | `/supplier/add` | `PMS-Vendor-Module` |
| **30** | | Purchase Entry | Purchase Invoice Entry (GRN) | `PUR_1503` | Main Screen | `/supplier/purchase` | `PMS-Vendor-Module` |
| **31** | | | Purchase Calculation Selector | `PUR_1504` | Control Drawer | `/supplier/purchase/mode` | `PMS-Vendor-Module` |
| **32** | | | Quick Add Supplier (Purchase) | `PUR_1505` | Modal Dialog | `/supplier/quick-add` | `PMS-Vendor-Module` |
| **33** | | | Quick Add Product (Purchase) | `PUR_1506` | Modal Dialog | `/products/quick-add-pur` | `PMS-Product-Module` |
| **34** | | | Quick Add Company (Purchase) | `PUR_1507` | Modal Dialog | `/products/company/quick-pur` | `POS-Shop-Company-Module` |
| **35** | | | Quick Add Generic (Purchase) | `PUR_1508` | Modal Dialog | `/products/generic/quick-pur` | `POS-Shop-Generic-Module` |
| **36** | | Records | Purchase Invoices Audit | `PUR_1509` | Main Screen | `/supplier/records` | `PMS-Vendor-Module` |
| **37** | Products & Inventory | Stock Master | Master Medicine Catalog | `PROD_1601` | Main Screen | `/products/list` | `PMS-Product-Module` |
| **38** | | | Add Medicine Master | `PROD_1602` | Main Screen | `/products/add` | `PMS-Product-Module` |
| **39** | | Companies | Pharmaceutical Manufacturers | `PROD_1603` | Main Screen | `/products/company` | `POS-Shop-Company-Module` |
| **40** | | | Add Pharmaceutical Company | `PROD_1604` | Modal Dialog | `/products/company/add` | `POS-Shop-Company-Module` |
| **41** | | Generics | Generic Drug Formulations | `PROD_1605` | Main Screen | `/products/generic` | `POS-Shop-Generic-Module` |
| **42** | | | Add Generic Formulation | `PROD_1606` | Modal Dialog | `/products/generic/add` | `POS-Shop-Generic-Module` |
| **43** | | Requisitions | Inventory Requisition Planner | `PROD_1607` | Main Screen | `/products/requisition` | `PMS-Requisition-Module` |
| **44** | | | Requisition Item Selector | `PROD_1608` | Modal Dialog | `/products/requisition/add-item` | `PMS-Requisition-Module` |
| **45** | | | Requisitions Audit History | `PROD_1609` | Main Screen | `/products/requisition/records` | `PMS-Requisition-Module` |
| **46** | | Expiry Alerts | Expired & Near-Expiry Alerts | `PROD_1610` | Main Screen | `/products/expired` | `PMS-Product-Module` |
| **47** | Doctors Portal | Doctors | Medical Practitioners Directory | `DOC_1701` | Main Screen | `/doctors-portal/list` | `Pharmacy-Module` |
| **48** | | | Add / Edit Doctor (Bilingual) | `DOC_1702` | Main Screen | `/doctors-portal/add` | `Pharmacy-Module` |
| **49** | | Prescription | Prescription Pad Settings | `DOC_1703` | Main Screen | `/doctors-portal/settings` | `Pharmacy-Module` |
| **50** | Representatives | Staff Management | Representative User List | `REP_1801` | Main Screen | `/representative` | `Role-Module` |
| **51** | | | Add / Edit Representative | `REP_1802` | Main Screen | `/representative/add` | `Role-Module` |
| **52** | Roles & Security | RBAC | Role Authorization Matrix | `ROLE_1901` | Main Screen | `/roles` | `Role-Module` |
| **53** | | | Add / Edit Role & ACL | `ROLE_1902` | Main Screen | `/roles/add` | `Role-Module` |
| **54** | Settings | POS Rules | Sale Business Rules Config | `CFG_2001` | Main Screen | `/settings/sale-config` | `Pharmacy-Module` |
| **55** | | Print Templates | Thermal Receipt / POS Invoice | `CFG_2002` | Main Screen | `/settings/invoice-config` | `Pharmacy-Module` |
| **56** | | Stock Thresholds | Product Alert Thresholds | `CFG_2003` | Main Screen | `/settings/product-config` | `Pharmacy-Module` |
| **57** | | Loyalty Points | Customer Loyalty Rules | `CFG_2004` | Main Screen | `/settings/loyalty-config` | `Pharmacy-Module` |
| **58** | | SMS Gateway | Bulk SMS Packages & Gateway | `CFG_2005` | Main Screen | `/settings/bulk-sms-config` | `Pharmacy-Module` |
| **59** | Subscription | SaaS Billing | Subscription Status & History | `SUB_2101` | Main Screen | `/subscription-report` | `Pharmacy-Module` |
| **60** | | | bKash Payment Gateway | `SUB_2102` | Action Modal | `/subscription-report/pay-bkash` | `Pharmacy-Module` |
| **61** | Branch Switcher | Multi-Branch | Store / Branch Switcher | `PHAR_2201` | Header Modal | `/change-pharmacy` | `Pharmacy-Module` |
| **62** | Dashboard | Analytics | Executive Financial Dashboard | `DASH_2301` | Main Screen | `/dashboard` | `PMS-Report-Module` |
| **63** | | | Sales Performance & Fast Movers| `DASH_2302` | Sub-Screen | `/dashboard/analytics` | `PMS-Report-Module` |
| **64** | | | Cashbook & Buy/Sale Audit | `DASH_2303` | Sub-Screen | `/dashboard/cashbook` | `PMS-Report-Module` |

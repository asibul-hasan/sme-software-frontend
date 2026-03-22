# Table Name Module Form ID Total Columns Description

1 sys_company System Administration SYS_1001 17 Stores master company profile. Root entity for the entire ERP; every other table references company_no.
2 sys_branch System Administration SYS_1001 13 Branch / outlet registry. Each company can have multiple branches; all transactional tables carry branch_no.
3 sys_financial_year System Administration SYS_1002 9 Defines fiscal years for a company. Only one year may be active at a time. Transactions validate against the active year.
4 sys_currency System Administration SYS_1003 8 Supported currencies. One currency must be marked as base currency. Exchange rates updated manually or via API.
5 sys_tax_config System Administration SYS_1004 10 VAT and tax rules applied to sales and purchase transactions. Multiple rates supported.
6 sys_role System Administration SYS_1102 8 Security roles such as Admin, Manager, Cashier. Permissions are assigned at role level via sys_permission_matrix.
7 sys_user System Administration SYS_1101 13 System users who log in to the ERP. Each user belongs to a company and default branch, and carries a role.
8 sys_user_branch_map System Administration SYS_1104 6 Many-to-many mapping between users and branches. Controls which branches each user can access.
9 sys_permission_matrix System Administration SYS_1103 10 Form-level access control. Each row grants a role permission flags on a specific form (e.g. SAL_1001).
10 sys_activity_log System Administration SYS_1105 11 Immutable audit log. Captures every user action: login, create, edit, delete, approve. Never deleted.
11 sys_menu System Administration SYS_1201 11 Dynamic menu tree. Parent-child structure supports multi-level navigation. Menus can be role-restricted.
12 inv_category Inventory Management INV_1001 7 Top-level product categories e.g. Electronics, Grocery. Foundation of the product hierarchy.
13 inv_subcategory Inventory Management INV_1001 8 Second-level classification under a category e.g. Mobile Phones under Electronics.
14 inv_brand Inventory Management INV_1001 8 Product brand master. Associated to products for brand-wise reporting and filtering.
15 inv_unit Inventory Management INV_1001 6 Units of measurement for products e.g. Pieces, Kg, Litre. Used in all stock movements.
16 inv_product Inventory Management INV_1001 22 Central product master. Links category, subcategory, brand, unit. Carries pricing and stock control settings.
17 inv_warehouse Inventory Management INV_2001 10 Warehouse / stockroom registry. Each warehouse belongs to a specific branch.
18 inv_rack Inventory Management INV_2002 8 Physical rack and shelf locations inside a warehouse. Used for bin-location tracking.
19 inv_opening_stock Inventory Management INV_1101 13 Initial stock quantities entered during ERP go-live. Sets the starting inventory position per product per branch.
20 inv_stock_adjustment Inventory Management INV_1102 15 Records stock corrections due to damage, physical audit variance, or data entry corrections.
21 inv_stock_transfer Inventory Management INV_2003 16 Inter-branch / inter-warehouse stock movement. Status moves from PENDING → APPROVED → RECEIVED.
22 inv_batch Inventory Management INV_2004 11 Tracks batch numbers and expiry dates for batch-controlled products.
23 inv_reorder_level Inventory Management INV_2005 11 Minimum stock thresholds per product per branch. System generates alerts when stock drops to reorder_qty.
24 sal_customer Sales & POS SAL_1101 15 Customer master. Supports walk-in, retail, wholesale, and corporate customer types.
25 sal_pos_session Sales & POS SAL_1003 12 Daily POS session (shift) opened by a cashier. Tracks opening/closing cash for reconciliation.
26 sal_sales_header Sales & POS SAL_1001 21 Master record of each sale transaction – POS, invoice, or held sale. Links to session and customer.
27 sal_sales_detail Sales & POS SAL_1001 14 Line items of a sale. Each row = one product sold. Aggregates up to sal_sales_header totals.
28 sal_customer_payment Sales & POS SAL_1102 13 Records payments received from credit customers against outstanding balances.
29 pur_supplier Procurement PUR_1001 16 Supplier / vendor master. Tracks contact details, credit terms, and outstanding payable balance.
30 pur_purchase_order_header Procurement PUR_1101 17 Purchase order header. Captures supplier, expected delivery, and overall order value.
31 pur_purchase_invoice_header Procurement PUR_1102 19 Supplier invoice received when goods arrive. Updates inventory stock on posting.
32 pur_purchase_return_header Procurement PUR_1103 14 Header for returning goods to supplier. Reduces inventory and creates a credit note.
33 pur_supplier_payment Procurement PUR_1104 13 Payments made to suppliers against outstanding invoices.
34 fin_chart_of_accounts Accounts & Finance FIN_1001 13 Hierarchical chart of accounts (COA). Supports multi-level grouping: Assets, Liabilities, Equity, Income, Expense.
35 fin_voucher_header Accounts & Finance FIN_1101 14 Accounting voucher master. Types: CASH, BANK, JOURNAL, CONTRA. All financial entries flow through vouchers.
36 fin_expense_entry Accounts & Finance FIN_1202 13 Operational expense records. Auto-posts to the linked account in the ledger.
37 fin_branch_ledger Accounts & Finance FIN_2001 13 Detailed ledger entries per branch and account. Running balance maintained for real-time position.
38 fin_inter_branch_transfer Accounts & Finance FIN_2002 12 Financial transfers between branches. Used for inter-branch fund movements and settlement.
39 hr_employee Human Resource HR_1001 22 Employee master record. Stores personal, job, and employment information.
40 hr_attendance Human Resource HR_1101 13 Daily attendance records. Supports manual entry, biometric device import, and adjustments.
41 hr_salary_structure Human Resource HR_1201 16 Defines salary components for each employee. A new row is added each time salary is revised.
42 hr_payroll_process Human Resource HR_1202 19 Monthly payroll calculation per employee. Tracks attendance-based deductions, overtime, and net pay.

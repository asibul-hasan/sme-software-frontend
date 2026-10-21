# Aidly ERP (Web Client) — Business & Architecture Documentation

This directory contains the complete business architecture, database schemas, form validation rules, design guides, and user manuals for the **Aidly SME Business ERP (`apps/web-client`)**.

---

## 📁 Documentation Structure

```text
apps/web-client/docs/
├── business-logic/        # High-level module business rules and domain logic
├── database-schemas/      # PostgreSQL table schemas, column types, and constraints
├── form-business/         # Form-by-form business logic, field validations, and events
├── design-guides/         # AG Grid standards, form design rules, and payroll engine plans
└── user-manuals/          # Markdown and official Word user manuals (.docx)
```

---

## 📘 1. Business Logic (`business-logic/`)
- **[`fin-business.md`](./business-logic/fin-business.md)**: Finance, Accounts Payable/Receivable, Chart of Accounts, Journal Vouchers.
- **[`hrm-business.md`](./business-logic/hrm-business.md)**: Human Resource Management, Employee Profiles, Attendance, Leave Allocations, Salary Structuring.
- **[`inv-business.md`](./business-logic/inv-business.md)**: General Inventory, Warehouse Management, Stock Levels, and Item Requisitions.
- **[`pur-business.md`](./business-logic/pur-business.md)**: Commercial Purchasing, Supplier Quotes, Purchase Orders, and Goods Receipts.
- **[`sal-business.md`](./business-logic/sal-business.md)**: Sales Orders, Commercial Delivery Chalan, Invoicing, and Customer Ledgers.
- **[`sys-business.md`](./business-logic/sys-business.md)**: System Administration, Roles, Permission Matrices, and Multi-Branch Management.

---

## 💾 2. Database Schemas (`database-schemas/`)
- **[`fin-db.md`](./database-schemas/fin-db.md)**: Financial ledger and account tables.
- **[`hrm-db.md`](./database-schemas/hrm-db.md)**: Employee, department, designation, and payroll schema.
- **[`inv-db.md`](./database-schemas/inv-db.md)**: Inventory tracking and store tables.
- **[`pur-db.md`](./database-schemas/pur-db.md)**: Purchase order and supplier procurement schema.
- **[`sal-db.md`](./database-schemas/sal-db.md)**: Sales invoice and customer ordering schema.
- **[`sys-db.md`](./database-schemas/sys-db.md)**: Users, roles, menus, and audit log schema.

---

## 📝 3. Form Business Logic (`form-business/`)
- **[`fin-form-business.md`](./form-business/fin-form-business.md)**: Validation and behavior for voucher entry and bank reconciliation.
- **[`hrm-form-business.md`](./form-business/hrm-form-business.md)**: Validation for employee onboarding, leave application, and payroll generation.
- **[`inv-form-business.md`](./form-business/inv-form-business.md)**: Item definition, unit configuration, and stock transfer forms.
- **[`pur-form-business.md`](./form-business/pur-form-business.md)**: Purchase requisition and supplier bill forms.
- **[`sal-form-business.md`](./form-business/sal-form-business.md)**: Sales quote, sales order, and invoice collection forms.
- **[`sys-form-business.md`](./form-business/sys-form-business.md)**: User creation, branch configuration, and role assignment forms.

---

## 🎨 4. Design Guides (`design-guides/`)
- **[`form-design-guide.md`](./design-guides/form-design-guide.md)**: Master standard for Angular + NG-ZORRO enterprise form layouts.
- **[`form-design-standard.md`](./design-guides/form-design-standard.md)**: Micro-interaction and spacing rules.
- **[`ag-grid-remediation-plan.md`](./design-guides/ag-grid-remediation-plan.md)**: Data grid virtual scrolling, sorting, and inline editing patterns.
- **[`hrm-payroll-standard-plan.md`](./design-guides/hrm-payroll-standard-plan.md)**: Monthly payroll processing architecture.

---

## 📖 5. User Manuals (`user-manuals/`)
- **[`fin-user-manual.md`](./user-manuals/fin-user-manual.md)**: Finance Module end-user handbook.
- **Word Manuals (`user-manuals/docx/`)**:
  - `Aidly_ERP_Finance_Module_User_Manual.docx`
  - `Aidly_ERP_HRM_Module_User_Manual.docx`
  - `Aidly_ERP_SYS_Module_User_Manual.docx`
  - `HRM_Leave module.docx`
  - `leave management HR doc.docx`

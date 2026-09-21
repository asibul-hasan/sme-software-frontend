# Aidly PMS — Documentation Repository

This directory contains the business architecture, middleware data contracts, and technical specifications for the **Aidly Pharmacy Management System & POS (Aidly PMS)**.

---

## 📁 Documentation Inventory

### 1. 📘 Business Architecture & Middleware Specification
- **[`MIDDLEWARE-FIELD-TO-FIELD-BUSINESS-SPECIFICATION.md`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/docs/MIDDLEWARE-FIELD-TO-FIELD-BUSINESS-SPECIFICATION.md)**
  - Master field-to-field data dictionaries across all 10 modules:
    - `sys_` Core System, Multi-Tenancy & Multi-Branch (`pharmacy_no` Business Tenant & `branch_no` Physical Store standard, gap-safe document sequencing, outbox, idempotency, audit trail)
    - `prod_` Products, Generics, Formulations & Master Catalog (Schedule H prescription & narcotic flags; `company_no` retained strictly for Pharmaceutical Manufacturers like Square/Beximco)
    - `inv_` Stock Ledger, Batches, Inter-Branch Transfers (`inv_transfers`), Stocktakes & Adjustments (`inv_adjustments`), and Universal Stock Movement
    - `supp_` & `pur_` Suppliers, Procurement, Supplier Payments (`pur_supplier_payments`) & Supplier Debit Note Returns (`pur_purchase_returns`)
    - `cust_` & `sale_` POS Sales Engine, Split Tender Payments (`sale_invoice_payments`), Prescription Linkages & Over-Return Protected Sales Returns
    - `cash_` & `due_` Shift Closings with Blind Count, Multi-Tender Digital Settlements & Customer Due Collections
    - `acc_` Chart of Accounts (5 root categories), Operating Expenses, Incomes, Reconciliations & Universal Financial Ledger
    - `doc_` Doctor E-Prescription Portal (Bilingual EN/BN)
    - `cfg_` Business Configurations & 80mm Thermal Receipt Printing
    - `sub_` SaaS Subscriptions & Payment Gateways
  - **The Universal Two-Tier Transaction Ledger Architecture**:
    - `acc_transaction_ledger`: Single centralized table for all financial double-entry postings (with COGS & inventory relief on every sale).
    - `inv_stock_movement`: Single centralized table for all physical stock movements.
  - **Core Engineering Principles**:
    - Middleware is the sole calculation authority (`BigDecimal` / arbitrary-precision decimal).
    - Synchronous database transaction posting for ledgers + Transactional Outbox for asynchronous external side-effects.
    - Strict financial data preservation (`ON DELETE RESTRICT` across all financial and ledger tables).

---

### 2. 💾 PostgreSQL Database Schemas
Located in [`apps/aidlyPms/database/`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/):
- **[`schema.sql`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/schema.sql)** & **[`db_script.sql`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/db_script.sql)**:
  - 57 relational tables strictly implementing PostgreSQL 14+ standards.
  - Standardized Option A tenancy: `pharmacy_no` (Business Tenant/Org) + `branch_no` (Physical Outlet) on all tables; `company_no` scoped strictly to drug manufacturers in `prod_companies`.
  - Byte-identical schema files verified by SHA-256 checksums.
  - Partitioned B-Tree indexes, parent-FK indexes on all line items, and declarative CHECK constraints.
  - Zero database triggers, no default auto-sequences, and explicit application-managed identifiers.
- **[`menu.md`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/menu.md)** & **[`menu.json`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/menu.json)**:
  - Complete navigation structure, screens, and permission nodes.
- **[`label_values.json`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/database/label_values.json)**:
  - Dictionary of frontend lookup codes and dropdown options stored as `SMALLINT` in PostgreSQL.

---

### 3. 🎨 UI & Frontend Guidelines
- **[`claude.md`](file:///c:/pridesys/apps/sme/aidlyErp/sme-software-frontend/apps/aidlyPms/claude.md)**:
  - Architecture standards for the Angular + NG-ZORRO frontend.
  - Universal `BaseEntity` data-binding rules and zero hardcoded business data policy.

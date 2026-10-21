# Aidly PMS — Architecture & Technical Documentation

This directory contains the business architecture, middleware data contracts, clinical safety blueprints, POS specifications, and market standard gap analyses for the **Aidly Pharmacy Management System & POS (`apps/aidlyPms`)**.

---

## 📁 PMS Documentation Index

### 1. 📘 Core Business & Middleware Specifications
- **[`MIDDLEWARE-FIELD-TO-FIELD-BUSINESS-SPECIFICATION.md`](./MIDDLEWARE-FIELD-TO-FIELD-BUSINESS-SPECIFICATION.md)**:
  - Master field-to-field data dictionaries across all 10 pharmacy modules:
    - `sys_`: Multi-tenancy (`pharmacy_no`), physical branch (`branch_no`), gap-safe document sequencing, outbox, idempotency, audit trail.
    - `prod_`: Medicine catalog, generics, strengths, formulations, Schedule-H / narcotic flags, manufacturer tracking.
    - `inv_`: Physical stock ledger, batches, FEFO allocation, inter-branch transfers (`inv_transfers`), stocktakes & adjustments (`inv_adjustments`).
    - `supp_` & `pur_`: Suppliers, pharmaceutical procurement, bonus strips costing, supplier payments, and purchase returns.
    - `cust_` & `sale_`: Retail & wholesale POS engine, split tender payments (`sale_invoice_payments`), prescription linkages.
    - `cash_` & `due_`: Blind cash closing, digital settlements (bKash/Nagad), customer due collections.
    - `acc_`: Double-entry pharmacy chart of accounts, COGS relief, expenses, incomes, bank/cash reconciliation.
    - `doc_`: Doctor E-Prescription Portal (Bilingual EN/BN).
    - `cfg_`: 80mm thermal receipt printing, SMS alerts, loyalty configs.
    - `sub_`: SaaS subscriptions & billing.

### 2. 🛒 POS & Sales Engine
- **[`pos-build-plan.md`](./pos-build-plan.md)**:
  - Technical architecture for the high-speed keyboard-first POS counter terminal.
  - Multi-tender split payment workflows (Cash, Card, bKash, Nagad, Rocket, Upay).
  - Wholesale vs retail packaging conversions (Pcs per Box, Strip per Box).
  - Fast barcode scanning and virtualized medicine catalog dropdowns.

### 3. ⚖️ Financial & Inventory Accounting
- **[`acc-business-doc.md`](./acc-business-doc.md)**:
  - Dual-ledger financial accounting rules for pharmacy businesses.
  - Real-time COGS posting and inventory asset relief on every confirmed sale invoice.
  - Supplier accounts payable and customer accounts receivable settlement cycles.
- **[`PUR-COMPLETION-PLAN.md`](./PUR-COMPLETION-PLAN.md)**:
  - Implementation roadmap for goods receiving notes (GRN), purchase invoices, and bonus strips costing.
- **[`inv_schema_postgres.sql`](./inv_schema_postgres.sql)**:
  - Complete PostgreSQL DDL reference for inventory stock movements, transfers, and adjustments.

### 4. 🏥 Clinical Safety, DGDA & Market Standards
- **[`aidly_pms_market_standard_roadmap.md`](./aidly_pms_market_standard_roadmap.md)**:
  - Ground-truth evaluation of Aidly PMS against Bangladesh pharmacy market standards (DGDA Model Pharmacy guidelines & NBR Mushak-6.3 compliance).
  - Server-side FEFO expiry guards and hard blocks on sales of expired stock.
  - Statutory BIN & Drug License receipt printing requirements.
  - Pareto ABC & FSN velocity stock reporting.

### 5. 💾 Database Schemas & Dictionaries
Located in [`apps/aidlyPms/database/`](../database/):
- **[`schema.sql`](../database/schema.sql)** & **[`db_script.sql`](../database/db_script.sql)**: 57 relational tables with 100% field-to-field parity.
- **[`label_values.json`](../database/label_values.json)**: Dictionary of frontend lookup codes and dropdown options stored as `SMALLINT` in PostgreSQL.
- **[`menu.json`](../database/menu.json)** & **[`menu.md`](../database/menu.md)**: Full navigation taxonomy with Bengali (`name_bn`) translations.

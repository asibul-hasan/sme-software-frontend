# Master Middleware Business Architecture & Field-to-Field Domain Specification
## Enterprise Pharmacy Management System (Aidly PMS) & Enterprise SME ERP (Aidly ERP)
### Authoritative Middleware Engineering Guide · Field-to-Field Data Contracts · Concurrency & Edge-Case Solutions · Production Best Practices

---

## Executive Summary & Architectural Manifesto

This document provides the exhaustive, module-by-module technical specification for designing and implementing the **Middleware Business Layer** across **Aidly PMS** and **Aidly ERP**.

In an enterprise healthcare, pharmacy, and retail SME ecosystem, the middleware layer serves as the **sole authority of business truth**. While client applications (Angular frontend, mobile POS, thermal kiosks) render interfaces and collect user intent, the middleware is strictly responsible for:
1. **Deterministic Financial Integrity & Sole Calculation Authority**: The server/middleware is the sole source of truth for all mathematical calculations (line item extensions, discount allocations, VAT assessments, round-offs, COGS relief, running balances, and moving average costing). Client-submitted values are strictly treated as advisory inputs to validate against server calculations.
2. **Synchronous Two-Tier Single Ledger Standard**:
   - Financial and inventory ledgers are updated **synchronously in the exact same database transaction** as the originating document to guarantee real-time consistency.
   - Dual-tier pattern: Operational business documents (`sale_invoices`, `pur_purchase_invoices`, `pur_supplier_payments`, etc.) capture specialized transaction metadata, while **a SINGLE universal financial ledger (`acc_transaction_ledger`)** and **a SINGLE stock ledger (`inv_stock_movement`)** record immutable balanced accounting and inventory movements.
   - The Transactional Outbox (`sys_event_outbox`) is reserved strictly for **asynchronous external side-effects** (SMS alerts, push notifications, third-party fiscal device reporting, webhook broadcasts).
3. **Pure Pharmacy Multi-Tenant Multi-Branch Standard (Option A)**: Every database table and domain entity strictly implements the `BaseEntity` contract containing:
   - `pharmacy_no BIGINT NOT NULL`: The Pharmacy Business Organization / Parent Tenant Entity (`sys_pharmacies`).
   - `branch_no BIGINT NOT NULL`: Physical Pharmacy Store / Retail Branch / Warehouse Outlet (`sys_branches`).
   - *Note on Pharmaceutical Companies*: In `prod_companies`, `company_no` refers specifically to the drug manufacturer (e.g. *Square, Beximco, Incepta*), cleanly eliminating previous triple-key redundancies.
4. **Strict Financial Data Preservation (`ON DELETE RESTRICT`)**: All financial ledgers, operational invoices, supplier bills, payment records, customer/supplier ledgers, and inventory movement logs enforce `ON DELETE RESTRICT`. Cascade-deletions on financial records are strictly prohibited; reversals and corrections must be made through explicit append-only reversal entries.
5. **Real Enterprise Chart of Accounts (COA)**: Five standardized root categories (`1: ASSET, 2: LIABILITY, 3: EQUITY, 4: REVENUE, 5: EXPENSE`) with standard account codes (`10101` Cash, `10201` Bank, `10301` AR, `10401` Inventory Asset, `10501` Input VAT Asset, `20101` AP, `20201` Output VAT Payable, `30101` Owner Equity, `40101` Sales Revenue, `40102` Sales Returns, `50101` COGS, `50201` Operating Expenses).
6. **COGS & Inventory Relief on Every Sale & Return**:
   - On Sale: Synchronously Debit `50101 COGS` and Credit `10401 Merchandise Inventory Asset`.
   - On Sale Return: Synchronously Debit `10401 Merchandise Inventory Asset` and Credit `50101 COGS` for restocked inventory.
7. **Clinical Safety & Regulatory Compliance**: First-Expired-First-Out (FEFO) dispensing based on dynamic date checks (`expiry_date >= CURRENT_DATE` in Asia/Dhaka time zone), prescription requirements (`is_prescription_required`, `is_narcotic`), and doctor prescription linkages (`prescription_no`).
8. **Zero Database-Trigger Policy**: Executing all validations, sequential document number generation, moving average costing (MAC), and cross-module accounting events in middleware application services—treating PostgreSQL strictly as an ACID relational persistence store without stored procedures, triggers, or generated columns.

---

## 0. Universal Middleware Architecture & Core Standards

### 0.1 Layered Architecture Pattern (Clean / Hexagonal)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway / Presentation Layer                              │
│         (Spring Boot / Node.js NestJS REST Controllers · RFC 7807 Problem Details)       │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ DTOs (Validated by Jakarta / Class-Validator)
┌───────────────────────────────────────────▼─────────────────────────────────────────────┐
│                           Domain Application Services                                  │
│   (SalSalePostingService · InvStockPostingService · PurPurchaseService · FinPosting)    │
│   - Transaction Boundary (@Transactional isolation = READ_COMMITTED)                    │
│   - Pessimistic Concurrency Controls on Batches (FEFO SELECT ... FOR UPDATE)            │
│   - Idempotency Gate (X-Client-UUID via sys_idempotency_log)                            │
│   - Mandatory Tenancy Injection: pharmacy_no & branch_no injected from JWT Claims       │
│   - Synchronous Ledger Posting: acc_transaction_ledger + inv_stock_movement             │
│   - Outbox Enqueue: sys_event_outbox for async side-effects                             │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Domain Models & Aggregates
┌───────────────────────────────────────────▼─────────────────────────────────────────────┐
│                            Domain Entities & Repositories                               │
│           (Hibernate / TypeORM Entities · Custom Spring Data / Knex Repositories)       │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ SQL (ANSI SQL compliant with PostgreSQL 14+)
┌───────────────────────────────────────────▼─────────────────────────────────────────────┐
│                           PostgreSQL Database Engine                                    │
│  EVERY table includes: pharmacy_no BIGINT NOT NULL & branch_no BIGINT NOT NULL          │
│  (sys_*, prod_*, inv_*, supp_*, pur_*, cust_*, sale_*, cash_*, due_*, acc_*, doc_*, cfg_)│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 0.2 Universal Entity Base Contract (`BaseEntity`)
Every table and entity across all modules inherits the following universal schema definition:
```sql
pharmacy_no BIGINT NOT NULL REFERENCES sys_pharmacies(pharmacy_no) ON DELETE RESTRICT,
branch_no BIGINT NOT NULL REFERENCES sys_branches(branch_no) ON DELETE RESTRICT,
```
- **`pharmacy_no`**: Identifies the pharmacy enterprise, cloud tenant account, tax registration, and root general ledger.
- **`branch_no`**: Identifies the specific physical location, cash register terminal cluster, warehouse bin, and localized inventory ledger.
- **Client Immobility**: Clients are strictly forbidden from passing `pharmacy_no` and `branch_no` in request bodies to alter record ownership. The middleware security context extracts these two verified claims from the cryptographically signed JWT token (`X-Pharmacy-No`, `X-Branch-No`) and injects them automatically before persistence.

### 0.3 Universal Data Representation Standards
- **Monetary Values**: All prices, subtotals, discounts, taxes, and ledgers are handled as **`BigDecimal`** (Java) or **Arbitrary-Precision Decimal libraries** (TypeScript/Node) with a minimum database scale of `NUMERIC(20, 4)`. **Floating-point types (`float`, `double`, JS `number`) are strictly prohibited in financial calculation paths.**
- **Physical Quantities**: Stored as `INT` for discrete pharmacy units (pieces, tablets, capsules, bottles) or `NUMERIC(18, 4)` for bulk/fractional products.
- **Audit Block**: Every root domain entity persists:
  `created_by_user_no`, `created_at` (TIMESTAMPTZ), `updated_by_user_no`, `updated_at` (TIMESTAMPTZ), `is_active` (BOOLEAN), and `row_version` (INT for optimistic locking).
- **Idempotency Guard**: All mutating POST/PUT endpoints accept a standard header `X-Client-UUID: {uuid}`. The middleware stores this key in `sys_idempotency_log` for 24 hours. Replayed requests return the identical HTTP response payload without re-executing transactions.

---

# Module 1: `sys_` Core System, Pharmacy Tenancy, Multi-Branch & Infrastructure

## 1.1 Business Domain Overview
The `sys_` module governs pharmacy tenant boundaries (`sys_pharmacies`), branch store hierarchies (`sys_branches`), multi-branch user access rules, granular Role-Based Access Control (RBAC), sequential document numbering (`sys_doc_sequence`), asynchronous event outbox dispatching (`sys_event_outbox`), idempotency logs (`sys_idempotency_log`), and enterprise audit trails (`sys_audit_logs`).

## 1.2 Field-to-Field Data Dictionary

### Table: `sys_pharmacies` (Pharmacy Business Organization / Tenant)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Primary Key, Not Null | Application-generated Sequence ID | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Auto-generated standard RFC 4122 v4 UUID on creation | Public Tenant Identifier |
| `name` | `name` | `VARCHAR(200)` | Not Blank, Max 200 | Pharmacy commercial business name | Audited |
| `tradeLicenseNo` | `trade_license_no` | `VARCHAR(100)` | Optional | Commercial trade registration number | Audited |
| `tinNo` | `tin_no` | `VARCHAR(100)` | Optional | Taxpayer Identification Number | Audited |
| `binNo` | `bin_no` | `VARCHAR(100)` | Optional | Business Identification / VAT Number | Audited |
| `drugLicenseNo` | `drug_license_no` | `VARCHAR(100)` | DGDA format | Central Drug License Number | Audited |
| `contactPhone` | `contact_phone` | `VARCHAR(20)` | Not Blank | Normalized to international E.164 standard | Audited |
| `contactEmail` | `contact_email` | `VARCHAR(100)` | Email format, Nullable | Corporate notification email | Audited |
| `address` | `address` | `TEXT` | Not Blank | Registered headquarters street address | Audited |
| `district` | `district` | `VARCHAR(100)` | Not Blank | Administrative district for fiscal tax compliance | Audited |
| `isActive` | `is_active` | `BOOLEAN` | Not Null, Default `true` | When `false`, all child branches and users are immediately blocked | Root Admin Only |

### Table: `sys_branches` (Store Branches / Pharmacy Outlets)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `branchNo` | `branch_no` | `BIGINT` | Primary Key, Not Null | Application-generated Branch ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Parent pharmacy tenant boundary | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Public Branch Identifier | Public Reference |
| `name` | `name` | `VARCHAR(200)` | Not Blank, Max 200 | Store branch outlet title (e.g. `Main Branch (Banani)`) | Audited |
| `drugLicenseNo` | `drug_license_no` | `VARCHAR(100)` | Not Blank for PMS | DGDA Drug License Number registered for this location | Audited |
| `contactPhone` | `contact_phone` | `VARCHAR(20)` | Not Blank | Branch primary hotline | Audited |
| `contactEmail` | `contact_email` | `VARCHAR(100)` | Email format | Branch invoice alert email | Audited |
| `address` | `address` | `TEXT` | Not Blank | Physical store premises address | Audited |
| `district` | `district` | `VARCHAR(100)` | Not Blank | Administrative district for fiscal tax compliance | Audited |
| `postalCode` | `postal_code` | `VARCHAR(20)` | Optional | Postal dispatch code | Audited |
| `isActive` | `is_active` | `BOOLEAN` | Not Null, Default `true` | When `false`, prevents new POS billing or purchase receiving | Admin Only |

### Table: `sys_doc_sequence` (Gap-Safe Sequential Document Number Generator)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `sequenceNo` | `sequence_no` | `BIGINT` | Primary Key | Internal sequence identifier | System Only |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` | Pharmacy partition | System Only |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` | Branch isolation partition | System Only |
| `docType` | `doc_type` | `VARCHAR(50)` | Values: `SALE_INVOICE, PUR_INVOICE, PUR_RETURN, SALE_RETURN, TRANSFER, ADJUSTMENT, EXPENSE, INCOME, DUE_COLL, SUPP_PAY` | Document family code | Immutable |
| `finYear` | `fin_year` | `VARCHAR(10)` | Format: `YYYY` (e.g. `2026`) | Current fiscal year partition | Immutable |
| `lastSeqNumber` | `last_seq_number` | `BIGINT` | Not Null, Min 0 | Incremented atomically via `SELECT ... FOR UPDATE` | System Only |
| `prefixFormat` | `prefix_format` | `VARCHAR(50)` | e.g. `POS-{BRANCH}-{YEAR}-{SEQ:6}` | Evaluated dynamically (e.g. `POS-01-2026-000452`) | System Only |

### Table: `sys_event_outbox` (Transactional Event Outbox)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `eventNo` | `event_no` | `BIGINT` | Primary Key | Monotonic event sequence ID | System Only |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` | Pharmacy boundary | System Only |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` | Branch boundary | System Only |
| `aggregateType` | `aggregate_type` | `VARCHAR(50)` | e.g. `SALE_INVOICE, STOCK_MOVEMENT` | Aggregate domain entity | System Only |
| `aggregateId` | `aggregate_id` | `BIGINT` | Not Null | Identifier of affected entity | System Only |
| `eventType` | `event_type` | `VARCHAR(100)` | e.g. `SaleConfirmed, LowStockAlert` | Event name | System Only |
| `payload` | `payload` | `TEXT` | Valid JSON | Full event state payload | System Only |
| `status` | `status` | `SMALLINT` | Values: `1: Pending, 2: In Process, 3: Completed, 4: Failed Dead Letter` | Dispatch lifecycle state | System Only |
| `retryCount` | `retry_count` | `INT` | Min 0, Max 5 | Exponential backoff retry counter | System Only |

### Table: `sys_idempotency_log` (API Request Idempotency Guard)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `idempotencyNo` | `idempotency_no` | `BIGINT` | Primary Key | Monotonic log ID | System Only |
| `idempotencyKey` | `idempotency_key` | `VARCHAR(128)` | Unique per `pharmacy_no` | Extracted from `X-Client-UUID` header | Client Supplied |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` | Pharmacy tenant isolation | System Only |
| `endpoint` | `endpoint` | `VARCHAR(255)` | Not Blank | Target API route (e.g. `/api/v1/pos/sales`) | System Only |
| `requestHash` | `request_hash` | `VARCHAR(64)` | SHA-256 hex | Hash of incoming request body | System Only |
| `responseStatus` | `response_status` | `INT` | HTTP Status (e.g. 200, 201) | Cached response code | System Only |
| `responsePayload`| `response_payload`| `TEXT` | JSON response payload | Cached response body returned on replay | System Only |
| `expiresAt` | `expires_at` | `TIMESTAMPTZ` | Index for cleanup | Standard TTL: `created_at + INTERVAL '24 hours'` | System Only |

### Table: `sys_audit_logs` (Enterprise Tamper-Proof Audit Trail)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `auditNo` | `audit_no` | `BIGINT` | Primary Key | Monotonic audit sequence | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` | Pharmacy tenant | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` | Physical branch location | Immutable |
| `userNo` | `user_no` | `BIGINT` | Foreign Key -> `sys_users` | Operator who executed mutation | Immutable |
| `tableName` | `table_name` | `VARCHAR(100)` | Not Blank | Modified table name | Immutable |
| `recordId` | `record_id` | `BIGINT` | Not Null | Primary key of modified row | Immutable |
| `action` | `action` | `VARCHAR(20)` | Values: `INSERT, UPDATE, DELETE, VOID` | Mutation operation type | Immutable |
| `oldData` | `old_data` | `TEXT` | JSON snapshot | State before modification | Immutable |
| `newData` | `new_data` | `TEXT` | JSON snapshot | State after modification | Immutable |
| `ipAddress` | `ip_address` | `VARCHAR(45)` | IPv4 / IPv6 format | Originating client network address | Immutable |

---

# Module 2: `prod_` Products, Generics, Formulations & Catalog

## 2.1 Business Domain Overview
The `prod_` module manages pharmaceutical catalogs, generic chemical formulations, drug manufacturers (`prod_companies`), packaging unit conversions, prescription requirements, and purchase order requisitions.

## 2.2 Field-to-Field Data Dictionary

### Table: `prod_companies` (Pharmaceutical Manufacturers / Medicine Companies)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `companyNo` | `company_no` | `BIGINT` | Primary Key, Not Null | Unique Manufacturer ID (e.g. Beximco = 1, Square = 2) | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy boundary | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch boundary | Immutable |
| `name` | `name` | `VARCHAR(200)` | Not Blank, Max 200 | Drug manufacturer commercial name | Audited |
| `isActive` | `is_active` | `BOOLEAN` | Not Null | Operational status | Audited |

### Table: `prod_products` (Master Medicine Catalog)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `productNo` | `product_no` | `BIGINT` | Primary Key, Not Null | Unique Product Sequence ID | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Public Product Identifier | Public Reference |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Store ID | Immutable |
| `companyNo` | `company_no` | `BIGINT` | Foreign Key -> `prod_companies` ON DELETE RESTRICT | Pharmaceutical manufacturer reference | Audited |
| `genericNo` | `generic_no` | `BIGINT` | Foreign Key -> `prod_generics`, Nullable | Chemical active ingredient formulation | Audited |
| `productName` | `product_name` | `VARCHAR(255)` | Not Blank, Max 255 | Commercial brand name; indexed with `(pharmacy_no, branch_no)` | Audited |
| `strength` | `strength` | `VARCHAR(100)` | Optional (e.g. `500mg, 20mg, 10mg/5ml`) | Strength specification | Audited |
| `volume` | `volume` | `VARCHAR(100)` | Optional (e.g. `100ml, 60ml`) | Volume specification for liquid/syrup formulations | Audited |
| `medicineType` | `medicine_type` | `SMALLINT` | Values: `1: Tablet, 2: Capsule, 3: Syrup, 4: Suspension, 5: Drop, 6: Injection, 7: Ointment, 8: Gel, 9: Cream, 10: Inhaler, 11: Suppository, 12: Powder, 99: Other` | Dosage form | Audited |
| `unitType` | `unit_type` | `SMALLINT` | Values: `1: PIECE, 2: STRIP, 3: BOX, 4: BOTTLE, 5: TUBE, 6: VIAL, 7: AMPOULE, 8: PACKET` | Smallest dispensable base unit | Audited |
| `quantityPerBox` | `quantity_per_box` | `INT` | Min 1, Not Null | Multiplier ratio converting wholesale box to pieces | Audited |
| `costPerBox` | `cost_per_box` | `NUMERIC(20, 4)` | Min 0, Not Null | Master purchase price per box | Audited |
| `salePricePerBox` | `sale_price_per_box` | `NUMERIC(20, 4)` | Min 0, Not Null | Master retail price per box | Audited |
| `avgPurchasePricePerPiece` | `avg_purchase_price_per_piece` | `NUMERIC(20, 4)` | Min 0, Not Null | **Server-calculated Moving Average Cost (MAC)** | System Only |
| `purchasePricePerPiece` | `purchase_price_per_piece` | `NUMERIC(20, 4)` | Min 0, Not Null | Derived: `cost_per_box / quantity_per_box` | System Computed |
| `salePricePerPiece` | `sale_price_per_piece` | `NUMERIC(20, 4)` | Min 0, Not Null | Derived: `sale_price_per_box / quantity_per_box` | Audited |
| `wholesalePricePerBox` | `wholesale_price_per_box` | `NUMERIC(20, 4)` | Min 0, Not Null | Wholesale B2B rate per box | Audited |
| `wholesalePricePerPiece`| `wholesale_price_per_piece`| `NUMERIC(20, 4)` | Min 0, Not Null | Wholesale unit price | Audited |
| `isMedicine` | `is_medicine` | `BOOLEAN` | Not Null | Differentiates pharmaceuticals from consumer retail | Audited |
| `isPrescriptionRequired`| `is_prescription_required`| `BOOLEAN` | Not Null | Schedule H drug flag: requires `prescription_no` at POS | Clinical Safety |
| `isNarcotic` | `is_narcotic` | `BOOLEAN` | Not Null | Controlled narcotic substance flag: strict auditing | Clinical Safety |
| `minStockQtyPcs` | `min_stock_qty_pcs` | `INT` | Min 0, Not Null | Reorder alert threshold | Audited |
| `rakNumber` | `rak_number` | `VARCHAR(50)` | Optional | Shelf/bin coordinates | Audited |
| `isActive` | `is_active` | `BOOLEAN` | Not Null | Soft-disable catalog item | Audited |

---

# Module 3: `inv_` Inventory Operations, Stock Movements, Transfers & Adjustments

## 3.1 Business Domain Overview
The `inv_` module maintains exact physical stock balances, batch expiry dates, inter-branch transfers (`inv_transfers`), stocktakes & adjustments (`inv_adjustments`), and the append-only stock movement ledger (`inv_stock_movement`).

## 3.2 Field-to-Field Data Dictionary

### Table: `prod_product_batches` (Batch & Expiry Ledger)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `batchNo` | `batch_no` | `BIGINT` | Primary Key, Not Null | Unique Batch ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Store Location | Immutable |
| `productNo` | `product_no` | `BIGINT` | Foreign Key -> `prod_products` ON DELETE RESTRICT | Master medicine reference | Immutable |
| `batchNumber` | `batch_number` | `VARCHAR(100)` | Not Blank | Alphanumeric batch code; unique per `(pharmacy_no, branch_no, product_no, batch_number)` | Indexed |
| `expiryDate` | `expiry_date` | `DATE` | Not Null | Expiration cutoff date (dynamic FEFO check against `CURRENT_DATE`) | Critical Safety |
| `boxQuantity` | `box_quantity` | `INT` | Min 0, Not Null | Remaining stock in unopened boxes | System Computed |
| `quantityInBox` | `quantity_in_box` | `INT` | Min 1, Not Null | Packaging ratio snapshot at receipt | Immutable |
| `totalQuantityPcs` | `total_quantity_pcs` | `INT` | Min 0, Not Null | Total available loose pieces in batch | System Computed |
| `costPerBox` | `cost_per_box` | `NUMERIC(20, 4)` | Min 0, Not Null | Specific batch purchase cost | Audited |
| `salePricePerBox` | `sale_price_per_box` | `NUMERIC(20, 4)` | Min 0, Not Null | Specific batch retail price | Audited |
| `vatPercent` | `vat_percent` | `NUMERIC(20, 4)` | Min 0, Max 100 | Applicable VAT rate | Audited |
| `isExpired` | `is_expired` | `BOOLEAN` | Not Null | Maintained for legacy queries; business logic validates `expiry_date >= CURRENT_DATE` | Audited |

### Table: `inv_stock_movement` (Universal Single Stock Ledger Core)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `movementNo` | `movement_no` | `BIGINT` | Primary Key | Unique transaction log ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Store Location | Immutable |
| `productNo` | `product_no` | `BIGINT` | Foreign Key -> `prod_products` ON DELETE RESTRICT | Master product reference | Immutable |
| `batchNo` | `batch_no` | `BIGINT` | Foreign Key -> `prod_product_batches`, Nullable | Associated batch reference | Immutable |
| `movementType` | `movement_type` | `SMALLINT` | Values: `1: Purchase (+), 2: Opening (+), 3: Customer Return (+), 4: POS Sale (-), 5: Supplier Return (-), 6: Transfer In (+), 7: Transfer Out (-), 8: Adjustment (+/-)` | Movement nature | Immutable |
| `referenceDocType`| `reference_doc_type`| `VARCHAR(50)` | Values: `'SALE_INVOICE', 'PUR_INVOICE', 'SALE_RETURN', 'PUR_RETURN', 'TRANSFER', 'ADJUSTMENT'` | Originating document family | Immutable |
| `referenceDocNo` | `reference_doc_no` | `VARCHAR(100)` | Not Blank | e.g. `POS-01-2026-000452, TR-01-2026-00012` | Traceability |
| `referenceDocId` | `reference_doc_id` | `BIGINT` | Not Null | Primary key ID of source document | Immutable |
| `qtyPcs` | `qty_pcs` | `INT` | Signed (non-zero) | Positive for stock IN, negative for stock OUT | Immutable |
| `unitCost` | `unit_cost` | `NUMERIC(20, 6)` | Min 0, Not Null | Valuation cost at the instant of transaction | Immutable |
| `balanceAfterPcs` | `balance_after_pcs` | `INT` | Min 0, Not Null | Post-transaction stock snapshot | Immutable |
| `remarks` | `remarks` | `TEXT` | Optional | Reason for movement | Audited |

### Table: `inv_transfers` & `inv_transfer_items` (Inter-Branch Transfers)
- **`inv_transfers`**:
  - `transfer_no` (PK), `pharmacy_no`, `branch_no` (originating), `transfer_number` (UQ per pharmacy), `from_branch_no`, `to_branch_no` (CHECK `from_branch_no <> to_branch_no`), `total_items`, `total_cost_amount`, `transfer_status` (`1: Draft, 2: In Transit, 3: Received, 4: Rejected`), `sent_by_user_no`, `received_by_user_no`, `sent_at`, `received_at`.
- **`inv_transfer_items`**:
  - `transfer_item_no` (PK), `transfer_no` (FK CASCADE), `product_no`, `batch_no`, `batch_number`, `qty_pcs` (CHECK > 0), `unit_cost`, `total_cost`, `expiry_date`.
- **Accounting & Inventory Protocol**:
  - On Dispatch (In Transit): Decrement source branch stock (`inv_stock_movement` type 7: Transfer Out). Debit Goods in Transit / Inter-Branch Clearing (`10402`), Credit Inventory Asset (`10401`) at source branch.
  - On Receipt: Increment destination branch stock (`inv_stock_movement` type 6: Transfer In). Debit Inventory Asset (`10401`) at destination branch, Credit Goods in Transit (`10402`).

### Table: `inv_adjustments` & `inv_adjustment_items` (Stocktakes, Damage & Expiry Write-Offs)
- **`inv_adjustments`**:
  - `adjustment_no` (PK), `pharmacy_no`, `branch_no`, `adjustment_number` (UQ per branch), `adjustment_type` (`1: Physical Discrepancy, 2: Expiry Write-Off, 3: Damage / Breakage, 4: Lost / Theft`), `total_items`, `net_cost_adjustment`, `adjustment_status` (`1: Draft, 2: Approved/Posted, 3: Rejected`), `approved_by_user_no`, `adjustment_date`.
- **`inv_adjustment_items`**:
  - `adjustment_item_no` (PK), `adjustment_no` (FK CASCADE), `product_no`, `batch_no`, `batch_number`, `counted_qty_pcs`, `system_qty_pcs`, `difference_qty_pcs` (signed), `unit_cost`, `total_cost_impact`, `reason_code`.
- **Accounting Protocol**:
  - Shortage / Expiry Write-Off: Debit `50202 Inventory Shrinkage & Expiry Loss`, Credit `10401 Merchandise Inventory Asset`.
  - Surplus: Debit `10401 Merchandise Inventory Asset`, Credit `40201 Inventory Overages / Gain`.

---

# Module 4: `supp_` & `pur_` Suppliers, Procurement, Purchase Invoicing & Returns

## 4.1 Business Domain Overview
The `supp_` and `pur_` modules manage wholesale drug distributors, goods receiving notes (GRN/MRR), purchase invoices, direct supplier payments (`pur_supplier_payments`), and supplier purchase returns (`pur_purchase_returns`).

## 4.2 Field-to-Field Data Dictionary

### Table: `supp_suppliers` (Wholesale Drug Distributors)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `supplierNo` | `supplier_no` | `BIGINT` | Primary Key, Not Null | Unique Supplier ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Store Location | Immutable |
| `name` | `name` | `VARCHAR(200)` | Not Blank, Max 200 | Supplier commercial name | Audited |
| `phone` | `phone` | `VARCHAR(20)` | Unique per `(pharmacy_no, branch_no)` | Supplier primary phone | Audited |
| `currentDueBalance` | `current_due_balance` | `NUMERIC(20, 4)` | Min 0, Not Null | Real-time Accounts Payable (AP) liability | System Authority |
| `isActive` | `is_active` | `BOOLEAN` | Not Null | Supplier operational status | Audited |

### Table: `pur_purchase_invoices` (Wholesale Purchase Bills)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `purchaseInvoiceNo` | `purchase_invoice_no` | `BIGINT` | Primary Key, Not Null | Unique Invoice ID | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Public Invoice Reference | Public Reference |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Receiving Branch Store | Immutable |
| `supplierNo` | `supplier_no` | `BIGINT` | Foreign Key -> `supp_suppliers` ON DELETE RESTRICT | Selected vendor | Audited |
| `inventoryNumber` | `inventory_number` | `VARCHAR(100)` | Unique per `(pharmacy_no, branch_no)` | Generated sequential bill code | Audited |
| `calculationMode` | `calculation_mode` | `SMALLINT` | Values: `1: Default, 2: Unit TP/VAT, 3: Net Value, 4: Opening Stock` | Arithmetic formula selector | Critical Mode |
| `supplierInvoiceNo` | `supplier_invoice_no` | `VARCHAR(100)` | Optional | Vendor's printed delivery challan number | Audited |
| `grossTotalPrice` | `gross_total_price` | `NUMERIC(20, 4)` | Min 0, Not Null | Sum of purchase line items | System Computed |
| `discountType` | `discount_type` | `SMALLINT` | Values: `1: Percentage, 2: Flat` | Discount method | Audited |
| `discountValue` | `discount_value` | `NUMERIC(20, 4)` | Min 0, Not Null | Invoice-level discount deduction | Audited |
| `netAmount` | `net_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Pre-tax taxable subtotal | System Computed |
| `vatAmount` | `vat_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Total Input VAT assessed | System Computed |
| `roundOffAmount` | `round_off_amount` | `NUMERIC(20, 4)` | Not Null | Fractional currency rounding | System Computed |
| `finalPrice` | `final_price` | `NUMERIC(20, 4)` | Min 0, Not Null | `net_amount + vat_amount + round_off_amount` | System Computed |
| `paidAmount` | `paid_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Immediate disbursement | Audited |
| `dueAmount` | `due_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Net addition to supplier payable balance | System Computed |
| `documentStatus` | `document_status` | `SMALLINT` | Values: `1: Draft, 2: Confirmed/Received, 3: Cancelled, 4: Partially Returned, 5: Fully Returned` | Document lifecycle | System Authority |

### Table: `pur_supplier_payments` (Supplier Payment Disbursements)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `supplierPaymentNo`| `supplier_payment_no`| `BIGINT` | Primary Key, Not Null | Unique Payment Record ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Store Location | Immutable |
| `supplierNo` | `supplier_no` | `BIGINT` | Foreign Key -> `supp_suppliers` ON DELETE RESTRICT | Target supplier | Audited |
| `accountNo` | `account_no` | `BIGINT` | Foreign Key -> `acc_transaction_accounts` ON DELETE RESTRICT | Source bank/cash account | Audited |
| `paymentNumber` | `payment_number` | `VARCHAR(100)` | Unique per `(pharmacy_no, branch_no)` | Sequential payment voucher number | Audited |
| `paymentMethod` | `payment_method` | `SMALLINT` | Values: `1: Cash, 2: Bank, 3: bKash, 4: Nagad, 5: Rocket, 6: Card` | Disbursement tender | Audited |
| `amount` | `amount` | `NUMERIC(20, 4)` | CHECK `amount > 0` | Disbursement value; reduces supplier debt | Audited |
| `referenceNo` | `reference_no` | `VARCHAR(100)` | Optional | Bank cheque number / digital TrxID | Audited |
| `paymentDate` | `payment_date` | `TIMESTAMPTZ` | Not Null | Effective date of disbursement | Audited |

### Table: `pur_purchase_returns` & `pur_purchase_return_items` (Supplier Debit Notes)
- **`pur_purchase_returns`**:
  - `purchase_return_no` (PK), `pharmacy_no`, `branch_no`, `supplier_no`, `purchase_invoice_no` (optional FK), `return_number` (UQ per branch), `total_items`, `gross_return_amount`, `refund_received_amount`, `due_adjustment_amount`, `return_status` (`1: Draft, 2: Completed/Posted, 3: Cancelled`), `return_date`.
- **`pur_purchase_return_items`**:
  - `purchase_return_item_no` (PK), `purchase_return_no` (FK CASCADE), `purchase_item_no` (optional FK), `product_no`, `batch_no`, `batch_number`, `return_qty_pcs` (CHECK > 0), `unit_purchase_price`, `total_return_amount`, `reason_code`.
- **Accounting & Inventory Protocol**:
  - Stock: Deduct physical stock from batch (`inv_stock_movement` type 5: Supplier Return).
  - Financial GL: Debit Accounts Payable (`20101`) or Cash/Bank for refund received; Credit Merchandise Inventory Asset (`10401`).

---

# Module 5: `cust_` & `sale_` Point of Sale (POS), Customers & Sales Engine

## 5.1 Business Domain Overview
The `cust_` and `sale_` modules manage high-speed retail checkout, customer profiles, split tender payments (`sale_invoice_payments`), prescription validation, and sales returns (`sale_returns`).

## 5.2 Field-to-Field Data Dictionary

### Table: `cust_customers` (Patients & Clients)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `customerNo` | `customer_no` | `BIGINT` | Primary Key, Not Null | Unique Customer ID | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Public Customer Reference | Public Reference |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Registration Branch Store | Immutable |
| `name` | `name` | `VARCHAR(200)` | Not Blank, Max 200 | Customer full name | Audited |
| `phone` | `phone` | `VARCHAR(20)` | Unique per `(pharmacy_no, branch_no)` | Search handle at POS | Audited |
| `customerType` | `customer_type` | `SMALLINT` | Values: `1: Regular, 2: Wholesale Client, 3: VIP, 4: Staff, 5: Referral` | Pricing tier & credit rule | Audited |
| `currentDue` | `current_due` | `NUMERIC(20, 4)` | Min 0, Not Null | Derived strictly from AR ledger; never edited directly | System Authority |
| `advanceBalance` | `advance_balance` | `NUMERIC(20, 4)` | Min 0, Not Null | Pre-paid customer credit balance | System Authority |
| `loyaltyPoints` | `loyalty_points` | `NUMERIC(12, 2)` | Min 0, Not Null | Accrued reward points | System Computed |

### Table: `sale_invoices` (POS Sales Orders Header)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `saleInvoiceNo` | `sale_invoice_no` | `BIGINT` | Primary Key, Not Null | Unique Sale ID | Immutable |
| `uuid` | `uuid` | `UUID` | Unique, Not Null | Idempotency Key (`X-Client-UUID`) | Critical Idempotency |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Selling Branch Store | Immutable |
| `customerNo` | `customer_no` | `BIGINT` | Foreign Key -> `cust_customers`, Nullable | Null indicates Walk-In Customer | Audited |
| `prescriptionNo` | `prescription_no` | `BIGINT` | Foreign Key -> `doc_prescriptions`, Nullable | Mandatory if order contains Schedule H medicines | Clinical Safety |
| `prescriptionImageUrl`| `prescription_image_url`| `TEXT` | Nullable | Uploaded photo of external handwritten prescription | Clinical Safety |
| `salesNumber` | `sales_number` | `VARCHAR(100)` | Unique per `(pharmacy_no, branch_no)` | Monotonic bill code (e.g. `POS-01-2026-00084`) | Audited |
| `saleMode` | `sale_mode` | `SMALLINT` | Values: `1: Retail, 2: Wholesale` | Price rule selector | Audited |
| `grossTotalPrice` | `gross_total_price` | `NUMERIC(20, 4)` | Min 0, Not Null | Sum of line totals before discounts | System Computed |
| `discountValue` | `discount_value` | `NUMERIC(20, 4)` | Min 0, Not Null | Overall invoice discount deduction | Audited |
| `netAmount` | `net_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Pre-tax taxable subtotal: `gross - discount` | System Computed |
| `vatAmount` | `vat_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Output VAT collected from customer | System Computed |
| `roundOffAmount` | `round_off_amount` | `NUMERIC(20, 4)` | Not Null | Mathematical cents round-off (+/-) | System Computed |
| `finalPrice` | `final_price` | `NUMERIC(20, 4)` | Min 0, Not Null | `net_amount + vat_amount + round_off_amount` | System Authority |
| `customerWillPay` | `customer_will_pay` | `NUMERIC(20, 4)` | Min 0, Not Null | Total tender presented across all payment lines | Audited |
| `changeAmount` | `change_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Cash return: `customer_will_pay - final_price` | System Computed |
| `dueAmount` | `due_amount` | `NUMERIC(20, 4)` | Min 0, Not Null | Unpaid balance accrued to customer debt | System Computed |
| `paymentMethod` | `payment_method` | `SMALLINT` | Values: `1: Cash, 2: Bank, 3: bKash, 4: Nagad, 5: Rocket, 6: Card, 7: Due, 8: Split` | Primary payment classification | Audited |
| `documentStatus` | `document_status` | `SMALLINT` | Values: `1: Draft/Held, 2: Confirmed/Posted, 3: Voided, 4: Partially Returned, 5: Fully Returned` | Sale lifecycle status | System Authority |

### Table: `sale_invoice_payments` (Split Tender Details)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `salePaymentNo` | `sale_payment_no` | `BIGINT` | Primary Key, Not Null | Unique Payment Line ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Selling Branch Store | Immutable |
| `saleInvoiceNo` | `sale_invoice_no` | `BIGINT` | Foreign Key -> `sale_invoices` ON DELETE RESTRICT | Parent POS sale invoice | Immutable |
| `accountNo` | `account_no` | `BIGINT` | Foreign Key -> `acc_transaction_accounts` ON DELETE RESTRICT | Target financial asset account | Audited |
| `paymentMethod` | `payment_method` | `SMALLINT` | Values: `1: Cash, 2: Bank, 3: bKash, 4: Nagad, 5: Rocket, 6: Card` | Specific tender mode | Audited |
| `amount` | `amount` | `NUMERIC(20, 4)` | CHECK `amount > 0` | Tender received for this method | Audited |
| `gatewayReference`| `gateway_reference`| `VARCHAR(100)` | Optional | Card approval code / bKash trxID | Audited |

### Table: `sale_returns` & `sale_return_items` (Customer Returns & Refunds)
- **`sale_returns`**:
  - `sale_return_no` (PK), `pharmacy_no`, `branch_no`, `sale_invoice_no` (optional FK), `customer_no` (optional FK), `return_invoice_no` (UQ per branch), `gross_refund_price`, `discount_deduction`, `net_amount`, `vat_amount`, `round_off_amount`, `final_refund_price`, `cash_paid_refund`, `return_status` (`1: Draft, 2: Completed, 3: Voided`), `return_date`.
- **`sale_return_items`**:
  - `sale_return_item_no` (PK), `sale_return_no` (FK CASCADE), `sale_invoice_item_no` (FK -> `sale_invoice_items` ON DELETE RESTRICT, prevents over-returns), `product_no`, `batch_number`, `box_qty`, `qty_in_box`, `total_qty_pcs`, `sale_price`, `vat_percent`, `vat_amount`, `net_amount`, `total_price`, `reason_code`, `disposition` (`1: Restock to Batch, 2: Quarantine, 3: Destroy/Waste`).
- **Inventory & Accounting Protocol**:
  - If `disposition = 1` (Restock): Batch stock incremented (`inv_stock_movement` type 3: Customer Return). COGS reversal posted: Debit `10401 Merchandise Inventory Asset`, Credit `50101 COGS`.
  - If `disposition = 3` (Destroy/Waste): Do NOT restock to batch. Record loss: Debit `50202 Inventory Shrinkage & Loss`, Credit `10401 Merchandise Inventory Asset`.
  - Financial: Debit `40102 Sales Returns and Allowances`, Debit `20201 Output VAT Payable`; Credit Cash/Bank or Customer AR.

---

# Module 6: `cash_` & `due_` Cash Registers, Drawer Shifts & Accounts Receivable (AR)

## 6.1 Business Domain Overview
The `cash_` and `due_` modules control cashier shift sessions, blind drawer counts, multi-tender collections auditing, discrepancy reporting, and customer debt collections.

## 6.2 Field-to-Field Data Dictionary

### Table: `cash_closers` (Daily Shift & Cash Register Closing with Blind Count)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `cashCloserNo` | `cash_closer_no` | `BIGINT` | Primary Key, Not Null | Unique Shift Closing ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Physical Branch Location | Immutable |
| `closedByUserNo` | `closed_by_user_no` | `BIGINT` | Foreign Key -> `sys_users` ON DELETE RESTRICT | Cashier responsible for shift | Audited |
| `registerId` | `register_id` | `VARCHAR(50)` | Optional | Terminal workstation identifier (e.g. `REG-BANANI-01`) | Audited |
| `shiftNo` | `shift_no` | `INT` | Not Null, Min 1 | Sequential shift number for the day (e.g. 1, 2, 3) | Audited |
| `openingBalance` | `opening_balance` | `NUMERIC(20, 4)` | Min 0, Not Null | Float cash at shift opening | Audited |
| `cashSalesCollected`| `cash_sales_collected`| `NUMERIC(20, 4)`| Min 0, Not Null | Total cash sales collected in shift | System Authority |
| `cardCollected` | `card_collected` | `NUMERIC(20, 4)` | Min 0, Not Null | Card POS slips settled in shift | System Authority |
| `bkashCollected` | `bkash_collected` | `NUMERIC(20, 4)` | Min 0, Not Null | bKash payments settled in shift | System Authority |
| `nagadCollected` | `nagad_collected` | `NUMERIC(20, 4)` | Min 0, Not Null | Nagad payments settled in shift | System Authority |
| `rocketCollected`| `rocket_collected`| `NUMERIC(20, 4)` | Min 0, Not Null | Rocket payments settled in shift | System Authority |
| `splitCollected` | `split_collected` | `NUMERIC(20, 4)` | Min 0, Not Null | Total from multi-tender splits | System Authority |
| `dueCollections` | `due_collections` | `NUMERIC(20, 4)` | Min 0, Not Null | Cash received from debt recovery | System Authority |
| `cashReturnsPaid`| `cash_returns_paid` | `NUMERIC(20, 4)` | Min 0, Not Null | Cash refunds disbursed at counter | System Authority |
| `expensesPaid` | `expenses_paid` | `NUMERIC(20, 4)` | Min 0, Not Null | Petty cash disbursements in shift | System Authority |
| `calculatedClosingBalance` | `calculated_closing_balance` | `NUMERIC(20, 4)` | Not Null | Expected physical cash: `opening + cashSales + dueColl - returns - expenses`. Hidden during blind count! | System Authority |
| `actualCountedBalance` | `actual_counted_balance` | `NUMERIC(20, 4)` | Min 0, Not Null | Physical cash counted blind by cashier | Audited |
| `discrepancyAmount`| `discrepancy_amount`| `NUMERIC(20, 4)` | Not Null | `actual_counted_balance - calculated_closing_balance` | Critical Audit |
| `closingDate` | `closing_date` | `DATE` | Not Null | Calendar date of closing | Audited |

### Table: `due_collections` (Customer Debt Payment Receipts)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `dueCollectionNo` | `due_collection_no` | `BIGINT` | Primary Key, Not Null | Unique Receipt ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Receiving Branch Location | Immutable |
| `customerNo` | `customer_no` | `BIGINT` | Foreign Key -> `cust_customers` ON DELETE RESTRICT | Customer paying outstanding balance | Audited |
| `accountNo` | `account_no` | `BIGINT` | Foreign Key -> `acc_transaction_accounts` ON DELETE RESTRICT | Asset account receiving funds | Audited |
| `saleInvoiceNo` | `sale_invoice_no` | `BIGINT` | Foreign Key -> `sale_invoices`, Nullable | Specific invoice paid (if allocated) | Audited |
| `paymentNumber` | `payment_number` | `VARCHAR(100)` | Unique per `(pharmacy_no, branch_no)` | Monotonic receipt sequence | Audited |
| `paymentMethod` | `payment_method` | `SMALLINT` | Values: `1: Cash, 2: Bank, 3: bKash, 4: Nagad, 5: Rocket, 6: Card` | Tender method | Audited |
| `amount` | `amount` | `NUMERIC(20, 4)` | Min 0.01, Not Null | Payment value; credited to customer AR | Audited |

---

# Module 7: `acc_` Financial Accounting, Chart of Accounts & General Ledger (GL)

## 7.1 Business Domain Overview
The `acc_` module provides full double-entry general ledger accounting. It defines the Chart of Accounts (`acc_transaction_accounts`), operating expenses (`acc_expenses`), miscellaneous revenues (`acc_incomes`), inter-account fund transfers (`acc_reconciliations`), and the universal single financial transaction journal (`acc_transaction_ledger`).

## 7.2 Field-to-Field Data Dictionary

### Table: `acc_transaction_accounts` (Chart of Accounts & Wallets)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `accountNo` | `account_no` | `BIGINT` | Primary Key, Not Null | Unique Account ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Branch Assignment | Immutable |
| `accountCategory`| `account_category`| `SMALLINT` | Values: `1: ASSET, 2: LIABILITY, 3: EQUITY, 4: REVENUE, 5: EXPENSE` | Root accounting classification | Immutable |
| `accountCode` | `account_code` | `VARCHAR(30)` | e.g. `10101, 10401, 20101, 50101` | Standardized general ledger code | Indexed |
| `accountName` | `account_name` | `VARCHAR(150)` | Not Blank, Unique per `(pharmacy_no, branch_no)` | Ledger account title (e.g. `Main Cash Drawer`) | Audited |
| `phoneNumber` | `phone_number` | `VARCHAR(20)` | Nullable | Required only for mobile financial wallets (bKash/Nagad) | Audited |
| `accountType` | `account_type` | `SMALLINT` | Values: `1: Cash, 2: Bank, 3: bKash, 4: Nagad, 5: Rocket, 6: Card POS, 99: Other` | Operational account type | Audited |
| `currentBalance` | `current_balance` | `NUMERIC(20, 4)` | Not Null | Real-time balance (Dr - Cr for Asset/Expense, Cr - Dr for Liab/Equity/Rev) | System Authority |

### Table: `acc_transaction_ledger` (Universal Financial Transaction Ledger - The Single Table Core)
| Field Name (DTO / API) | Database Column | Data Type & Precision | Validation & Constraints | Middleware Transformation & Business Rules | Security & Audit |
|---|---|---|---|---|---|
| `ledgerNo` | `ledger_no` | `BIGINT` | Primary Key, Not Null | Unique Sequential Ledger Leg ID | Immutable |
| `pharmacyNo` | `pharmacy_no` | `BIGINT` | Foreign Key -> `sys_pharmacies` ON DELETE RESTRICT | Pharmacy Tenant ID | Immutable |
| `branchNo` | `branch_no` | `BIGINT` | Foreign Key -> `sys_branches` ON DELETE RESTRICT | Physical Branch Location | Immutable |
| `journalNo` | `journal_no` | `BIGINT` | Not Null, Indexed | Identifies all balanced legs of a single compound transaction ($\sum \text{Dr} \equiv \sum \text{Cr}$) | Immutable |
| `reversalOfLedgerNo`| `reversal_of_ledger_no`| `BIGINT` | FK -> `acc_transaction_ledger`, Nullable | Points to the original entry being reversed | Immutable |
| `accountNo` | `account_no` | `BIGINT` | Foreign Key -> `acc_transaction_accounts` ON DELETE RESTRICT | Target general ledger or liquidity account | Immutable |
| `transactionDate`| `transaction_date`| `TIMESTAMPTZ` | Not Null | Posting effective date & time | Immutable |
| `transactionType`| `transaction_type`| `SMALLINT` | Values: `1: POS Sale, 2: Sale Return, 3: Purchase Bill, 4: Supplier Return, 5: Expense, 6: Income, 7: Due Collection, 8: Supplier Payment, 9: Inter-Account Transfer, 10: Capital Infusion, 11: COGS Relief, 12: Stock Adjustment` | Core transaction nature | Immutable |
| `debitAmount` | `debit_amount` | `NUMERIC(20, 4)` | CHECK `debit_amount >= 0` | Universal Debit Leg | Immutable |
| `creditAmount` | `credit_amount` | `NUMERIC(20, 4)` | CHECK `credit_amount >= 0` | Universal Credit Leg | Immutable |
| `balanceAfter` | `balance_after` | `NUMERIC(20, 4)` | Not Null | Real-time running balance of `account_no` after this leg | System Authority |
| `sourceDocumentType`| `source_document_type`| `VARCHAR(50)`| Values: `'SALE_INVOICE', 'PUR_INVOICE', 'EXPENSE', 'INCOME', 'DUE_COLLECTION', 'RECONCILIATION', 'SALE_RETURN', 'PUR_RETURN', 'ADJUSTMENT'` | Originating business document family | Immutable |
| `sourceDocumentNo`| `source_document_no`| `VARCHAR(100)`| Not Blank | e.g. `POS-01-2026-004125, EXP-01-2026-00012` | Traceability |
| `sourceDocumentId`| `source_document_id`| `BIGINT` | Not Null | Primary key ID of the parent document | Immutable |
| `partyType` | `party_type` | `SMALLINT` | Values: `1: Customer, 2: Supplier, 3: Staff/Employee, 4: Other` | Subsidiary party categorization | Immutable |
| `partyNo` | `party_no` | `BIGINT` | Optional | Foreign key to `cust_customers` or `supp_suppliers` | Immutable |
| `narration` | `narration` | `TEXT` | Optional | Human-readable explanation of transaction | Audited |
| `createdBy` | `created_by_user_no` | `BIGINT` | Foreign Key -> `sys_users` | Operator who posted transaction | Immutable |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | Not Null | Strict wall-clock audit timestamp | Immutable |

### 7.3 Complete Double-Entry Posting Matrix in `acc_transaction_ledger`

Every financial transaction appends a group of balanced legs sharing the same `journal_no`, strictly adhering to:
$$\sum_{\text{journal}} \text{debit\_amount} \equiv \sum_{\text{journal}} \text{credit\_amount}$$

| Event / Document Type | Debit Leg (Dr) | Credit Leg (Cr) | Running Balance Impact |
|---|---|---|---|
| **1. POS Retail Sale (Cash)** | `10101 Main Cash Drawer` (final price)<br>`50203 Rounding Loss` (if round-off < 0) | `40101 Sales Revenue` (net amount)<br>`20201 Output VAT Payable` (tax)<br>`40202 Rounding Gain` (if round-off > 0) | Cash Drawer increases;<br>Sales revenue increases;<br>Rounding balanced |
| **1b. POS Sale FEFO COGS Relief** | `50101 Cost of Goods Sold` (sum of batch cost * qty) | `10401 Merchandise Inventory Asset` (batch cost) | COGS expense increases;<br>Inventory asset decreases (authoritative batch cost) |
| **2. POS Sale (Split Tender + Due)** | `10101 Main Cash Drawer` (cash part)<br>`10102 bKash Wallet` (digital part)<br>`10301 Accounts Receivable` (due part)<br>`50203 Rounding Loss` (if round-off < 0) | `40101 Sales Revenue`<br>`20201 Output VAT Payable`<br>`40202 Rounding Gain` (if round-off > 0) | Cash & bKash increase;<br>Customer due balance increases |
| **3. POS Sales Return (Restocked)** | `40102 Sales Returns & Allowances`<br>`20201 Output VAT Payable` (tax reversal)<br>`10401 Merchandise Inventory Asset` (batch cost) | `10101 Main Cash Drawer` (refund disbursed)<br>`50101 Cost of Goods Sold` (COGS relief reversal) | Cash decreases;<br>Revenue reversed;<br>Inventory restored |
| **4. Wholesale Purchase Bill (Credit)**| `10401 Merchandise Inventory Asset` (goods)<br>`10501 Input VAT Asset` (tax advance)<br>`50203 Rounding Loss` (if round-off < 0) | `20101 Accounts Payable (AP)` (supplier debt)<br>`40202 Rounding Gain` (if round-off > 0) | Inventory asset increases;<br>Supplier debt increases |
| **5. Wholesale Purchase Bill (Cash)** | `10401 Merchandise Inventory Asset`<br>`10501 Input VAT Asset` | `10201 Bank Account` or `10101 Cash Drawer` | Inventory asset increases;<br>Bank/Cash decreases |
| **6. Supplier Payment** | `20101 Accounts Payable (AP)` (debt reduced) | Designated `account_no` (`10201 Bank` or `10101 Cash`) | Supplier debt decreases;<br>Bank/Cash decreases |
| **7. Supplier Return (Debit Note)** | `20101 Accounts Payable (AP)` (or Cash refund) | `10401 Merchandise Inventory Asset` | Supplier debt decreases;<br>Inventory asset decreases |
| **8. Customer Due Collection** | Designated `account_no` (`10101 Cash` or `10102 bKash` or `10201 Bank`) | `10301 Accounts Receivable (AR)` (debt reduced)| Asset account increases;<br>Customer debt decreases |
| **9. Operating Expense** | `50201 General & Operating Expenses` | `10101 Main Cash Drawer` or `10201 Bank` | Expenses increase;<br>Cash/Bank decreases |
| **10. Inter-Account Fund Transfer** | `10201 Bank Account` (receiving) | `10101 Main Cash Drawer` (disbursing) | Bank increases;<br>Cash decreases |
| **11. Expiry / Damage Write-Off** | `50202 Inventory Loss & Write-Off` | `10401 Merchandise Inventory Asset` | Loss expense increases;<br>Inventory asset decreases |
| **12. Owner Capital Infusion** | `10201 Bank Current` or `10101 Cash` | `30101 Owner Capital & Retained Earnings` | Bank/Cash increases;<br>Equity increases |
| **13. Cash Drawer Closing Variance**| If shortage: `50204 Cash Drawer Shortage`<br>If overage: `10101 Main Cash Drawer` | If shortage: `10101 Main Cash Drawer`<br>If overage: `40203 Cash Drawer Overage` | Balances cash drawer to physical blind count |

---

# Module 8: `doc_` E-Prescriptions & Clinical Doctor Portal (Bilingual EN/BN)

## 8.1 Business Domain Overview
The `doc_` module connects doctor clinical practice with pharmacy dispensing. Doctor records, prescriptions (`doc_prescriptions`), prescription medicine lines (`doc_prescription_items`), and clinic print branding are partitioned by `pharmacy_no` and `branch_no`.

---

# Module 9: `cfg_` Business Configurations & Hardware Settings

## 9.1 Business Domain Overview
The `cfg_` module provides store-by-store operational switches:
- `cfg_sale_configs`: Max discount ceiling, loss sale allowance, out-of-stock sale prohibition.
- `cfg_invoice_configs`: 80mm/58mm thermal layout, bilingual shop headers, balance visibility toggles.
- `cfg_loyalty_configs`: Customer reward spend-to-points and point redemption conversion rates.
- `cfg_bulk_sms_configs` & `cfg_sms_logs`: Bulk SMS balances and delivery audit records.

---

# Module 10: `sub_` SaaS Subscriptions & Cloud Billing

## 10.1 Business Domain Overview
The `sub_` module governs SaaS tenant lifecycle (`sub_subscription_plans`, `sub_pharmacy_subscriptions`, `sub_subscription_payments`), automated grace periods, and bKash / SSLCommerz payment gateway verification.

---

# 11. Complete Middleware Endpoints Matrix & Security Routing

| Module | HTTP Method | Endpoint Path | Middleware Service | Required Permissions | Multi-Tenant Enforcement |
|---|---|---|---|---|---|
| `sys_` | POST | `/api/v1/auth/login` | `SysAuthService.login()` | Public | Generates JWT containing `pharmacy_no` & `branch_no` |
| `sys_` | GET | `/api/v1/sys/branches` | `SysBranchService.listBranches()` | `SYS_VIEW` | Auto-filtered by `pharmacy_no` |
| `prod_` | GET | `/api/v1/prod/products` | `ProdProductService.search()` | `PROD_VIEW` | Filtered by `pharmacy_no` & `branch_no` |
| `prod_` | POST | `/api/v1/prod/products` | `ProdProductService.create()` | `PROD_MANAGE` | Injects authenticated `pharmacy_no` & `branch_no` |
| `inv_` | GET | `/api/v1/inv/batches/active` | `InvBatchService.getActive()` | `INV_VIEW` | Filtered by `pharmacy_no`, `branch_no`, `expiry_date >= CURRENT_DATE` |
| `inv_` | POST | `/api/v1/inv/transfers` | `InvTransferService.createTransfer()` | `INV_TRANSFER` | Inter-branch clearing between `from_branch` and `to_branch` |
| `inv_` | POST | `/api/v1/inv/adjustments` | `InvAdjustmentService.postAdjustment()`| `INV_ADJUST` | Scoped to `(pharmacy_no, branch_no)` |
| `pur_` | POST | `/api/v1/pur/invoices` | `PurPurchaseService.postInvoice()` | `PUR_MANAGE` | Pessimistic MAC update under `(pharmacy_no, branch_no)` |
| `pur_` | POST | `/api/v1/pur/payments` | `PurSupplierPaymentService.postPayment()`| `PUR_PAY` | Direct AP debit under `(pharmacy_no, branch_no)` |
| `pur_` | POST | `/api/v1/pur/returns` | `PurPurchaseReturnService.postReturn()` | `PUR_RETURN` | Stock reduction & supplier credit under `(pharmacy_no, branch_no)` |
| `sale_` | POST | `/api/v1/pos/sales` | `SalSalePostingService.postSale()` | `SALE_POS` | Atomic stock lock + split tender + COGS GL posting |
| `sale_` | POST | `/api/v1/pos/sales/return`| `SalSaleReturnService.postReturn()` | `SALE_RETURN` | Over-return check + disposition routing + COGS reversal |
| `cash_` | POST | `/api/v1/cash/close-shift` | `CashSessionService.closeShift()` | `CASH_CLOSE` | Blind count check for `(pharmacy_no, branch_no)` |
| `due_` | POST | `/api/v1/due/collect` | `DueCollectionService.collect()` | `DUE_COLLECT` | Ledger credit on `(pharmacy_no, branch_no)` |
| `acc_` | POST | `/api/v1/acc/expenses` | `AccExpenseService.postExpense()` | `ACC_MANAGE` | GL voucher posting on `(pharmacy_no, branch_no)` |
| `acc_` | GET | `/api/v1/acc/trial-balance`| `AccReportingService.getTrialBalance()`| `ACC_REPORT` | Single-pass aggregation on `acc_transaction_ledger` |
| `doc_` | POST | `/api/v1/doc/prescriptions` | `DocPrescriptionService.save()` | `DOC_PRESCRIBE` | Clinic binding on `(pharmacy_no, branch_no)` |
| `cfg_` | PUT | `/api/v1/cfg/sale-configs` | `CfgSettingService.updateConfig()` | `CFG_MANAGE` | Scoped to `(pharmacy_no, branch_no)` |
| `sub_` | POST | `/api/v1/sub/bkash-verify` | `SubBillingService.verifyBkash()` | `SUB_ADMIN` | Scoped to `(pharmacy_no, branch_no)` |

---

# 12. Middleware Production Readiness Checklist (Definition of Done)

Before deploying any feature to production staging, the implementation must pass this 10-point architectural gate:
1. [ ] **Universal Multi-Tenant Multi-Branch Contract (Option A)**: Every database table and entity includes `pharmacy_no BIGINT NOT NULL` and `branch_no BIGINT NOT NULL`.
2. [ ] **Middleware as Sole Calculation Authority**: Subtotals, line extensions, discount allocations, taxes, and round-offs are computed on the server using `BigDecimal` (arbitrary-precision decimal arithmetic). Client-sent totals are treated as assertions to validate.
3. [ ] **Synchronous Ledger Posting**: Both `acc_transaction_ledger` (double-entry financial journal) and `inv_stock_movement` (inventory stock ledger) are appended synchronously in the same database transaction as the business document.
4. [ ] **Transactional Outbox for Asynchronous Effects**: `sys_event_outbox` is used exclusively for non-ledger asynchronous operations (SMS dispatch, push notifications, external webhooks).
5. [ ] **Financial Data Preservation (`ON DELETE RESTRICT`)**: All financial tables (`acc_transaction_ledger`, `inv_stock_movement`, `sale_invoices`, `pur_purchase_invoices`, `sale_invoice_payments`, `pur_supplier_payments`, `pur_purchase_returns`) use `ON DELETE RESTRICT`. No cascading deletions on financial history.
6. [ ] **COGS and Inventory Relief**: Every sale posts COGS debit (`50101`) and Inventory Asset credit (`10401`). Every restocked return reverses this posting.
7. [ ] **Pessimistic Concurrency on Stock**: All batch deductions utilize `SELECT ... FOR UPDATE` ordered by `expiry_date ASC` partitioned by `(pharmacy_no, branch_no)` with dynamic `expiry_date >= CURRENT_DATE` validation in Asia/Dhaka time zone.
8. [ ] **Client UUID Idempotency**: All POST checkout/payment routes require and validate `X-Client-UUID` against `sys_idempotency_log`.
9. [ ] **Gap-Safe Monotonic Sequencing**: Document numbers are generated without numbering gaps using isolated sequential counters in `sys_doc_sequence`.
10. [ ] **Audit Trail & Parent-FK Performance**: All line-item tables feature parent-FK B-Tree indexes, and mutations log before/after JSON states in `sys_audit_logs`.

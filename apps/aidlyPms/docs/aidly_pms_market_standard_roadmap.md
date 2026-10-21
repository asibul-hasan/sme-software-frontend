# Aidly PMS: Market Standard Gap Remediation & Implementation Status

This document tracks the verified evaluation, implementation status, and codebase audit of **Aidly PMS** across the .NET 10 backend (`aidlypms-backend`) and Angular 21 frontend (`sme-software-frontend`).

---

## 📊 Summary of Implemented Remediations

| Area | Feature / Remediation | File(s) Modified / Created | Status |
| :---: | :--- | :--- | :---: |
| **1. Clinical Safety** | Hard server-side block on outward movement of expired stock | `AidlyPms.Api/Infrastructure/StockPostingService.cs` | 🟢 **COMPLETED** |
| **1. Clinical Safety** | FEFO batch allocation excluding expired stock (`expiry_date >= CURRENT_DATE`) | `AidlyPms.Api/Infrastructure/StockPostingService.cs` | 🟢 **COMPLETED** |
| **1. Clinical Safety** | POS-level prescription & narcotic compliance alert banner before checkout | `apps/aidlyPms/.../pos-terminal.component.ts` | 🟢 **COMPLETED** |
| **2. Inventory** | `StockAdjustmentController` (`/api/v1/inv/adjustments`) with ledger posting | `AidlyPms.Api/.../StockAdjustmentController.cs` | 🟢 **COMPLETED** |
| **2. Inventory** | `StockTransferController` (`/api/v1/inv/transfers`) for multi-branch stock movement | `AidlyPms.Api/.../StockTransferController.cs` | 🟢 **COMPLETED** |
| **2. Inventory** | DTO models for Inventory Adjustments & Transfers matching PostgreSQL schema | `AidlyPms.Api/.../InventoryModels.cs` | 🟢 **COMPLETED** |
| **3. POS & Billing** | Multi-tender Split Payment UI activation (`showSplitOption = true`) | `apps/aidlyPms/.../pos-terminal.component.ts` | 🟢 **COMPLETED** |
| **3. POS & Billing** | MFS TrxID & Card reference capture in `sale_invoice_payments.gateway_reference` | `apps/aidlyPms/.../pos-terminal.component.ts` | 🟢 **COMPLETED** |
| **4. CRM & Reports** | Expiry risk bucket report endpoint (`GET /api/v1/reports/expiry-buckets`) | `AidlyPms.Api/.../ReportController.cs` | 🟢 **COMPLETED** |
| **4. CRM & Reports** | Pareto ABC & FSN velocity analysis endpoint (`GET /api/v1/reports/abc-fsn`) | `AidlyPms.Api/.../ReportController.cs` | 🟢 **COMPLETED** |
| **4. CRM & Reports** | Trade Price (TP) vs MRP Margin analysis endpoint (`GET /api/v1/reports/margin-analysis`) | `AidlyPms.Api/.../ReportController.cs` | 🟢 **COMPLETED** |
| **7. Regulatory** | Statutory NBR BIN & DGDA Drug License printing on 80mm thermal & A4 slips | `apps/aidlyPms/.../print.service.ts` | 🟢 **COMPLETED** |
| **8. Security & Audit**| Non-blocking ASP.NET Core ActionFilter capturing audit trails to `sys_audit_logs` | `AidlyPms.Api/Common/AuditActionFilter.cs` | 🟢 **COMPLETED** |
| **8. Security & Audit**| Registered `AuditActionFilter` globally in controller service pipeline | `AidlyPms.Api/Program.cs` | 🟢 **COMPLETED** |

---

## 🔍 Verification Matrix: Evaluation Claims vs Software Reality

| Area | Evaluation Claim | Actual Codebase State | Verification & Architecture Decision |
| :---: | :--- | :--- | :--- |
| **1. Clinical Safety** | `dosage_form` missing from DB | Stored in `prod_products.medicine_type` (`SMALLINT`), mapped via `label_values.json` (`Tablet`: 1, `Capsule`: 2, `Syrup`: 3, `Injection`: 6, etc.) | 🟢 **Preserved dictionary architecture**. No redundant database column needed. |
| **1. Clinical Safety** | `drug_schedule` missing from DB | Handled via `is_prescription_required` & `is_narcotic` (`BOOLEAN`) in `prod_products` | 🟢 **Preserved DB schema**. Schedule codes belong in `label_values.json`. |
| **1. Clinical Safety** | Server-side block on expired stock | `StockPostingService.cs` previously allowed any batch with stock | 🟢 **RESOLVED**. Hard exception blocks outward movements of expired batches. |
| **2. Inventory** | `PurchaseController` missing | Implemented as `PurchaseInvoiceController.cs` under `Modules/Suppliers/Controllers` | 🟢 **Verified**. Exists with full endpoints (`/api/v1/pur/invoices`, `/api/v1/pur/purchases`). |
| **2. Inventory** | `StockAdjustmentController` missing | Tables `inv_adjustments` and `inv_adjustment_items` existed in DB | 🟢 **RESOLVED**. Implemented `StockAdjustmentController.cs` with full stock posting. |
| **2. Inventory** | `StockTransferController` missing | Tables `inv_transfers` and `inv_transfer_items` existed in DB | 🟢 **RESOLVED**. Implemented `StockTransferController.cs` with transfer and receipt workflows. |
| **3. POS & Billing** | Multi-tender split payments missing | `sale_invoice_payments` existed in DB; backend had logic; UI had `showSplitOption = false` | 🟢 **RESOLVED**. Enabled `showSplitOption = true` and wired `gateway_reference`. |
| **4. CRM & Reports** | Expiry buckets & FSN margins missing | Missing dedicated backend reporting endpoints | 🟢 **RESOLVED**. Built `ReportController.cs` for `<30d`, `30-60d`, `60-90d`, `Expired`, ABC/FSN, and margins. |
| **7. Regulatory** | `bin_no` & `drug_license_no` missing | `sys_pharmacies` and `sys_branches` already contained both columns | 🟢 **RESOLVED**. Printed statutory BIN alongside Drug License on receipts for Mushak-6.3 compliance. |
| **8. Security** | `sys_audit_logs` never written to | Table `sys_audit_logs` existed in DB | 🟢 **RESOLVED**. Added fail-safe `AuditActionFilter.cs` capturing `POST`, `PUT`, `DELETE`. |

---

## 🧪 Build & Parity Test Results

1. **Backend Solution (`aidlypms-backend`)**:
   ```bash
   dotnet build AidlyPms.slnx
   # Result: Build succeeded. 0 Warning(s), 0 Error(s)
   ```
2. **Frontend Production Build (`sme-software-frontend`)**:
   ```bash
   npm run build:pms
   # Result: Application bundle generation complete. Successfully ran target build for project aidlyPms.
   ```
3. **Database Schema Parity Verification**:
   ```bash
   npm run verify:pms-schema
   # Result: 57 Tables Verified, 736 Columns, 0 Missing Fields. 100% PARITY ACHIEVED.
   ```

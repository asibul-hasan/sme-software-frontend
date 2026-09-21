Searched for files: *
Listed directory apps
Listed directory pridesys
Listed directory sme
Listed directory pridebook
Ran command: `Get-ChildItem -Path "$HOME\Downloads", "$HOME\Documents", "$HOME\Desktop" -Include *.pdf,*.docx,*.xlsx,*.txt,*.md -Recurse -Depth 2 -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 15 | ForEach-Object { "$($_.LastWriteTime)`t$($_.FullName)" }`

I am checking if a Terms of Reference (ToR) or requirements document was recently placed in your working directory, Downloads, or Desktop.

Ran command: `git status; git log -n 3`

I am checking the repository status and commit history.

Ran command: `Get-ChildItem -Path "$HOME\Downloads\*.pdf" | ForEach-Object { "$($_.Length)`t$($_.Name)" }`

I am checking the PDF files in Downloads to see if a requirements document is among them.

Ran command: `powershell -Command "[System.IO.File]::ReadAllText('C:\Users\Asibul\Downloads\f611beb4-a910-4808-a196-f1d5140392f3.pdf') -match '/Title \((.*?)\)' | Out-Null; $matches[1]"`

I am checking the contents of the downloaded PDF.

# FUNCTIONAL SPECIFICATION DOCUMENT (FSD)
**Project Name**: OS Pharmacy Management & POS System (PMS)  
**Document Type**: Screen-Level Functional Specification Document (Reverse-Engineered Baseline)  
**Author**: Senior Business Analyst  
**Screen Prefix**: `SCR-` | **Starting Screen Number**: `SCR-01`  
**Language Requirements**: English UI with bilingual English + Bengali (`বাংলা`) localized fields for Doctors Portal and system alert notices.

---

## 1. ANALYSIS SUMMARY

This functional specification document captures the complete reverse-engineered architecture of the OS Pharmacy Management & POS System based on the system UI, screen states, and modal captures in the repository. The application functions as a multi-branch retail and wholesale pharmacy ERP tailored for the Bangladesh market, featuring Point of Sale (POS) operation, barcode lookup, inventory batches, due/credit sales recovery, dual-language medical practitioner records, chart of accounts reconciliation, and automated SMS marketing.

### Module Scope & Status Summary

| # | Module | Sub-modules / Pages | Status |
| :--- | :--- | :--- | :--- |
| 1 | **Dashboard** | Executive Dashboard, Cashbook & Buy/Sale Analytics | Specified (`SCR-01`) |
| 2 | **Products & Inventory** | Product List, Product Add, Companies, Generics, Requisitions, Requisition Records, Expired Items | Specified (`SCR-02` – `SCR-10`) |
| 3 | **Supplier & Purchase** | Supplier List, Create Supplier, Purchase Product POS, Nested Add Product/Company/Generic, Purchase Records | Specified (`SCR-11` – `SCR-15`) |
| 4 | **Customer & Sales (POS)** | Retail POS, Wholesale POS, Sales Return, Customer Directory, Customer Add, Sales History | Specified (`SCR-16` – `SCR-21`) |
| 5 | **Cash Management** | Cash Handover Reconciler, Bulk Check Modal | Specified (`SCR-22` – `SCR-23`) |
| 6 | **Due Collection** | Due Collect (Today / Upcoming / Pending), Paid Settlement History | Specified (`SCR-24` – `SCR-25`) |
| 7 | **Accounting** | Transaction Accounts, Account Add, Expenses, Expense Add, Expense Categories, Income, Additional Balance Add | Specified (`SCR-26` – `SCR-33`) |
| 8 | **Reconciliation** | Inter-Account Fund Transfers, Add Reconciliation | Specified (`SCR-34` – `SCR-35`) |
| 9 | **Representatives** | Staff / Pharmacist Directory, Add Staff Member | Specified (`SCR-36` – `SCR-37`) |
| 10 | **Roles & Permissions** | Role List, Add/Edit Role (Permissions ACL Matrix) | Specified (`SCR-38` – `SCR-39`) |
| 11 | **Doctors Portal** | Doctor Directory, Add Doctor (Bilingual), Prescription Header/Footer Config | Specified (`SCR-40` – `SCR-42`) |
| 12 | **Settings** | Sale Rules Config, 80mm Invoice Receipt Config, Product Config, Loyalty Config, Bulk SMS Config | Specified (`SCR-43` – `SCR-47`) |
| 13 | **Subscription & Branch** | SaaS Subscription Status, bKash Payment Modal, Multi-Pharmacy Branch Switcher | Specified (`SCR-48` – `SCR-50`) |

---

## 2. UPDATED MENU STRUCTURE

The table below defines the master navigation menu across all modules, sub-modules, and screen identifiers.

| # | Primary Menu | Sub-Menu / Page Name | Screen ID | Type / Display Mode |
| :---: | :--- | :--- | :---: | :--- |
| **1.0** | **Dashboard** | Dashboard Overview | `SCR-01` | Full Page |
| **2.0** | **Products** | Product List | `SCR-02` | Full Page |
| 2.1 | Products | Add Product (PMS Product Add) | `SCR-03` | Full Page |
| 2.2 | Products | Company List | `SCR-04` | Full Page |
| 2.3 | Products | Add Company | `SCR-05` | Modal Dialog |
| 2.4 | Products | Generic List | `SCR-06` | Full Page |
| 2.5 | Products | Add Generic | `SCR-07` | Modal Dialog |
| 2.6 | Products | Product Requisitions | `SCR-08` | Full Page |
| 2.7 | Products | Requisition Record | `SCR-09` | Full Page |
| 2.8 | Products | Expired Items | `SCR-10` | Full Page |
| **3.0** | **Supplier** | Supplier List | `SCR-11` | Full Page |
| 3.1 | Supplier | Create Supplier | `SCR-12` | Full Page |
| 3.2 | Supplier | Purchase Products (Entry) | `SCR-13` | Full Page / Dual Pane |
| 3.3 | Supplier | Quick Add Product for Purchase | `SCR-14` | Nested Modal Dialog |
| 3.4 | Supplier | Purchase Record | `SCR-15` | Full Page |
| **4.0** | **Customer** | Sale Products (Retail POS) | `SCR-16` | Full Page / POS Interface |
| 4.1 | Customer | Sale Products (Wholesale POS) | `SCR-17` | Full Page / POS Interface |
| 4.2 | Customer | Sale Return | `SCR-18` | Full Page / POS Interface |
| 4.3 | Customer | Customer List | `SCR-19` | Full Page |
| 4.4 | Customer | Add Customer | `SCR-20` | Full Page |
| 4.5 | Customer | Sale Record / History | `SCR-21` | Full Page |
| **5.0** | **Cash** | Received Cash (Counter Handover) | `SCR-22` | Full Page |
| 5.1 | Cash | Bulk Reconcile Confirmation | `SCR-23` | Modal Dialog |
| **6.0** | **Due Collect** | Due Collect (Today / Upcoming / Pending) | `SCR-24` | Full Page (Tabbed) |
| 6.1 | Due Collect | Paid List (Settlement Record) | `SCR-25` | Full Page (Tab) |
| **7.0** | **Accounting** | Transaction Accounts | `SCR-26` | Full Page |
| 7.1 | Accounting | Create Account | `SCR-27` | Full Page / Form |
| 7.2 | Accounting | Expenses List | `SCR-28` | Full Page |
| 7.3 | Accounting | Create Expense | `SCR-29` | Full Page / Form |
| 7.4 | Accounting | Create Expense Category | `SCR-30` | Full Page / Form |
| 7.5 | Accounting | Income List | `SCR-31` | Full Page |
| 7.6 | Accounting | Additional Balance List | `SCR-32` | Full Page |
| 7.7 | Accounting | Add New Additional Balance | `SCR-33` | Full Page / Form |
| **8.0** | **Reconciliation** | Reconciliation List | `SCR-34` | Full Page |
| 8.1 | Reconciliation | Add Reconciliation | `SCR-35` | Full Page / Form |
| **9.0** | **Representatives** | Representative List | `SCR-36` | Full Page |
| 9.1 | Representatives | Add Representative | `SCR-37` | Full Page / Form |
| **10.0**| **Roles** | Roles List | `SCR-38` | Full Page |
| 10.1| Roles | Add Role (Permissions Matrix) | `SCR-39` | Full Page / Form |
| **11.0**| **Doctors Portal**| Doctor List | `SCR-40` | Full Page |
| 11.1| Doctors Portal | Add New Doctor | `SCR-41` | Full Page / Bilingual Form |
| 11.2| Doctors Portal | Prescription Settings | `SCR-42` | Full Page / Form |
| **12.0**| **Settings** | Retail or Wholesale Sale Config | `SCR-43` | Full Page / Form |
| 12.1| Settings | Invoice Config (80mm Thermal) | `SCR-44` | Full Page / Form |
| 12.2| Settings | Product Config | `SCR-45` | Full Page / Form |
| 12.3| Settings | Loyalty Config | `SCR-46` | Full Page / Form |
| 12.4| Settings | Bulk SMS Config | `SCR-47` | Full Page / eCommerce Form |
| **13.0**| **Subscription & Branch** | Subscription Report | `SCR-48` | Full Page |
| 13.1| Subscription & Branch | Subscription Payment Gateway | `SCR-49` | Modal Dialog |
| 13.2| Subscription & Branch | Change Pharmacy (Branch Switcher) | `SCR-50` | Full Page / Switcher |

---

## 3. NEW MODULE SPECIFICATIONS

### 3.1 Module 1: Dashboard

```
Dashboard
└── SCR-01: Dashboard Overview
```

#### [SCR-01] Dashboard Overview

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Business Mode | Segmented Switch | `Retail`, `Wholesale` |
| Date Range | Date Range Picker | Valid dates `DD-MM-YYYY ~ DD-MM-YYYY` |
| Scope Filter | Dropdown | `All`, (NEED FURTHER CLARIFICATION — additional branch options if multi-branch) |

##### Dashboard Widgets
**Summary Cards Table**:
| Card / Metric | Data Type | Description |
| :--- | :--- | :--- |
| Current Cash Balance | Currency (`৳ 0.00`) | Current counter cash holding across all active cash accounts. |
| Bank Balance | Currency (`৳ 0.00`) | Summed balance of all commercial bank accounts. Click "Details" to drill down. |
| MFS Balance | Currency (`৳ 0.00`) | Summed balance across Mobile Financial Services (bKash, Nagad, Rocket). Click "Details" to drill down. |
| Today's Business Summary: Sale Price | Currency (`৳ 0.00`) | Gross sales volume recorded on the current operating date. |
| Today's Business Summary: Purchase Price | Currency (`৳ 0.00`) | Total inventory purchase commitments incurred today. |
| Full Inventory Cost | Currency (`৳ 0.00`) | Total cost valuation of all unsold items currently in stock. |
| Total Items | Numeric Integer | Distinct product SKU count currently present in store. |
| Total Product Count | Numeric Integer | Total physical pieces of medicine units counted across all batches. |

**Charts & Visualizations Table**:
| Chart / Widget | Type | Description |
| :--- | :--- | :--- |
| Product Buy Price and Gross Profit | Line / Area Chart | Compares daily Product Buy Price against Gross Profit margins. |
| Gross Profit Break Down | Comparative Chart | Visualizes Net Profit vs. Operational Cost (OP Cost). |
| Top Selling Products | Table / Mini-Grid | Top moving drugs: Details, Sale Quantity, Total Sales Price. |
| Lowest Selling Products | Table / Mini-Grid | Dead / slow-moving stock: Details, Sale Quantity, Total Sales Price. |
| Cashbook by Date Range | Multi-Column Ledger Box | Formula calculation: `Gross Profit + Income - Operational Cost - Demurrage = Net Profit`. Also shows Cash Balance, Bank Balance, Mobile Bank Balance, and Closing Balance. |
| Buy and Sale by Date Range | Financial Summary List | Breakdown of Total Sale, Due Sales Only, Sale Return, Due Payment Receive, Inventory Purchase Price, Due Purchase Only, Purchase Return, Due Purchase Payment. |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Download Report | Generates and exports PDF/Excel summary of filtered metrics. | `PMS-Report-Module:VIEW` |
| One-Click Drug Import | Banner CTA allowing import of Bangladesh 30k+ national drug database. | `PMS-Product-Module:CREATE` |
| Continue with Subscription | Banner button routing to SaaS billing payment gateway. | `Pharmacy-Module:ADMIN` |

---

### 3.2 Module 2: Products & Inventory

```
Products
├── SCR-02: Product List
├── SCR-03: PMS Product Add
├── SCR-04: Company List
├── SCR-05: Add Company Modal
├── SCR-06: Generic List
├── SCR-07: Add Generic Modal
├── SCR-08: Product Requisitions
├── SCR-09: Requisition Record
└── SCR-10: Expired Items
```

#### [SCR-02] Product List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Product Name | Text Input | Case-insensitive substring match |
| Company Name | Dropdown Select | List of active pharmaceutical manufacturers |
| Form | Text Input | Dosage form (Tablet, Capsule, Syrup, Drop, Injection, etc.) |
| Generic Name | Text Input | Generic chemical formulation name |
| All Items Toggle (`F9`) | Toggle Switch | `All` (Show all items regardless of stock status) |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Product Trade Name, Formulation Form, Dosage Strength, Manufacturer. |
| Avg. Purchase Price/Piece | Average weighted cost per unit (`৳ 0.00`) with quick view history icon. |
| Purchase Price/Piece | Latest purchase unit cost (`৳ 0.00`). |
| Sale Price/Piece | Standard customer retail price per unit (`৳ 0.00`). |
| Action | Action buttons: Stock Adjustment (`Ins`), View Details (eye icon), Edit Product (pencil icon). |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add New Product (`F2`) | Opens `SCR-03` full product creation screen. | `PMS-Product-Module:CREATE` |
| Switch Table (`F4`) | Moves keyboard focus between filter inputs and the data grid. | All Users |
| Download Stock List | Exports current stock valuation and quantities to Excel/CSV. | `PMS-Product-Module:VIEW` |
| Reset | Clears all active search fields. | All Users |

---

#### [SCR-03] PMS Product Add

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product Name | Text Input | Yes | Non-empty, max 150 chars |
| Strength | Text Input | No | e.g., `500mg`, `10mg/5ml` |
| Volume | Text Input | No | e.g., `100ml`, `15g` |
| Medicine Type | Dropdown Select | Yes | Must select from enum |
| Unit Type | Dropdown Select | Yes | Default: `PIECE` |
| Quantity/Box | Numeric Input | Yes | Integer > 0 |
| Cost/Box | Numeric (Decimal) | Yes | Amount >= 0.00 |
| Sale Price/Box | Numeric (Decimal) | Yes | Amount >= Cost/Box (NOT SURE — system may warn if sold at loss unless config allows) |
| Company Name | Dropdown + Modal (`+`) | Yes | Selection required; inline `+` opens `SCR-05` |
| Generic Name | Dropdown + Modal (`+`) | No | Selection optional; inline `+` opens `SCR-07` |
| Country Of Origin | Text Input | No | e.g., `Bangladesh`, `India` |
| Barcode Value | Text Input / Scan | No | Alphanumeric EAN/UPC |
| Medicine | Checkbox | No | Boolean flag (Default: Checked) |

*Dropdown Enums*:
- **Medicine Type**: `Tablet`, `Capsule`, `Syrup`, `Suspension`, `Drop`, `Injection`, `Ointment`, `Gel`, `Cream`, `Inhaler`, `Suppository`, `Powder`, `Other`
- **Unit Type**: `PIECE`, `STRIP`, `BOX`, `BOTTLE`, `TUBE`, `VIAL`, `AMPOULE`

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add | Validates and persists product record, redirects to `SCR-02`. | `PMS-Product-Module:CREATE` |
| Back (`←`) | Returns to Product List without saving. | All Users |

---

#### [SCR-04] Company List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Company Name | Text Input | Substring search |

##### Data Table
| Column | Description |
| :--- | :--- |
| Id | Auto-generated system ID |
| Name | Full registered company / manufacturer name |
| Action | Edit and Delete action controls |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD MORE COMPANY | Opens `SCR-05` company modal. | `POS-Shop-Company-Module:CREATE` |
| Search | Executes search filter. | All Users |
| Reset | Clears search input. | All Users |

---

#### [SCR-05] Add Company (Modal)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Company Name | Text Input | Yes | Mandatory, unique name string |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves company and appends to company dropdowns. | `POS-Shop-Company-Module:CREATE` |
| Close (`✕`) | Dismisses modal dialog. | All Users |

---

#### [SCR-06] Generic List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Generic Name | Text Input | Substring search |

##### Data Table
| Column | Description |
| :--- | :--- |
| Id | Auto-generated system ID |
| Generic Name | International Nonproprietary Name (INN) / chemical formula |
| Action | Edit and Delete action controls |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD MORE GENERIC | Opens `SCR-07` generic modal. | `POS-Shop-Generic-Module:CREATE` |
| Search | Filters generic table. | All Users |
| Reset | Clears filter field. | All Users |

---

#### [SCR-07] Add Generic (Modal)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Generic Name | Text Input | Yes | Mandatory, unique generic name |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves generic formulation and updates active dropdown lists. | `POS-Shop-Generic-Module:CREATE` |
| Close (`✕`) | Dismisses modal dialog. | All Users |

---

#### [SCR-08] Product Requisitions

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Company Name | Dropdown Select | List of manufacturers |
| Product Name | Text Input | Drug name search |
| Select An Option | Dropdown Select | Filtering presets `(NOT SURE — e.g. Fast moving, Low stock)` |
| As Per Sale | Toggle Switch | Enables historical sale velocity calculation |
| Time Period | Date Range Picker | Range for velocity calculation `DD-MM-YYYY ~ DD-MM-YYYY` |
| All Items (`Insert`) | Toggle Switch | Include items with sufficient stock |
| MIN QTY (`F9`) | Toggle Switch | Filter items strictly below Minimum Stock Level |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Product Name, Generic, and Strength |
| Box | Recommended order quantity in boxes |
| MIN QTY(Pcs) | Configured threshold minimum unit stock |
| Sale QTY(6Mth)/Pcs | Historical consumption units in past 6 months |
| Quantity In Box | Packaging multiplier per box |
| BTP | Base Trade Price per piece/box |
| Vat | Value Added Tax percentage or flat amount |
| BTP + Vat | Combined gross purchase price |
| Total Price | Requisition line total (`Box × (BTP + Vat)`) |
| Action | Include/Exclude line item checkbox, Delete item |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add New Product (`F2`) | Opens quick product creation screen (`SCR-03`). | `PMS-Product-Module:CREATE` |
| Billing (`F8`) | Converts approved requisition into an active purchase order. | `PMS-Requisition-Module:BILLING` |
| Reset | Resets filter selections. | All Users |

---

#### [SCR-09] Requisition Record

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Supplier Name | Dropdown Select | Active supplier list |
| Requisition Number | Text Input | Code search (e.g. `REQ-2026-001`) |
| Product Name | Dropdown Select | Autocomplete search |
| Created By | Text Input | Username / Employee name |

##### Data Table
| Column | Description |
| :--- | :--- |
| Date | Date and timestamp of requisition creation |
| Total Bill | Gross requisition bill amount (`৳`) |
| Requisition Info | Requisition number, supplier, and item count summary |
| Action | View Details, Print Order, Cancel |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Reset | Clears all search criteria. | All Users |

---

#### [SCR-10] Expired Items

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Expired In(days) | Numeric Input | Default: `90` days threshold |
| Product Name | Dropdown Select | Autocomplete product selection |
| Company Name | Dropdown Select | Manufacturer list |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Product Name, Strength, Dosage Form, Company |
| Expiry Date | Batch expiry date (`DD-MM-YYYY`) |
| Available Quantity | Units remaining in store before expiry |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Search | Executes expiry analysis. | All Users |
| Reset | Resets days to store default. | All Users |
| Report | Generates downloadable PDF/Excel disposal or return report. | `PMS-Report-Module:VIEW` |

---

### 3.3 Module 3: Supplier & Purchase

```
Supplier
├── SCR-11: Supplier List
├── SCR-12: Create Supplier
├── SCR-13: Purchase Products (Entry)
├── SCR-14: Quick Add Product for Purchase Modal
└── SCR-15: Purchase Record
```

#### [SCR-11] Supplier List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search by name | Text Input | Supplier business or contact name |
| Search by phone | Text Input | Mobile/phone search |
| Search with due suppliers (`F9`) | Checkbox | Filters strictly suppliers with outstanding balance > 0 |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Supplier Name, Contact Mobile, Address/Note summary |
| Balance | Current outstanding payable balance (`৳ 0.00`) |
| Action | View ledger, Pay Dues, Edit Supplier |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD SUPPLIER (`F2`) | Opens `SCR-12` create supplier page. | `PMS-Vendor-Module:CREATE` |
| Switch Table (`F4`) | Navigates between filter inputs and grid. | All Users |
| Reset | Clears filters. | All Users |

---

#### [SCR-12] Create Supplier

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Supplier Name | Text Input | Yes | String, mandatory ("Please input vendor name!") |
| Phone Number | Phone Input | Yes | Country code `+880` prefix; 10 digits ("Please Provide A Valid Phone Number") |
| Note | Textarea | No | Freeform text |
| Due Toggle | Toggle Switch | No | Enables initial opening balance input |
| Due | Numeric (Decimal) | No | Enabled when Due Toggle is ON; amount >= 0.00 |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves vendor record and updates vendor registry. | `PMS-Vendor-Module:CREATE` |
| Back (`←`) | Returns to Supplier List. | All Users |

---

#### [SCR-13] Purchase Products (Purchase Entry)

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Calculation Mode | Dropdown Select | `Default`, `Unit TP/VAT`, `Net Value`, `Opening Stock` |

##### Form Sections
**Line Item Entry Grid**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product | Dropdown / Search | Yes | Autocomplete medicine catalog |
| Box | Numeric Input | Yes | Number of packages/boxes > 0 |
| BTP + VAT | Numeric (Decimal) | Yes | Base trade price + VAT per box |
| Sale Price | Numeric (Decimal) | No | Suggested retail price per box |
| QTY In Box | Numeric Input | Yes | Packing unit multiplier per box |
| Total QTY | Numeric Input | Yes | Auto-computed: `Box × QTY In Box` |
| Free | Numeric Input | No | Free bonus units/boxes supplied by vendor |
| MIN QTY(pcs) | Numeric Input | No | Minimum shelf quantity threshold |
| Expiry Date | Date Picker | No | Batch expiry `DD-MM-YYYY` |
| Barcode Value | Text Input / Scanner | No | Batch or product barcode identifier |

**Vendor & Checkout Drawer (Right Pane)**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Total Items | Readonly Badge | Yes | Total distinct line count |
| Total Price | Readonly Currency | Yes | Gross sum of all line items (`৳ 0.00`) |
| Discount | Toggle + Numeric | No | Flat / Percentage toggle; discount value |
| Final Price | Readonly Currency | Yes | Net payable (`Total Price - Discount`) |
| Paid | Numeric Input | Yes | Amount paid at purchase time (`৳`) |
| Balance | Readonly Currency | Yes | Remaining vendor payable due (`Final Price - Paid`) |
| Choose Supplier | Dropdown + Modal (`+`) | Yes | Supplier selection; inline `+` opens quick supplier modal |
| Inventory Type | Dropdown Select | Yes | Default: `INVENTORY PURCHASED` |
| Invoice Number | Text Input | No | Vendor's physical invoice / challan number |

*Dropdown Enums*:
- **Calculation Mode**: `Default`, `Unit TP/VAT`, `Net Value`, `Opening Stock`
- **Inventory Type**: `INVENTORY PURCHASED`, `OPENING STOCK`, `TRANSFER IN`

##### Data Table (Current Purchase Lines)
| Column | Description |
| :--- | :--- |
| Details | Trade Name, Formulation, Batch No. |
| Box | Quantity of boxes |
| QTY In Box | Pack size per box |
| BTP + Vat | Unit cost including VAT |
| Sale Price | Configured customer price |
| Total Price | Line total (`Box × BTP + Vat`) |
| Free | Free bonus units included |
| Exp Date | Product batch expiration date |
| Action | Remove item row |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add (`Enter`) | Commits current line item row to purchase draft table. | `PMS-Vendor-Module:CREATE` |
| Add New Product (`F2`) | Opens `SCR-14` nested modal to add new drug on-the-fly. | `PMS-Product-Module:CREATE` |
| Purchase | Submits purchase transaction, posts inventory, and generates AP record. | `PMS-Vendor-Module:CREATE` |

---

#### [SCR-14] Quick Add Product for Purchase (Nested Modal)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product Name | Text Input | Yes | Non-empty string |
| Strength | Text Input | No | e.g., `20mg` |
| Volume | Text Input | No | e.g., `200ml` |
| Medicine Type | Dropdown Select | Yes | Valid medicine type enum |
| Unit Type | Dropdown Select | Yes | Valid unit type enum (`PIECE`, `BOX`, etc.) |
| Quantity/Box | Numeric Input | Yes | Integer > 0 |
| Box | Numeric Input | Yes | Initial purchased box count |
| Quantity | Numeric Input | Yes | Total units (`Box × Quantity/Box`) |
| Cost/Box | Numeric (Decimal) | Yes | Purchase cost per box |
| Sale Price/Box | Numeric (Decimal) | Yes | Selling price per box |
| Expiry Date | Date Picker | No | Expiry `DD-MM-YYYY` |
| MIN QTY(pcs) | Numeric Input | No | Low stock warning threshold |
| Company Name | Dropdown + Modal (`+`) | Yes | Manufacturer; `+` opens `SCR-05` |
| Generic Name | Dropdown + Modal (`+`) | No | Chemical formula; `+` opens `SCR-07` |
| Country Of Origin | Text Input | No | Country name |
| Barcode Value | Text Input | No | Barcode scan |
| Medicine | Checkbox | No | Checked by default |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add To Inventory | Persists product and inserts it directly into the active purchase draft. | `PMS-Product-Module:CREATE` |
| Close (`✕`) | Dismisses modal. | All Users |

---

#### [SCR-15] Purchase Record

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Inventory Number | Text Input | Purchase receipt number |
| Supplier Name | Dropdown Select | Supplier filter |
| Product Name | Dropdown Select | Product autocomplete |
| Created By | Text Input | Creator user |
| Inventory Type | Dropdown Select | `INVENTORY PURCHASED`, `OPENING STOCK` |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Inventory transaction reference, timestamp, supplier name |
| Bill Info | Gross amount, discount, net invoice total |
| Inventory Info | Items received, batches, store location |
| Action | View Invoice, Print Challan, Return to Vendor |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Switch Table (`F4`) | Switches focus between filters and table. | All Users |
| Reset | Resets filter criteria. | All Users |

---

### 3.4 Module 4: Customer & Sales (POS)

```
Customer
├── SCR-16: Sale Products (Retail POS)
├── SCR-17: Sale Products (Wholesale POS)
├── SCR-18: Sale Return
├── SCR-19: Customer List
├── SCR-20: Add Customer
└── SCR-21: Sale Record / History
```

#### [SCR-16] Sale Products (Retail POS)

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Retail / Wholesale | Toggle Switch | Active: `Retail` |
| Quick Print | Toggle Switch | Direct silent printing without browser dialog |

##### Form Sections
**Item Entry Bar**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product | Dropdown / Barcode Scan | Yes | Product name or barcode lookup |
| Sale QTY | Numeric Input | Yes | Units in pieces > 0 |
| Sale Price | Numeric (Decimal) | Yes | Price per piece (default from product master) |
| Dis | Toggle Switch + Input | No | Toggle `%` or Flat discount; value >= 0 |

**Right Checkout Panel**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Total Items | Readonly Integer | Yes | Count of distinct lines |
| Total Price | Readonly Currency | Yes | Gross subtotal |
| Discount | Toggle + Input | No | Invoice level discount (`%` or Flat) |
| Card Commission(%) | Checkbox + Input | No | Surcharge fee if paid by card |
| Final Price | Readonly Banner | Yes | Net payable amount (`৳ 0.00`) |
| Approximate Profit | Readonly Metric | Yes | Gross margin calculation (`Sale Price - Avg Cost`) |
| Customer Will Pay | Step Input (`+`/`-`) | Yes | Tendered cash amount |
| Change / Due Display | Readonly Indicator | Yes | If Tendered > Final: Return Change; else: Due |
| Choose Customer | Dropdown Select | No | Default: Walk-in / Cash customer |

##### Data Table (Cart)
| Column | Description |
| :--- | :--- |
| Details | Drug Name, Generic, Strength, Batch No. |
| Sale QTY | Quantity sold in pieces |
| Pcs/Box | Packaging ratio |
| Price/Piece (৳) | Unit selling rate |
| Discount | Line discount applied |
| Price (৳) | Extended line total |
| Action | Delete row |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add (`Enter`) | Inserts selected drug into the sales cart. | `PMS-Sale-Module:CREATE` |
| Add New Product (`F2`) | Opens quick product creation screen (`SCR-03`). | `PMS-Product-Module:CREATE` |
| Return | Transitions screen into Sale Return Mode (`SCR-18`). | `PMS-Sale-Module:RETURN` |
| Print | Prints 80mm thermal receipt. | `PMS-Sale-Module:PRINT` |
| Create Sale | Finalizes transaction, deducts inventory, posts ledger. | `PMS-Sale-Module:CREATE` |

---

#### [SCR-17] Sale Products (Wholesale POS)

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Retail / Wholesale | Toggle Switch | Active: `Wholesale` (Red background indicator) |
| Quick Print | Toggle Switch | Direct thermal print |

##### Form Sections
**Item Entry Bar (Wholesale Differences)**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product | Dropdown / Barcode Scan | Yes | Product catalog search |
| Box Qty | Numeric Input | Yes | Quantity in whole boxes |
| Sale Price | Numeric (Decimal) | Yes | Price per box |
| Dis | Toggle Switch + Input | No | Discount (% / Flat) |

*(Checkout panel identical to `SCR-16`)*

##### Data Table (Cart)
| Column | Description |
| :--- | :--- |
| Details | Drug Name, Formulation, Manufacturer |
| Box Qty | Quantity in whole boxes |
| Pcs/Box | Unit conversion ratio |
| Price/Box (৳) | Wholesale price per box |
| Discount | Line discount amount |
| Price (৳) | Line extended total |
| Action | Delete row |

##### Actions
*(Identical to `SCR-16`)*

---

#### [SCR-18] Sale Return

##### Form Sections
**Return Item Entry**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Product | Dropdown Select | Yes | Return product lookup |
| Box | Numeric Input | Yes | Number of returned boxes |
| Sale Price | Numeric (Decimal) | Yes | Original sale price |
| QTY In Box | Numeric Input | Yes | Pack size multiplier |
| Total QTY | Numeric Input | Yes | Total units returned |
| MIN QTY(pcs) | Numeric Input | No | Threshold |
| Expiry Date | Date Picker | No | Batch expiry date |

**Return Checkout Drawer**:
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Total Items | Readonly Integer | Yes | Count of return lines |
| Total Price | Readonly Currency | Yes | Gross refund value |
| Discount | Toggle + Input | No | Adjustment deduction |
| Final Price | Readonly Currency | Yes | Net cash to refund |
| Paid | Numeric Input | Yes | Cash refunded to customer |
| Inventory Type | Dropdown Select | Yes | Fixed default: `CUSTOMER RETURNED` |
| Invoice Number | Text Input | Yes | Original sales invoice number reference |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Drug Name, Strength, Generic |
| Box | Boxes returned |
| QTY In Box | Pack size |
| BTP + Vat | Unit cost |
| Sale Price | Unit refund rate |
| Total Price | Refund total |
| Free | Free units returned |
| Exp Date | Expiry date |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add (`Enter`) | Adds item to return ledger. | `PMS-Sale-Module:RETURN` |
| Return | Commits refund, credits inventory back as `CUSTOMER RETURNED`. | `PMS-Sale-Module:RETURN` |

---

#### [SCR-19] Customer List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Customer Name | Text Input | Name search |
| Customer Phone | Text Input | Phone number search |
| Customer with Dues (`F9`) | Checkbox | Filters clients with outstanding receivable balance > 0 |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Customer Name, Mobile Number, Customer Type, Address |
| Balance | Current receivable due balance (`৳ 0.00`) |
| Available Points | Loyalty program accumulated point balance |
| Due Date | Promised payment settlement date |
| Action | Collect Due, View Ledger, Edit Profile |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD CUSTOMER (`F2`) | Opens `SCR-20` customer registration form. | `PMS-Customer-Module:CREATE` |
| Switch Table (`F4`) | Toggles grid and filter focus. | All Users |
| Reset | Resets search fields. | All Users |

---

#### [SCR-20] Add Customer

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Customer Name | Text Input | Yes | Mandatory string |
| Phone Number | Phone Input | Yes | Country code `+880` prefix; 10 digits |
| Gender | Dropdown Select | Yes | Valid gender enum |
| Customer Type | Dropdown Select | Yes | Valid customer tier |
| Discount Percent | Numeric Input | No | Default line discount percentage (0–100%) |
| Customer E-mail | Email Input | No | Valid email format |
| Due Toggle | Toggle Switch | No | Enables initial receivable balance entry |
| Due | Numeric (Decimal) | No | Active when Due Toggle is ON; amount >= 0 |
| Payment Date | Date Picker | No | Promised settlement date `DD-MM-YYYY` |
| Customer Address | Textarea | No | Residence or street address |
| Note | Textarea | No | General comments |
| Apply as a Loyalty Member | Toggle Switch | No | Default: Off; enrolls client into loyalty program |

*Dropdown Enums*:
- **Gender**: `Male`, `Female`, `Other`
- **Customer Type**: `Regular`, `Wholesale Client`, `VIP`, `Staff`, `Doctor Referral`

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves customer record and returns to `SCR-19`. | `PMS-Customer-Module:CREATE` |
| Back (`←`) | Cancels registration. | All Users |

---

#### [SCR-21] Sale Record / History

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Sales Number | Text Input | Sale voucher code (e.g. `INV-2026-1029`) |
| Customer Name | Dropdown Select | Autocomplete customer filter |
| Salesman | Text Input | Cashier / Sales representative username |
| Product Name | Dropdown Select | Autocomplete product filter |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Sale Invoice #, Date/Time, Customer Name, Salesman |
| Bill Info | Subtotal, Discount, Card Fee, Total Bill (`৳`) |
| Sale Info | Total items, Payment Mode (Cash/Card/MFS/Due) |
| Payment | Paid Amount vs. Due Amount |
| Action | Reprint Receipt, View Details, Process Return |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Switch Table (`F4`) | Toggles grid focus. | All Users |
| Reset | Clears all filters. | All Users |

---

### 3.5 Module 5: Cash Management

```
Cash
├── SCR-22: Received Cash (Counter Handover)
└── SCR-23: Bulk Reconcile Confirmation Modal
```

#### [SCR-22] Received Cash (Counter Handover)

##### Search & Filter
*No multi-field filter panel. Single table view tracking unreceived cash transactions.*

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Sale Invoice Number, Timestamp, Salesman Name |
| Paid Amount | Physical cash tendered by customer (`৳ 0.00`) |
| Total Price | Net invoice bill value (`৳ 0.00`) |
| Action | Individual "Check / Receive" action button |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Checked All (`F9`) | Opens `SCR-23` confirmation modal to bulk-reconcile all pending counter cash. | `Account-Module:UPDATE` |
| Switch Table (`F4`) | Focuses data rows. | All Users |

---

#### [SCR-23] Bulk Reconcile Confirmation Modal

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| OK | Confirms receipt of all counter cash, deposits funds into master cash account. | `Account-Module:UPDATE` |
| Cancel | Dismisses modal without altering balances. | All Users |

---

### 3.6 Module 6: Due Collection

```
Due Collect
├── SCR-24: Due Collect (Today / Upcoming / Pending)
└── SCR-25: Paid List (Settlement Record)
```

#### [SCR-24] Due Collect (Today / Upcoming / Pending)

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Due Category Tabs | Segmented Buttons | `Today's Due`, `Upcoming Due`, `Pending Due`, `Paid List` |
| Date Range | Date Range Picker | Filter by expected payment date `DD-MM-YYYY ~ DD-MM-YYYY` |
| Search Input | Text Input | Search customer name, invoice number, or mobile |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Customer Name, Phone, Original Sale Invoice Number, Sale Date |
| Due Date | Promised collection date |
| Payment Amount | Total outstanding due balance |
| Action | "Receive Payment" modal trigger, Send SMS Reminder |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Reset | Clears search input. | All Users |

---

#### [SCR-25] Due Collect - Paid List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Date Range | Date Range Picker | Date of settlement receipt |
| Search Input | Text Input | Customer or receipt search |

##### Data Table
| Column | Description |
| :--- | :--- |
| Customer | Customer Name and Phone Number |
| Payment # | Unique payment voucher receipt number |
| Payment Method | Settlement method (`Cash`, `Bank`, `bKash`, `Nagad`) |
| Amount | Collected amount (`৳ 0.00`) |
| Note | Collection remarks / transaction reference |
| Action | Print Money Receipt, View Invoice |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Reset | Resets date and search inputs. | All Users |

---

### 3.7 Module 7: Accounting

```
Accounting
├── SCR-26: Transaction Accounts
├── SCR-27: Create Account
├── SCR-28: Expenses List
├── SCR-29: Create Expense
├── SCR-30: Create Expense Category
├── SCR-31: Income List
├── SCR-32: Additional Balance List
└── SCR-33: Add New Additional Balance
```

#### [SCR-26] Transaction Accounts

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Accounts Type | Dropdown Select | `Cash`, `Bank`, `MFS (Mobile Financial Services)` |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Account Name, Provider/Bank Name, Account Number |
| Balance | Current ledger balance (`৳ 0.00`) |
| Action | View Statement, Edit Account, Transfer Funds |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + Create Account (`F2`) | Opens `SCR-27` account creation form. | `PMS-Chart-Of-Accounting-Module:CREATE` |
| Switch Table (`F4`) | Navigates to grid. | All Users |
| Reset | Clears account type filter. | All Users |

---

#### [SCR-27] Create Account

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Pharmacy User Name | Text Input | Yes | Account title / authorized holder |
| Phone Number | Phone Input | Yes | Prefix `+880`; 10 digits |
| Account Type | Dropdown Select | Yes | Must select valid category |

*Dropdown Enums*:
- **Account Type**: `Cash In Hand`, `Bank Account`, `bKash Personal`, `bKash Merchant`, `Nagad`, `Rocket`, `Card POS Machine`

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Creates account in chart of accounts. | `PMS-Chart-Of-Accounting-Module:CREATE` |
| Back (`←`) | Returns to account list. | All Users |

---

#### [SCR-28] Expenses List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Search By Category | Dropdown Select | List of active expense categories |
| Search By Payment Type | Dropdown Select | `Cash`, `Bank Transfer`, `MFS` |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Voucher #, Date, Creator Name, Note |
| Expense Info | Category Name, Account debited, Amount (`৳ 0.00`) |
| Action | View Voucher, Delete Expense |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD EXPENSE (`F2`) | Opens `SCR-29` create expense form. | `PMS-Expense-Module:CREATE` |
| + ADD EXPENSE CATEGORY | Opens `SCR-30` create category form. | `PMS-Expense-Category-Module:CREATE` |
| Download Report | Exports expense sheet. | `PMS-Report-Module:VIEW` |
| Switch Table (`F4`) | Focuses grid. | All Users |
| Reset | Clears filters. | All Users |

---

#### [SCR-29] Create Expense

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Category | Dropdown Select | Yes | Mandatory expense category |
| Amount | Numeric (Decimal) | Yes | Positive decimal amount > 0.00 |
| Payment Type | Dropdown Select | Yes | Source transaction account |
| Note | Textarea | No | Freeform narration |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Debits chosen payment account, records expense voucher. | `PMS-Expense-Module:CREATE` |
| Back (`←`) | Returns to expense list. | All Users |

---

#### [SCR-30] Create Expense Category

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Category Name | Text Input | Yes | Mandatory unique category string |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves category and adds to expense dropdowns. | `PMS-Expense-Category-Module:CREATE` |
| Back (`←`) | Returns to expense list. | All Users |

---

#### [SCR-31] Income List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Search By Category | Dropdown Select | Active income categories |
| Search By Payment Type | Dropdown Select | `Cash`, `Bank Transfer`, `MFS` |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Receipt #, Timestamp, Received From |
| Income Info | Income Category, Account credited, Amount (`৳ 0.00`) |
| Action | View Receipt, Void |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD INCOME (`F2`) | Opens income entry form. | `PMS-Income-Module:CREATE` |
| + ADD INCOME CATEGORY | Opens income category modal. | `PMS-Income-Category-Module:CREATE` |
| Download Report | Exports income ledger. | `PMS-Report-Module:VIEW` |
| Switch Table (`F4`) | Focuses table. | All Users |
| Reset | Clears filters. | All Users |

---

#### [SCR-32] Additional Balance List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Date Range | Date Range Picker | Filter by capital injection date |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Injection reference number, User name |
| Amount | Capital amount credited (`৳ 0.00`) |
| Note | Source of capital / owner equity comments |
| Action | View voucher |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add New Additional Balance | Opens `SCR-33`. | `PMS-Chart-Of-Accounting-Module:CREATE` |

---

#### [SCR-33] Add New Additional Balance

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Additional Balance Date | Date Picker | Yes | Mandatory date `DD-MM-YYYY` |
| Amount | Numeric (Decimal) | Yes | Positive amount > 0.00 |
| Note | Textarea | No | Narrative remarks |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Confirm Additional Balance | Credits owner equity into store cash pool. | `PMS-Chart-Of-Accounting-Module:CREATE` |
| Cancel | Dismisses form. | All Users |

---

### 3.8 Module 8: Reconciliation

```
Reconciliation
├── SCR-34: Reconciliation List
└── SCR-35: Add Reconciliation
```

#### [SCR-34] Reconciliation List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Search Date Range | Datetime Range Picker | `DD-MM-YYYY HH:mm ~ DD-MM-YYYY HH:mm` |
| Payment From | Dropdown Select | Source account (Cash/Bank/MFS) |
| Payment To | Dropdown Select | Destination account (Cash/Bank/MFS) |

##### Data Table
| Column | Description |
| :--- | :--- |
| Details | Reconciliation Voucher #, Transfer Date, Created By |
| Reconciliation Info | `[Source Account] → [Destination Account]`, Transfer Amount (`৳`) |
| Note | Narrative / deposit slip number |
| Action | View Details, Print Voucher |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Add Reconciliation (`F2`) | Opens `SCR-35` fund transfer form. | `PMS-Reconciliation-Module:CREATE` |
| Switch Table (`F4`) | Focuses grid rows. | All Users |
| Reset | Clears filters. | All Users |

---

#### [SCR-35] Add Reconciliation

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Payment From | Dropdown Select | Yes | Source transaction account with positive balance |
| Payment To | Dropdown Select | Yes | Destination account; must not equal `Payment From` |
| Amount | Numeric (Decimal) | Yes | Amount > 0.00 and <= Source Balance |
| Note | Textarea | No | Bank deposit slip number or remarks |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Executes double-entry fund transfer between accounts. | `PMS-Reconciliation-Module:CREATE` |
| Back (`←`) | Cancels fund transfer. | All Users |

---

### 3.9 Module 9: Representatives (Staff)

```
Representatives
├── SCR-36: Representative List
└── SCR-37: Add Representative
```

#### [SCR-36] Representative List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Name / Search | Text Input | Search staff by name |

##### Data Table
| Column | Description |
| :--- | :--- |
| Name | Pharmacist / Representative full name |
| Phone | Mobile number |
| Role | Assigned permission role (e.g. `PMS Manager`, `PMS Salesman`) |
| Action | Edit Profile, Change Password, Deactivate |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD REPRESENTATIVE (`F2`)| Opens `SCR-37` employee registration form. | `Role-Module:CREATE` |
| Switch Table (`F4`) | Focuses grid. | All Users |

---

#### [SCR-37] Add Representative

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Pharmacist First Name | Text Input | Yes | Non-empty string |
| Pharmacist Last Name | Text Input | Yes | Non-empty string |
| Phone Number | Phone Input | Yes | Prefix `+880`; 10 digits |
| Gender | Dropdown Select | No | `Male`, `Female`, `Other` |
| Pharmacist E-mail | Email Input | No | Valid email address |
| Password | Password Input | Yes | Minimum 6 characters |
| Confirm Password | Password Input | Yes | Must match Password exactly |
| Role | Dropdown Select | Yes | Must select from active roles list |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Creates pharmacist login credentials. | `Role-Module:CREATE` |
| Back (`←`) | Cancels registration. | All Users |

---

### 3.10 Module 10: Roles & Permissions

```
Roles
├── SCR-38: Roles List
└── SCR-39: Add / Edit Role (Permissions Matrix)
```

#### [SCR-38] Roles List

##### Data Table
| Column | Description |
| :--- | :--- |
| Id | Auto-generated role ID (e.g. `9`, `10`) |
| Alias | Role Title (e.g. `PMS Manager`, `PMS Salesman`) |
| Action | Edit Permissions, Duplicate Role, Delete |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + ADD MORE ROLE | Opens `SCR-39` permissions matrix form. | `Role-Module:CREATE` |

---

#### [SCR-39] Add / Edit Role (Permissions Matrix)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Role Alias | Text Input | Yes | Non-empty unique role title |
| Permissions Matrix | Accordion Checklist | Yes | Minimum one permission checked |

*Modular Permission Nodes*:
1. `Account-Module`
2. `Global-Account-Module`
3. `PMS-Barcode-Module`
4. `PMS-Chart-Of-Accounting-Module`
5. `PMS-Customer-Module`
6. `PMS-Expense-Category-Module`
7. `PMS-Expense-Module`
8. `PMS-Income-Category-Module`
9. `PMS-Income-Module`
10. `PMS-Product-Module`
11. `PMS-Reconciliation-Module`
12. `PMS-Report-Module`
13. `PMS-Requisition-Module`
14. `PMS-Sale-Module`
15. `PMS-Vendor-Module`
16. `POS-Shop-Company-Module`
17. `POS-Shop-Generic-Module`
18. `Permission-Module`
19. `Pharmacy-Module`
20. `Role-Module`

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Compiles ACL bitmask/list and saves role. | `Role-Module:CREATE` |
| Back (`←`) | Discards changes. | All Users |

---

### 3.11 Module 11: Doctors Portal

```
Doctors Portal
├── SCR-40: Doctor List
├── SCR-41: Add New Doctor (Bilingual)
└── SCR-42: Prescription Settings
```

#### [SCR-40] Doctor List

##### Search & Filter
| Filter | Type | Options |
| :--- | :--- | :--- |
| Doctor Name | Text Input | English or Bengali name search |
| Phone Number | Text Input | Doctor mobile number |

##### Data Table
| Column | Description |
| :--- | :--- |
| Doctor Name | Practitioner name in English (e.g., `Dr. Mohammad Ali`) |
| Doctor Name Bangla | Practitioner name in Bengali script (`ডা. মোহাম্মদ আলী`) |
| Doctor Phone Number | Registered contact number |
| Gender | Gender |
| Description | Medical degrees / qualifications in English (e.g. `MBBS, FCPS`) |
| Description Bangla | Medical degrees in Bengali (`এমবিবিএস, এফসিপিএস`) |
| Action | View Prescriptions, Edit Doctor, Delete |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| + Add New Doctor (`F2`) | Opens `SCR-41` bilingual doctor form. | `Pharmacy-Module:ADMIN` |
| Reset | Resets search fields. | All Users |

---

#### [SCR-41] Add New Doctor (Bilingual)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| First Name (In English) | Text Input | Yes | Mandatory English text |
| Last Name (In English) | Text Input | No | English text |
| First Name (In Bangla) | Text Input | No | Bengali Unicode text (`প্রথম নাম`) |
| Last Name (In Bangla) | Text Input | No | Bengali Unicode text (`শেষ নাম`) |
| Description (In English) | Textarea | No | Qualifications & designation in English |
| Description (In Bangla) | Textarea | No | Qualifications & designation in Bengali |
| Doctor Phone Number | Phone Input | Yes | Prefix `+880`; 10 digits |
| Gender | Dropdown Select | No | `Male`, `Female`, `Other` |
| Password | Password Input | Yes | Minimum 6 characters |
| Confirm Password | Password Input | Yes | Must match Password |
| Upload Signature | File Upload Box | No | Supported formats: `.png`, `.jpg` (Max 2MB) |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Persists doctor profile and digital signature asset. | `Pharmacy-Module:ADMIN` |
| Back (`←`) | Returns to Doctor List. | All Users |

---

#### [SCR-42] Prescription Settings

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Upload Logo | File Upload Box | No | Pharmacy or clinic brand logo image (`.png`, `.jpg`) |
| Prescription Bottom Row Text | Textarea | No | Legal disclaimer, clinic working hours, or hotline |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Save Changes | Persists layout configuration for printed prescription sheets. | `Pharmacy-Module:ADMIN` |
| Cancel | Discards changes. | All Users |

---

### 3.12 Module 12: Settings

```
Settings
├── SCR-43: Retail or Wholesale Sale Config
├── SCR-44: Invoice Config (80mm Thermal)
├── SCR-45: Product Config
├── SCR-46: Loyalty Config
└── SCR-47: Bulk SMS Config
```

#### [SCR-43] Retail or Wholesale Sale Config

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Cash Received | Toggle Switch (`Yes/No`) | Yes | Default cash drawer behavior |
| Out of Stock Sale | Toggle Switch (`Yes/No`) | Yes | Permits negative inventory sales if stock uncounted |
| Allow Loss Sale | Toggle Switch (`Yes/No`) | Yes | Permits cashier to sell below Purchase Unit Cost |
| Product Purchase Cost | Toggle Switch (`Yes/No`) | Yes | Show/Hide cost to counter sales staff |
| Stock QTY | Toggle Switch (`Yes/No`) | Yes | Show/Hide available stock in POS search |
| Company Name | Toggle Switch (`Yes/No`) | Yes | Display manufacturer in POS line item |
| Profit Margin | Toggle Switch (`Yes/No`) | Yes | Show/Hide live approximate profit margin in POS |
| Rak Number | Toggle Switch (`Yes/No`) | Yes | Display medicine storage shelf/rack number |
| Opening Stock(%) | Numeric Input + Save | No | Default markup percentage applied to opening items |
| Maximum Sale Discount | Numeric Input + Toggle | No | Maximum allowable counter discount (e.g. 10%) |
| Business Type | Toggle Switch | Yes | Default checkout mode: `Retail` or `Wholesale` |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Save | Stores active POS operational rules. | `Pharmacy-Module:ADMIN` |

---

#### [SCR-44] Invoice Config (80mm Thermal)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Paper Type | Dropdown Select | Yes | Default: `80mm` Thermal Roll |
| Top Row Text | Textarea | Yes | Store name, address, drug license number, hotline |
| Served By Row | Toggle Switch (`Show/Not Show`) | Yes | Cashier name line on receipt |
| Discount/Less Row | Toggle Switch (`Show/Not Show`) | Yes | Print discount deductions line |
| Card Fee Row | Toggle Switch (`Show/Not Show`) | Yes | Print card service fee line |
| Customer Name | Toggle Switch (`Show/Not Show`) | Yes | Print customer name |
| Customer Phone | Toggle Switch (`Show/Not Show`) | Yes | Print customer mobile number |
| Simple Print | Toggle Switch (`Show/Not Show`) | Yes | Minimalist compact format without item lines |
| Customer \| Vendor Balance | Toggle Switch (`Show/Not Show`) | Yes | Print closing customer due on bill |
| Shop Logo | Toggle Switch (`Show/Not Show`) | Yes | Print store logo at top of thermal slip |
| Upload Shop Logo | File Upload Box | No | Thermal-compatible monochrome image |
| Bottom Row Text | Textarea | No | Return policy (e.g. *"Item purchased can be exchanged within 7 days with receipt. Item purchased cannot refund for cash."*) |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves invoice template configuration. | `Pharmacy-Module:ADMIN` |

---

#### [SCR-45] Product Config

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Expired Notification Days | Numeric Input | Yes | Integer > 0 (Default: `90` days before expiry) |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Updates threshold for automated expired alert notices. | `Pharmacy-Module:ADMIN` |

---

#### [SCR-46] Loyalty Config

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Loyalty Program | Toggle Switch (`Yes/No`) | Yes | Enables customer reward points tracking |
| Earning Rule | Numeric Input | Yes | Spend amount to earn 1 point (e.g. `100` Tk = 1 point) |
| Redemption Rule | Numeric Input | Yes | Points equivalent to 1 Taka (e.g. `10` points = 1 Tk) |
| Minimum Redeem Points | Numeric Input | Yes | Minimum balance required to redeem |
| Max Redeem Limit per Transaction| Numeric Input | Yes | Ceiling cap on points redeemed per sale |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Submit | Saves loyalty calculation parameters. | `Pharmacy-Module:ADMIN` |

---

#### [SCR-47] Bulk SMS Config

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Current SMS Count | Readonly Badge | Yes | Remaining SMS credits balance (e.g. `0`) |
| Buy Bulk SMS | Step Stepper (`-` / `+`) | Yes | Multiplier of 100 SMS packs (e.g. `1 x 100 = 100 SMS`) |
| Bulk SMS Rate | Readonly Text | Yes | Package pricing (`100 SMS = 50 Tk`) |
| Total Price | Readonly Banner | Yes | Computed purchase price (`50 Tk`) |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Buy Now | Opens instant online payment modal (`SCR-49`) to top up credits via bKash. | `Pharmacy-Module:ADMIN` |

---

### 3.13 Module 13: Subscription & Multi-Branch

```
Subscription & Branch
├── SCR-48: Subscription Report
├── SCR-49: Subscription Payment Modal (bKash Gateway)
└── SCR-50: Change Pharmacy (Branch Switcher)
```

#### [SCR-48] Subscription Report

##### Dashboard Widgets
**Summary Cards Table**:
| Card / Metric | Data Type | Description |
| :--- | :--- | :--- |
| Billing Cycle | Toggle Switch | `Monthly` vs. `Yearly` billing frequency |
| Next Payment Date | Date String | Next billing deadline (e.g., `14 Oct 2026`) |
| Total Payable Amount | Currency Banner | Subscription fee (e.g., `৳ 500.00 / Monthly`) |
| Subscription Status | Status Badge | Active / Trial / Overdue (e.g., `Active`, Green) |

##### Data Table (Billing History)
| Column | Description |
| :--- | :--- |
| Product | SaaS Subscription tier name |
| Reference | Payment transaction ID / gateway reference |
| Date | Payment timestamp |
| Subscription Start Date | Plan start date |
| Subscription End Date | Plan expiration date |
| Amount | BDT amount charged (`৳ 500.00`) |
| Status | `Paid`, `Failed`, `Pending` |
| Download | Downloadable tax receipt / invoice PDF |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Pay Now | Launches bKash gateway modal (`SCR-49`). | `Pharmacy-Module:ADMIN` |

---

#### [SCR-49] Subscription Payment Modal (bKash Gateway)

##### Form Sections
| Field | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| Subtotal | Readonly Currency | Yes | Base fee (e.g., `৳ 500.00`) |
| Have a Discount Code? | Collapsible Text Input | No | Promo coupon string |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Apply | Validates promo code and recalculates subtotal. | All Users |
| Submit | Redirects to bKash PGW (Phone number → OTP → PIN verification). | `Pharmacy-Module:ADMIN` |
| Close (`✕`) | Dismisses payment modal. | All Users |

---

#### [SCR-50] Change Pharmacy (Branch Switcher)

##### Data Table / Branch Cards
| Column | Description |
| :--- | :--- |
| Pharmacy Branch Name | Physical store name (e.g. `Kazi`) |
| Address & Area | Location details (e.g. `Cumilla, Chattagram, Cumilla-3500`) |
| Action | "Select" branch button |

##### Actions
| Action | Description | Permission |
| :--- | :--- | :--- |
| Select | Switches user context and database tenant to selected pharmacy branch. | All Users |
| Logout | Ends active session and returns to login screen. | All Users |

---

## 4. SUMMARY OF NEW PAGES

| Module | Page Count | Page Numbers |
| :--- | :---: | :--- |
| **1. Dashboard** | 1 | `SCR-01` |
| **2. Products & Inventory** | 9 | `SCR-02`, `SCR-03`, `SCR-04`, `SCR-05`, `SCR-06`, `SCR-07`, `SCR-08`, `SCR-09`, `SCR-10` |
| **3. Supplier & Purchase** | 5 | `SCR-11`, `SCR-12`, `SCR-13`, `SCR-14`, `SCR-15` |
| **4. Customer & Sales (POS)** | 6 | `SCR-16`, `SCR-17`, `SCR-18`, `SCR-19`, `SCR-20`, `SCR-21` |
| **5. Cash Management** | 2 | `SCR-22`, `SCR-23` |
| **6. Due Collection** | 2 | `SCR-24`, `SCR-25` |
| **7. Accounting** | 8 | `SCR-26`, `SCR-27`, `SCR-28`, `SCR-29`, `SCR-30`, `SCR-31`, `SCR-32`, `SCR-33` |
| **8. Reconciliation** | 2 | `SCR-34`, `SCR-35` |
| **9. Representatives** | 2 | `SCR-36`, `SCR-37` |
| **10. Roles & Permissions** | 2 | `SCR-38`, `SCR-39` |
| **11. Doctors Portal** | 3 | `SCR-40`, `SCR-41`, `SCR-42` |
| **12. Settings** | 5 | `SCR-43`, `SCR-44`, `SCR-45`, `SCR-46`, `SCR-47` |
| **13. Subscription & Multi-Branch** | 3 | `SCR-48`, `SCR-49`, `SCR-50` |
| **TOTAL** | **50** | **`SCR-01` to `SCR-50`** |

---

## 5. COMPLETE NAVIGATION STRUCTURE

The following tree represents the complete sidebar navigation and hierarchy with assigned screen IDs:

```text
OS Pharmacy PMS
├── [SCR-01] Dashboard
├── Products
│   ├── [SCR-02] Product List
│   │   ├── [SCR-03] PMS Product Add
│   │   ├── [SCR-05] Add Company (Modal)
│   │   └── [SCR-07] Add Generic (Modal)
│   ├── [SCR-04] Company List
│   ├── [SCR-06] Generic List
│   ├── [SCR-08] Product Requisitions
│   ├── [SCR-09] Requisition Record
│   └── [SCR-10] Expired Items
├── Supplier
│   ├── [SCR-11] Supplier List
│   │   └── [SCR-12] Create Supplier
│   ├── [SCR-13] Purchase Products
│   │   ├── [SCR-14] Add New Product for Purchase (Modal)
│   │   ├── [SCR-05] Add Company (Modal)
│   │   └── [SCR-07] Add Generic (Modal)
│   └── [SCR-15] Purchase Record
├── Customer
│   ├── [SCR-19] Customer List
│   │   └── [SCR-20] Add Customer
│   ├── [SCR-16] Sale Products (Retail POS)
│   │   ├── [SCR-17] Sale Products (Wholesale POS)
│   │   ├── [SCR-18] Sale Return
│   │   └── [SCR-03] PMS Product Add
│   ├── [SCR-18] Customer Return
│   └── [SCR-21] Sale Record
├── Cash
│   └── [SCR-22] Received Cash
│       └── [SCR-23] Bulk Reconcile Confirmation (Modal)
├── Due Collect
│   ├── [SCR-24] Due Collect (Today / Upcoming / Pending)
│   └── [SCR-25] Paid List
├── Accounting
│   ├── [SCR-26] Transaction Accounts
│   │   └── [SCR-27] Create Account
│   ├── [SCR-28] Expenses
│   │   ├── [SCR-29] Create Expense
│   │   └── [SCR-30] Create Expense Category
│   ├── [SCR-31] Income
│   └── [SCR-32] Additional Balance List
│       └── [SCR-33] Add New Additional Balance
├── Reconciliation
│   ├── [SCR-34] Reconciliation List
│   └── [SCR-35] Add Reconciliation
├── Representatives
│   ├── [SCR-36] Representative List
│   └── [SCR-37] Add Representative
├── Roles
│   ├── [SCR-38] Roles List
│   └── [SCR-39] Add / Edit Role (Permissions Matrix)
├── Doctors Portal
│   ├── [SCR-40] Doctor List
│   │   └── [SCR-41] Add New Doctor (Bilingual)
│   └── [SCR-42] Prescription Settings
├── Settings
│   ├── [SCR-43] Sale Config
│   ├── [SCR-44] Invoice Config (80mm Thermal)
│   ├── [SCR-45] Product Config
│   ├── [SCR-46] Loyalty Config
│   └── [SCR-47] Bulk SMS Config
├── Subscription Report
│   ├── [SCR-48] Subscription Report
│   └── [SCR-49] Subscription Payment (bKash Modal)
└── Change Pharmacy
    └── [SCR-50] Change Pharmacy (Branch Switcher)
```
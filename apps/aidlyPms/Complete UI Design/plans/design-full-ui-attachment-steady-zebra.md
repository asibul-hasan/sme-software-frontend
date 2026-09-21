# OS Pharmacy PMS — Full UI Implementation Plan

## Context

The user provided a 50-screen functional specification for a Bangladesh pharmacy management ERP (OS Pharmacy PMS). The app is currently a blank scaffold (`src/App.tsx` renders an empty div). The goal is to build a full working frontend with sidebar navigation, routing, and representative screens for all 13 modules.

Given scope (50 screens), the implementation delivers: the app shell + all navigation + Dashboard + key representative screens for each module (list pages, forms, POS). Modals and deep sub-screens are included inline where feasible.

---

## Aesthetic Decision

**Stance**: Structured professional — data-dense ERP with a dark sidebar, clean white content area, teal/green-tinted primary (pharmacy/health connotation), Bengali Unicode support.

**Fonts**: 
- `Plus Jakarta Sans` — display and UI labels (Google Fonts)  
- `Inter` — body text and table data  
- `JetBrains Mono` — numeric values, badges, currency figures

**Palette**:
- Sidebar: `#0f172a` (dark navy)
- Primary accent: `#0d9488` (teal-600)
- Background: `#f8fafc`
- Card: `#ffffff`
- Border: `#e2e8f0`
- Danger: `#ef4444`, Warning: `#f59e0b`, Success: `#10b981`

---

## File Structure

```
src/
  index.css              — Google Fonts @import + Tailwind + CSS tokens
  App.tsx                — Router root
  components/
    Layout.tsx           — Shell: Sidebar + TopBar + <Outlet>
    Sidebar.tsx          — Collapsible nav with all 13 modules
    TopBar.tsx           — Branch name, user menu, notifications
    ui/
      Badge.tsx          — Status badges
      Button.tsx         — Primary/secondary/ghost variants
      Card.tsx           — White card with shadow
      DataTable.tsx      — Generic table component
      Modal.tsx          — Dialog wrapper
      FormField.tsx      — Label + input wrapper
      StatCard.tsx       — KPI metric card
  pages/
    Dashboard.tsx        — SCR-01
    products/
      ProductList.tsx    — SCR-02
      ProductAdd.tsx     — SCR-03
      CompanyList.tsx    — SCR-04
      GenericList.tsx    — SCR-06
      Requisitions.tsx   — SCR-08
      RequisitionRecord.tsx — SCR-09
      ExpiredItems.tsx   — SCR-10
    supplier/
      SupplierList.tsx   — SCR-11
      SupplierAdd.tsx    — SCR-12
      PurchaseEntry.tsx  — SCR-13
      PurchaseRecord.tsx — SCR-15
    customer/
      RetailPOS.tsx      — SCR-16 (Wholesale toggle built-in → SCR-17)
      SaleReturn.tsx     — SCR-18
      CustomerList.tsx   — SCR-19
      CustomerAdd.tsx    — SCR-20
      SaleRecord.tsx     — SCR-21
    cash/
      CashHandover.tsx   — SCR-22
    due/
      DueCollect.tsx     — SCR-24 (tabbed, includes SCR-25 Paid tab)
    accounting/
      Accounts.tsx       — SCR-26
      AccountAdd.tsx     — SCR-27
      Expenses.tsx       — SCR-28
      ExpenseAdd.tsx     — SCR-29
      Income.tsx         — SCR-31
      AdditionalBalance.tsx — SCR-32
    reconciliation/
      ReconciliationList.tsx — SCR-34
      ReconciliationAdd.tsx  — SCR-35
    representatives/
      RepList.tsx        — SCR-36
      RepAdd.tsx         — SCR-37
    roles/
      RoleList.tsx       — SCR-38
      RoleAdd.tsx        — SCR-39
    doctors/
      DoctorList.tsx     — SCR-40
      DoctorAdd.tsx      — SCR-41
      PrescriptionSettings.tsx — SCR-42
    settings/
      SaleConfig.tsx     — SCR-43
      InvoiceConfig.tsx  — SCR-44
      ProductConfig.tsx  — SCR-45
      LoyaltyConfig.tsx  — SCR-46
      SMSConfig.tsx      — SCR-47
    subscription/
      Subscription.tsx   — SCR-48
      BranchSwitcher.tsx — SCR-50
```

---

## Implementation Steps

### 1. CSS & Fonts (`src/index.css`)
- Add `@import url(...)` for Plus Jakarta Sans and Inter from Google Fonts at the top
- Add JetBrains Mono import
- Define CSS custom properties (`:root`) for design tokens: `--background`, `--foreground`, `--card`, `--primary`, `--sidebar`, `--border`, `--radius`, etc.
- Add Bengali font fallback in the font-family stack: `'Plus Jakarta Sans', 'Noto Sans Bengali', sans-serif`

### 2. App Shell (`Layout.tsx`, `Sidebar.tsx`, `TopBar.tsx`)
- `Layout.tsx`: CSS Grid `[sidebar] [main]`, sidebar fixed width 240px (collapsible to 64px icon-only)
- `Sidebar.tsx`: dark navy bg, teal active item highlight, accordion sub-menus for each module group, pharmacy logo/name at top
- `TopBar.tsx`: breadcrumb, branch badge ("Kazi — Cumilla"), user avatar, notification bell
- All 13 module groups wired with correct sub-routes

### 3. React Router (`App.tsx`)
- Use `react-router-dom` with `createBrowserRouter` + `RouterProvider`
- Default route → `/dashboard`
- All 50 screen paths mapped to their page components

### 4. Dashboard (`Dashboard.tsx` — SCR-01)
- Retail/Wholesale segmented toggle + date range picker
- 8 KPI `StatCard`s: Current Cash, Bank Balance, MFS Balance, Today Sale, Today Purchase, Inventory Cost, Total Items, Product Count — with realistic BDT numbers
- Area chart (recharts): Buy Price vs Gross Profit by day
- Bar chart: Net Profit vs Op Cost breakdown
- Two mini-tables: Top Selling / Lowest Selling products
- Cashbook summary ledger box
- Buy/Sale date range financial summary

### 5. POS Interface (`RetailPOS.tsx` — SCR-16/17)
- Split layout: left pane (product search + cart table) + right sticky checkout drawer
- Retail/Wholesale toggle changes column labels and accent color (red for wholesale)
- Cart table with inline delete
- Checkout drawer: total, discount toggle (% / flat), card commission, final price banner, tendered amount stepper, change/due display
- Customer selector dropdown

### 6. Representative list pages
Each list page follows pattern: filter bar → `DataTable` with action column
- Filter inputs wired to local state for live filtering of mock data
- Action buttons (View/Edit/Delete) with onClick handlers (no-op or navigate)

### 7. Representative form pages
Each form page follows pattern: card with labeled `FormField` grid → submit/back buttons
- Form state with `useState`, basic validation on submit
- Inline `+` buttons for Company/Generic modals (opens a `Modal` component)

### 8. Due Collect tabs (`DueCollect.tsx` — SCR-24/25)
- Segmented tabs: Today's Due / Upcoming Due / Pending Due / Paid List
- Date range filter + search input
- Table content switches per tab
- "Receive Payment" action opens a modal with amount input

### 9. Roles Permissions Matrix (`RoleAdd.tsx` — SCR-39)
- Accordion sections per module (20 modules from spec)
- Each module: VIEW / CREATE / UPDATE / DELETE checkboxes in a grid

### 10. Subscription page (`Subscription.tsx` — SCR-48)
- Plan cards: Monthly/Yearly toggle
- Billing history table
- bKash payment modal on "Pay Now" click

---

## Key Patterns & Reuse

- `DataTable` generic component: accepts `columns` + `data` + optional `actions` render prop
- `StatCard`: icon slot, label, value (JetBrains Mono for number), trend badge
- `Modal`: portal-based, backdrop click closes, `✕` button, title + children + footer actions
- `FormField`: label, input/select/textarea, optional error message
- All mock data: realistic Bangladesh pharmacy context — drug names (Napa, Seclo, Amoxi), BDT currency (৳), Bengali text for bilingual fields, Dhaka/Cumilla addresses

---

## Fonts & Styling Notes

- CSS variables used for all colors; Tailwind utility classes reference them via `bg-[var(--primary)]` or inline `style=` where v4 arbitrary values needed
- `font-mono` class applied to all currency and numeric badges
- Bengali fields rendered with `font-family: 'Noto Sans Bengali', sans-serif` via a `.bengali` utility class defined in `index.css`

---

## Verification

1. Dev server is already running — preview will hot-reload
2. Navigate all sidebar items and confirm routes render
3. Check Dashboard KPI cards and charts display
4. Toggle Retail ↔ Wholesale in POS and confirm label/color change
5. Open a modal (Add Company from Product List) and verify backdrop/close behavior
6. Resize viewport to ~900px and confirm sidebar collapses, content reflows

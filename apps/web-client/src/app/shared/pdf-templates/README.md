# Shared PDF Template System

> **Location:** `apps/web-client/src/app/shared/pdf-templates/`  
> **Purpose:** A module-agnostic, declarative PDF report engine for Aidly ERP. Every module (FIN, SYS, HRM, INV, SAL, PUR, RPT) can define reusable report templates that render with a consistent company/branch header, page footer, and signature block.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Component / Form Page                      │
│  ── calls ──► PdfTemplateService.render()   │
└─────────────────┬─────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  PdfTemplateService                           │
│  • Fetches company + branch profile           │
│  • Builds jsPDF document                      │
│  • Iterates sections from template            │
│  • Draws header / footer on every page        │
└─────────────────┬─────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  PdfTemplate (declarative)                    │
│  • buildSections(context) → PdfTemplateSection[]
│  • title, fileName, orientation, signatures │
└─────────────────────────────────────────────┘
```

**Key principle:** the template is **pure data + a builder function**. The service owns all rendering, styling, and layout. This means every report looks consistent (same company header, same fonts, same signature block) while the template decides *what* goes inside.

---

## 2. Built-in Section Types

| Section | Purpose | Example |
|---------|---------|---------|
| `title` | Large centered/aligned heading | "Trial Balance Report" |
| `subtitle` | Smaller descriptor under title | date range, branch name |
| `text` | Paragraph or note | "No records found." |
| `table` | Data grid using `ColumnDef` | account rows, user list |
| `summary` | Key/value grid | totals, statistics |
| `separator` | Horizontal line | visual divider |
| `spacer` | Blank vertical space | 4mm gap |
| `signatures` | Three signature slots | Prepared/Checked/Approved |
| `custom` | Raw jsPDF draw function | charts, special layouts |

---

## 3. How to Use (in a Form Component)

### 3.1 Quick: use the reusable button

```typescript
import { PdfReportButtonComponent } from '@app/shared/components/pdf-report-button';
import { PdfTemplateService } from '@app/shared/pdf-templates';
```

```html
<!-- Option A: registered template by id -->
<app-pdf-report-button
  [templateId]="'FIN.trial-balance'"
  [context]="reportContext"
  fileName="trial-balance-june-2026"
  tooltip="Export PDF"
/>

<!-- Option B: inline template object -->
<app-pdf-report-button
  [template]="trialBalanceTemplate"
  [context]="reportContext"
/>
```

### 3.2 Programmatic: call the service directly

```typescript
import { PdfTemplateService } from '@app/shared/pdf-templates';
import { trialBalanceReportTemplate } from '@app/features/fin/report-templates';

export class Fin1301Component {
  private readonly pdfService = inject(PdfTemplateService);

  async exportPdf(): Promise<void> {
    const context = {
      asOfDate: '30/06/2026',
      branchName: 'Dhanmondi',
      currencyCode: 'BDT',
      rows: this.trialBalanceRows(),
    };

    // Option A: registered template (recommended)
    await this.pdfService.renderById('FIN.trial-balance', context);

    // Option B: direct template
    await this.pdfService.render(trialBalanceReportTemplate, context);
  }
}
```

---

## 4. How to Create a New Template

### 4.1 Define the context shape

```typescript
export interface MyReportContext {
  fromDate: string;
  toDate: string;
  rows: MyRow[];
}

export interface MyRow {
  code: string;
  name: string;
  amount: number;
  status: number;
}
```

### 4.2 Define columns (reuse `ColumnDef` from `app-common-table`)

```typescript
import { ColumnDef } from '@app/shared/components/common-table';

const myColumns: ColumnDef[] = [
  { title: 'Code', field: 'code', width: '100px', cellType: 'text' },
  { title: 'Name', field: 'name', width: '200px', cellType: 'text' },
  { title: 'Amount', field: 'amount', width: '120px', cellType: 'currency', align: 'right', precision: 2 },
  {
    title: 'Status',
    field: 'status',
    width: '100px',
    cellType: 'badge',
    badgeConfig: (v) => v === 1 ? { label: 'Active', variant: 'success' } : { label: 'Inactive', variant: 'neutral' },
  },
];
```

### 4.3 Build the template

```typescript
import { PdfTemplate, PdfTemplateSection } from '@app/shared/pdf-templates';

export const myReportTemplate: PdfTemplate<MyReportContext> = {
  id: 'INV.my-report',          // unique across all modules
  module: 'INV',                // 'SYS' | 'FIN' | 'HRM' | 'INV' | 'SAL' | 'PUR' | 'RPT'
  formId: 'INV_1301',           // for audit / permission tracking
  title: 'My Inventory Report', // shown in PDF header
  fileName: 'inventory-report', // output filename base
  orientation: 'portrait',      // or 'landscape' (auto if table >7 cols)
  showSignatures: true,         // adds Prepared/Checked/Approved block
  showPageFooter: true,         // "Generated by Aidly ERP" + page number

  buildSubTitle(context): string {
    return `${context.fromDate} – ${context.toDate}`;
  },

  buildSections(context): PdfTemplateSection[] {
    return [
      { type: 'title', text: 'Inventory Summary', align: 'center', fontSize: 14 },
      { type: 'spacer', height: 3 },
      { type: 'separator' },
      { type: 'spacer', height: 3 },
      {
        type: 'summary',
        title: 'Filter Criteria',
        columnsPerRow: 2,
        rows: [
          { label: 'From Date', value: context.fromDate },
          { label: 'To Date', value: context.toDate },
          { label: 'Total Records', value: context.rows.length },
        ],
      },
      { type: 'spacer', height: 4 },
      {
        type: 'table',
        title: 'Details',
        columns: myColumns,
        rows: context.rows,
        showRowNumbers: true,
      },
    ];
  },
};
```

### 4.4 Register it (so `renderById` works)

In the module's `index.ts` or `report-templates/index.ts`:

```typescript
import { pdfTemplateRegistry } from '@app/shared/pdf-templates';
import { myReportTemplate } from './my-report.template';

pdfTemplateRegistry.register(myReportTemplate);
```

---

## 5. File & Folder Conventions

```
features/{module}/report-templates/
├── index.ts                        # barrel: exports + registers all templates
├── my-report.template.ts           # one template per file
├── another-report.template.ts
└── shared/
    └── my-report.types.ts          # context + row interfaces (optional)
```

**Shared core:**
```
shared/pdf-templates/
├── pdf-template.types.ts          # all types (module-agnostic)
├── pdf-template.registry.ts       # global template registry singleton
├── pdf-template.service.ts        # PDF rendering engine
└── index.ts                       # barrel export
```

**Reusable button:**
```
shared/components/pdf-report-button/
├── pdf-report-button.component.ts
└── index.ts
```

---

## 6. Integration with `app-common-table`

The table section uses the **same `ColumnDef`** shape as `app-common-table`. This means:

- You can **copy the column definition** from the form's table straight into the PDF template.
- `cellType`, `badgeConfig`, `value`, `currency`, `date`, `precision` all work identically.
- The `TableExportService` (Excel/CSV/Print) and `PdfTemplateService` share the same display-value logic.

If a column uses a `custom-template` in the UI, you must provide a `value` accessor in the `ColumnDef` so the PDF engine knows what text to print:

```typescript
{
  title: 'Branch',
  field: 'branch_no',
  cellType: 'custom-template',
  // 👇 required for PDF export
  value: (row) => this.branchLabel(row['branch_no']),
}
```

---

## 7. Auto-Landscape

If you don't specify `orientation`, the engine checks every `table` section. If any table has **>7 columns**, it automatically switches to **landscape**. You can always force portrait or landscape explicitly:

```typescript
orientation: 'landscape'   // always landscape
orientation: 'portrait'    // always portrait
orientation: undefined     // auto-detect (default)
```

---

## 8. Styling Defaults (applied uniformly)

| Element | Style |
|---------|-------|
| Page border | Light gray rectangle 7mm from edge |
| Company header | Logo + name + address (left); title + date (right) |
| Table header | `#F1F5F9` background, bold, uppercase |
| Table rows | Alternating `#F8FAFC` |
| Table font | 8pt Helvetica |
| Summary label | Bold slate gray |
| Summary value | Normal dark text |
| Separator | 0.3pt light gray line |
| Page footer | "Generated by Aidly ERP" centered + page number right |
| Signature block | Three ⅓-width slots with underline + label |

---

## 9. Existing Templates (seeded)

| Template ID | Module | Form | Description |
|-------------|--------|------|-------------|
| `FIN.trial-balance` | FIN | FIN_1301 | Trial Balance report with totals summary |
| `SYS.user-list` | SYS | SYS_1101 | User Management report with summary cards |

---

## 10. Comparison with `TableExportService`

| Feature | `TableExportService` | `PdfTemplateService` |
|---------|----------------------|----------------------|
| Excel/CSV/Print | ✅ | ❌ (use `TableExportService`) |
| PDF | ✅ (single table only) | ✅ (rich multi-section) |
| Company header | ✅ | ✅ (shared style) |
| Multi-section layout | ❌ | ✅ (title + summary + table + signatures) |
| Dynamic context | ❌ | ✅ (template builds sections from context) |
| Signature block | ✅ | ✅ (configurable per template) |
| Reusable templates | ❌ | ✅ (registry + `renderById`) |
| Custom drawing | ❌ | ✅ (`custom` section type) |

**Rule of thumb:**
- Simple "export the current table to PDF" → use `TableExportService.exportToPdf()` from the common-table toolbar.
- Formal business report with header, summary, multiple tables, signatures → use `PdfTemplateService` with a registered template.

---

## 11. Testing a Template Locally

```typescript
import { PdfTemplateService } from '@app/shared/pdf-templates';
import { myReportTemplate } from '@app/features/inv/report-templates';

// In a component or console (dev only):
const pdfService = inject(PdfTemplateService);

pdfService.render(myReportTemplate, {
  fromDate: '01/06/2026',
  toDate: '30/06/2026',
  rows: [
    { code: 'INV-001', name: 'Aarong Tea 500g', amount: 15000, status: 1 },
    { code: 'INV-002', name: 'Fresh Milk 1L', amount: 8200, status: 1 },
  ],
});
```

The PDF will download immediately in the browser.

---

## 12. Adding a New Module's Templates

1. Create `features/{module}/report-templates/`.
2. Write `{report-name}.template.ts` with `PdfTemplate<Context>`.
3. Export and register in `features/{module}/report-templates/index.ts`.
4. Import the module's `report-templates/index.ts` in the module's main `index.ts` (or lazy-load it) so registration runs at bootstrap.

No changes to `shared/pdf-templates/` are needed — it's fully generic.

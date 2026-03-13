# `data-table` — Angular ERP Table Library

A self-contained, standalone Angular data table component designed for ERP applications. Zero external dependencies beyond Angular CDK and Material Tooltip.

---

## Folder Structure

```
data-table/
├── index.ts                        ← Public API barrel (import from here)
├── core/
│   ├── data-table.component.ts     ← Main component logic
│   ├── data-table.component.html   ← Template
│   └── data-table.component.scss   ← Styles
├── types/
│   └── data-table.types.ts         ← All interfaces & enums
├── constants/
│   └── data-table.constants.ts     ← Defaults & cycles
├── pipes/
│   └── cell-display.pipe.ts        ← Formats cell values for display
├── utils/
│   ├── export.util.ts              ← CSV / XLSX / PDF export (PDF fix)
│   ├── pipeline.util.ts            ← Filter → sort → paginate → summary
│   ├── row.util.ts                 ← Row CRUD helpers
│   └── validation.util.ts          ← Cell & row validation
└── README.md
```

---

## Quick Start

```typescript
// In your module / component
import { DataTableComponent, ColumnDef, TableConfig, SqlState } from './data-table';

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [config]="config"
      [columns]="columns"
      [data]="rows"
      (dataChange)="onDataChange($event)"
      (rowEvent)="onRowEvent($event)"
      (selectionChange)="onSelection($event)"
    />
  `,
})
export class MyPage {
  config: TableConfig = {
    uniqueId:              'my-table',
    allowAdd:              true,
    allowDelete:           true,
    allowDuplicate:        true,
    allowExport:           true,
    allowColumnVisibility: true,
    allowColumnFilter:     true,
    allowRowSelection:     true,
    allowGlobalSearch:     true,
    allowFullscreen:       true,
    showRowNumbers:        true,
    showFooterSummary:     true,
    pageSizeOptions:       [10, 25, 50],
    exportFilename:        'my-report',
    exportTitle:           'My Report',
  };

  columns: ColumnDef[] = [
    { key: 'name',     header: 'Name',     type: 'text',       editable: true,  required: true },
    { key: 'email',    header: 'Email',    type: 'email',      editable: true },
    { key: 'salary',   header: 'Salary',   type: 'currency',   editable: true,  align: 'right' },
    { key: 'progress', header: 'Progress', type: 'progress' },
    { key: 'rating',   header: 'Rating',   type: 'rating' },
    { key: 'status',   header: 'Status',   type: 'select',     editable: true,
      options: [
        { value: 'active',   label: 'Active',   color: '#10b981' },
        { value: 'inactive', label: 'Inactive', color: '#ef4444' },
        { value: 'pending',  label: 'Pending',  color: '#f59e0b' },
      ],
    },
    { key: 'joined',   header: 'Joined',   type: 'date',       editable: true },
    { key: 'verified', header: 'Verified', type: 'boolean' },
    { key: 'website',  header: 'Website',  type: 'link' },
    { key: 'avatar',   header: 'User',     type: 'avatar',     width: '160px' },
  ];

  rows = [
    { sqlState: SqlState.UNCHANGED, name: 'Alice', email: 'alice@co.com', salary: 85000, ... },
  ];
}
```

---

## Column Types

| Type         | Display                      | Editable? |
| ------------ | ---------------------------- | --------- |
| `text`       | Plain string                 | ✅        |
| `number`     | Locale-formatted number      | ✅        |
| `currency`   | `$1,234.56` (or any locale)  | ✅        |
| `percentage` | `87.5%`                      | ✅        |
| `date`       | `Jan 15, 2025`               | ✅        |
| `select`     | Colored badge from options   | ✅        |
| `badge`      | Colored badge (static)       | ❌        |
| `boolean`    | ✓ / ✗ icon                   | ❌        |
| `progress`   | Color-coded bar + percentage | ❌        |
| `rating`     | 1–5 star display             | ❌        |
| `avatar`     | Initials circle + name       | ❌        |
| `link`       | Clickable anchor (new tab)   | ❌        |
| `email`      | `mailto:` anchor             | ❌        |

---

## TableConfig Reference

| Property                | Type       | Default              | Description                     |
| ----------------------- | ---------- | -------------------- | ------------------------------- |
| `uniqueId`              | `string`   | required             | Used for caching/state          |
| `allowAdd`              | `boolean`  | false                | Show "Add Row" button           |
| `allowDelete`           | `boolean`  | false                | Show delete / duplicate actions |
| `allowDuplicate`        | `boolean`  | true                 | Show duplicate action           |
| `allowExport`           | `boolean`  | false                | CSV / XLSX / PDF export         |
| `allowColumnVisibility` | `boolean`  | false                | Show/hide column picker         |
| `allowColumnFilter`     | `boolean`  | true                 | Per-column text filters         |
| `allowRowSelection`     | `boolean`  | false                | Checkboxes + bulk delete        |
| `allowGlobalSearch`     | `boolean`  | true                 | Global search bar               |
| `allowFullscreen`       | `boolean`  | false                | Fullscreen toggle               |
| `allowInlineEdit`       | `boolean`  | true                 | Click-to-edit cells             |
| `showRowNumbers`        | `boolean`  | false                | # column                        |
| `showFooterSummary`     | `boolean`  | false                | Σ sum row                       |
| `stripedRows`           | `boolean`  | false                | Alternating row shading         |
| `pageSizeOptions`       | `number[]` | [10,25,50,100]       | Page size dropdown              |
| `defaultPageSize`       | `number`   | 25                   | Initial page size               |
| `exportFilename`        | `string`   | `'export'`           | Downloaded file name            |
| `exportTitle`           | `string`   | —                    | Title in PDF header             |
| `emptyMessage`          | `string`   | `'No records found'` | Empty state text                |
| `hideAddButton`         | `boolean`  | false                | Programmatic add only           |

---

## Validation

```typescript
columns: ColumnDef[] = [
  {
    key: 'email', header: 'Email', type: 'email', editable: true,
    validation: {
      required:  true,
      pattern:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 100,
      custom: (val, row) => val.endsWith('.gov') ? 'No government emails' : null,
    },
  },
];
```

Invalid cells get a red highlight and show the error in a tooltip.

---

## ViewChild API

```typescript
@ViewChild(DataTableComponent) table!: DataTableComponent;

save() {
  if (!this.table.isValid()) {
    alert('Please fix validation errors first');
    return;
  }
  const changed = this.table.getChangedRows();   // INSERT + UPDATE + DELETE
  const inserts = this.table.getInsertedRows();
  const updates = this.table.getUpdatedRows();
  const deletes = this.table.getDeletedRows();
  // POST to your API...
}
```

---

## PDF Fix

The PDF export now works correctly. The issue was:

1. `jspdf-autotable` was not being awaited before calling `autoTable`
2. `autoTable` must be called as `(doc as any).autoTable(...)` (instance method) after importing the plugin
3. `doc.save()` is used directly instead of `URL.createObjectURL`

---

## Keyboard Shortcuts

| Key         | Action                            |
| ----------- | --------------------------------- |
| `Tab`       | Move to next editable cell in row |
| `Shift+Tab` | Move to previous editable cell    |
| `Enter`     | Move to same column in next row   |
| `Escape`    | Exit edit mode / close fullscreen |

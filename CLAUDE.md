# CLAUDE.md — Aidly ERP Frontend

Angular frontend for Aidly ERP, organized as an Nx workspace.

- **App:** `apps/web-client`
- **Feature forms:** `apps/web-client/src/app/features/{module}/forms/{formId}`
- **Shared code:** `apps/web-client/src/app/shared` (components, pipes, directives)
- **Global styles:** `apps/web-client/src/assets/styles` (`_form-page.scss`, `styles.scss`)
- **Build:** `npx nx build web-client` | **Serve:** `npx nx serve web-client`

Broader architecture notes live in `FRONTEND_ARCHITECTURE.md`.

---

## Shared UI Patterns

App-wide conventions. Reuse these instead of `mat-tab-group`, a raw
`mat-checkbox`, or ad-hoc markup so every form stays visually consistent.

### Tabs — `.form-tab-btn`

**Do not use `<mat-tab-group>`** for tabs. Use the button-based tab bar — it
avoids the Material tab pagination/scrollbar artefacts and matches the app
theme. Styles: `assets/styles/_form-page.scss` (`.form-tab-bar`,
`.form-tab-btn`, `.tab-icon`).

**Template:**

```html
<div class="form-tab-bar d-flex gap-1 mb-3">
  <button
    type="button"
    class="form-tab-btn"
    [class.active]="activeTab() === 'first'"
    (click)="activeTab.set('first')"
  >
    <mat-icon class="tab-icon">icon_name</mat-icon>
    First Tab
  </button>
  <button
    type="button"
    class="form-tab-btn"
    [class.active]="activeTab() === 'second'"
    (click)="activeTab.set('second')"
  >
    <mat-icon class="tab-icon">icon_name</mat-icon>
    Second Tab
  </button>
</div>

@if (activeTab() === 'first') { <!-- first panel --> }
@if (activeTab() === 'second') { <!-- second panel --> }
```

**Component:** track the active tab in a `signal`:

```ts
activeTab = signal<'first' | 'second'>('first');
```

- The active button gets `.active` (indigo text + bottom underline).
- **Page-level tabs** (switch the whole form) project into the `tabBarContent`
  slot of `app-page-form-layout` and add `px-3 pt-2` — see `HR1002`
  (Department Setup / Designation Setup).
- **In-card tabs** sit directly inside a `.card-body` — see the Password
  Management card in `SYS1101` (Change Password / Reset Password).

### Checkboxes — `.custom--checkbox`

Wrap every `mat-checkbox` in a `.custom--checkbox` div so it renders as a
bordered control matching input-field height (42px) with a hover border.
Style: `assets/styles/_form-page.scss` (`.custom--checkbox`).

**Template:**

```html
<div class="field-group">
  <div class="custom--checkbox">
    <mat-checkbox formControlName="some_flag" color="primary">
      <span class="field-label mb-0" style="cursor: pointer">Label text</span>
    </mat-checkbox>
  </div>
</div>
```

- Always `color="primary"`.
- The label is a `<span class="field-label mb-0">` **inside** `<mat-checkbox>`,
  never a separate sibling `<label>`.
- Bind with `formControlName` for flags saved with the form; use `[checked]`
  plus `(change)` for a checkbox that fires an immediate action.
- Reference forms: `SYS1002` (`is_main_branch`), `SYS1003`, `SYS1004`,
  `SYS1101` (account lock).

### Card-to-Card Gap — `.form-section-card`

Cards within a form column stack vertically. The spacing system is:

| Layer | Value | Source |
|-------|-------|--------|
| Between cards in same column | `4px` | `.form-section-card { margin-bottom: 4px }` |
| Between rows (`row-group`) | `8px` | `.row-group { --bs-gutter-y: 0.5rem }` |
| Page card body children gap | `4px` | `.page-card-body { gap: 4px }` |
| Card header padding | `8px 12px` | `.form-section-card .card-header { padding: 0.5rem 0.75rem }` |
| Card body padding | `8px 12px` | `.form-section-card .card-body { padding: 0.5rem 0.75rem }` |
| Field group gap | `5px` | `.field-group { gap: 5px }` |

**Layout pattern (reference: `SYS1001`):**

```html
<div class="row row-group">
  <!-- Left column -->
  <div class="col-xl-9 col-lg-8">
    <div class="form-section-card card">
      <div class="card-header">
        <h4 class="card-header__title mb-0 fw-bold">
          <mat-icon class="me-2 align-middle">icon_name</mat-icon>
          Section Title
        </h4>
      </div>
      <div class="card-body">
        <div class="row row-group">
          <!-- fields -->
        </div>
      </div>
    </div>
    <!-- Next card stacks with 4px gap automatically -->
    <div class="form-section-card card">...</div>
  </div>

  <!-- Right column -->
  <div class="col-xl-3 col-lg-4">
    <div class="form-section-card card">...</div>
  </div>
</div>
```

- Cards in the same column stack naturally via `margin-bottom: 4px`.
- Do NOT add manual `mb-3` or `gap-*` between `.form-section-card` cards — the 4px margin is the standard.
- Use `row-group` on every `.row` for consistent 8px gutters.
- Reference form: `SYS1001` (Company Setup — 4 cards in 2 columns).

### Common Table — `<app-common-table>`

Reusable ERP table at `shared/components/common-table`. Use it instead of
ad-hoc `mat-table` markup for any data list.

**Quick usage:**

```html
<!-- Inside a form-section-card -->
<div class="form-section-card card">
  <div class="card-header">
    <h4 class="card-header__title mb-0 fw-bold">
      <mat-icon class="me-2">table_view</mat-icon>
      List Title
    </h4>
  </div>
  <div class="card-body p-0">
    <app-common-table
      [columns]="tableColumns"
      [data]="tableData()"
      [config]="tableConfig"
      (rowClick)="onRowClick($event)"
    />
  </div>
</div>
```

**Component:**

```ts
import { ColumnDef, TableConfig } from '@app/shared/components/common-table';

tableColumns: ColumnDef[] = [
  { title: 'Code',  field: 'code',  sort: true, cellType: 'text', width: '150px', pin: 'left' },
  { title: 'Name',  field: 'name',  sort: true, cellType: 'text' },
  { title: 'Date',  field: 'date',  sort: true, cellType: 'date', dateFormat: 'dd/MM/yyyy' },
  { title: 'Amount', field: 'amount', sort: true, cellType: 'currency', align: 'right', precision: 2, bottomTotal: true },
  { title: 'Status', field: 'status', sort: true, cellType: 'badge', width: '120px',
    badgeConfig: (val) => val === 'A' ? { label: 'Active', variant: 'success' } : { label: 'Inactive', variant: 'neutral' } },
];

tableConfig: Partial<TableConfig> = {
  showSearch: true,
  pagination: true,
  defaultPageSize: 10,
  dense: true,
  striped: true,
};

tableData = computed(() => this.model.items() as unknown as Record<string, unknown>[]);
```

**Key rules:**
- `field` values must match the backend DTO field names (snake_case).
- Wrap the table in `<div class="card-body p-0">` — zero padding so the table fills the card edge-to-edge.
- Use `(rowClick)` to load a row's detail into the form (master-detail pattern).
- Column types: `text`, `number`, `decimal`, `currency`, `date`, `datepipe`, `select`, `checkbox`, `badge`, `icon`, `button`, `custom-template`.
- See `shared/components/common-table/example-usage.ts` for full feature demos.

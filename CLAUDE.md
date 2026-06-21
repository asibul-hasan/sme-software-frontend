# CLAUDE.md — Aidly ERP Frontend

Angular frontend for Aidly ERP, organized as an Nx workspace.

- **App:** `apps/web-client`
- **Feature forms:** `apps/web-client/src/app/features/{module}/forms/{formId}`
- **Shared code:** `apps/web-client/src/app/shared` (components, pipes, directives)
- **Global styles:** `apps/web-client/src/assets/styles` (`_form-page.scss`, `styles.scss`)
- **Build:** `npx nx build web-client` | **Serve:** `npx nx serve web-client`

Broader architecture & business docs live in `../aidly-business-doc/frontend/` (e.g. `FRONTEND_ARCHITECTURE.md`, `*-forms-design.md`). DB schema design, migrations and backend design docs live in `../aidly-business-doc/backend/` (incl. `db-migration/`).

---

## Post-Save Selection Rule (CRITICAL)

After every save in a master-detail form with a sidebar list:

| Action | What to select after reload |
|--------|----------------------------|
| **Create new record** | The newly created record — pass its PK (from `res.data`) to the reload method |
| **Update existing record** | Keep the current selection — pass `selectedXxxNo()` to the reload method |
| **Delete record** | Clear the form / select nothing — pass `null` |

```typescript
// ✅ CORRECT
const savedNo = isUpdate
  ? this.selectedItemNo()           // update → keep selection
  : res.data?.item_no ?? null;      // create → select new record by PK from response
this.loadItems(savedNo);

// ❌ WRONG — always selects index 0 (oldest), never the newly created record
this.loadItems(isUpdate ? this.lastSelectedIndex : 0);

// ❌ WRONG — passes null for new records → falls back to onNew() / empty form
this.loadItems(isUpdate ? this.selectedItemNo() : null);
```

Inside `loadItems(reselectNo?)`: find the target by PK, fall back to first item if not found.
**Never reselect by array index** — the list order may change (especially with descending sort).

### Scroll active item into view

Every form component must scroll the selected sidebar item into view when selection changes:

```typescript
// In the component constructor:
private el = inject(ElementRef);

constructor() {
  effect(() => {
    this.model.selectedItemNo(); // reactive dependency — re-runs on every selection change
    setTimeout(() => {
      this.el.nativeElement
        .querySelector('.list-group-item.active')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 50); // 50ms lets Angular finish updating the DOM before scrolling
  });
}
```

---

## List Ordering Rule (CRITICAL)

**Sidebar / filter lists always display in DESCENDING order by primary key.**
The most recently added record appears at the TOP of the list.

```typescript
// ✅ CORRECT — newest first
filteredItems = computed(() =>
  this.items()
    .filter(...)
    .sort((a, b) => b.item_no - a.item_no)   // descending PK
);

// ❌ WRONG — ascending leaves newest at the bottom
filteredItems = computed(() => this.items().filter(...));
```

Apply this rule to every `filteredXxx = computed(...)` signal that feeds a sidebar list or a `@for` loop in `sidebarList`.  Backend APIs already return rows ascending by PK; the sort is applied on the frontend computed signal, not in the HTTP call.

---

## Shared UI Patterns

App-wide conventions. Reuse these instead of `mat-tab-group`, a raw
`mat-checkbox`, or ad-hoc markup so every form stays visually consistent.

### Form Archetypes — pick ONE layout, don't mix (CRITICAL)

There are exactly **two** form layouts. Every form is one of them. Drift (each
form inventing its own structure) is the #1 source of inconsistency — match the
reference forms below exactly.

**A. Master–detail** (a record list on the left, an edit form on the right) —
the default for "setup" forms. Use `<app-page-form-layout>` with this sidebar
stack, in this order:

1. `[sidebarFilters]` — filter `ng-select`s (optional). Every change calls `model.pager.reset()`.
2. Built-in **search + sort** — wired via the layout's `[searchTerm]`/`(searchTermChange)`
   and `[sortDirection]`/`(sortDirectionChange)`; `[hasActiveFilters]`/`(clearFilters)` for Clear-all.
3. `[sidebarList]` — rows rendered from **`model.pager.paged()`** (NOT the raw filtered list).
4. `[sidebarFooter]` — **`<app-sidebar-pagination [pager]="model.pager">`**.

The paginator is mandatory so long lists don't blow up the DOM:

```ts
// model.service.ts
filteredItems = computed(() => this.items().filter(...).sort((a, b) => b.id - a.id));
pager = makePaginator(this.filteredItems);   // from core/utils/paginator
// reset the pager on EVERY search / filter / sort change (or rows strand on an empty page)
```

```html
<div sidebarList>
  @for (row of model.pager.paged(); track row.id) { … }
</div>
<app-sidebar-pagination sidebarFooter [pager]="model.pager" />
```

**Sort toggle (asc/desc).** The layout shows the sort button by default
(`showSort=true`), but it only *works* when wired. The standard way: give the
paginator a `sortKey` and bind the pager to the layout — **no per-form
`sortDirection` signal needed**:

```ts
pager = makePaginator(this.filteredItems, { sortKey: (x) => x.item_no });
// default direction is 'desc' (newest first); the toggle flips it
```
```html
<app-page-form-layout … [pager]="model.pager"> … </app-page-form-layout>
```

The button is a no-op if you neither pass `[pager]` (with a `sortKey`) nor wire
the legacy `[sortDirection]`/`(sortDirectionChange)` + a model signal. Prefer the
`[pager]` route. (Legacy `[sortDirection]` forms — SYS1002/1004/1005/1101 — still
work; migrate them when touched.)

Reference forms: **SYS1002** (Branch), **SYS1004** (Currency), **SYS1101** (User),
**SYS1102** (Role), **SYS1103** (Permission Matrix), **SYS1104** (User-Branch).
A master-detail form that renders `filteredItems()` directly with no `[sidebarFooter]`
pagination is **wrong** — wire the paginator.

**B. Data grid** — a tabular dataset (line items, periods, mappings) shown with
**`<app-common-table>`**, which owns its own search / pagination / export / column
toggle. Use it for the grid, NOT for the master record selector. A grid form may
have `[hasSidebar]="false"` (e.g. a top filter `ng-select` instead of a sidebar).

Reference forms: **SYS1003** (Financial Year — periods table), **SYS1104** (the
mapping grid uses `<app-common-table>` with `custom-template` cells).
**SYS1003 Accounting Periods is the canonical table structure and visual style.**
Any form that shows an editable/supporting grid — including **SYS1006 Exchange
Rate** — must copy the Accounting Periods pattern: an outer `.form-section-card`
section, a normal card header/title/action row, a zero-padding `.card-body p-0`,
and one `<app-common-table>` filling that body. Do not invent a different table
wrapper, split-table layout, Bootstrap table, or custom `mat-table` for exchange
rates or similar grids.

**Why two styles exist:** master-detail (browse many records, edit one) and
data-grid (operate on rows in place) are genuinely different jobs. The mistake is
*within* an archetype — paginating one sidebar but not another, or hand-rolling a
`<table>` where the common table belongs. Always copy the reference form.

### Sidebar Master List — `[sidebarList]` rows (CRITICAL)

Every master-detail sidebar list inside `<app-page-form-layout>` MUST follow this
row structure. The styling is global (`assets/styles/_form-page.scss`), so do NOT
hand-roll Bootstrap `badge` / `list-group-item p-3` markup.

**Status is ALWAYS a corner dot — never an "Active/Inactive" text pill.**
🟢 green = active, 🔴 red = inactive (`.status-dot--corner` pinned top-right, with a
`[title]` for the full word). Type/category labels (System, BASE, Main Branch, VAT…)
use `.list-item-tag`, never the status colours.

**Standard row template:**

```html
<button
  type="button"
  class="list-group-item list-group-item-action"
  [class.active]="model.selectedNo() === row.id"
  (click)="model.select(row)"
>
  <!-- status light, top-right corner -->
  <span
    class="status-dot status-dot--corner"
    [class.status-dot--active]="row.is_active === 1"
    [class.status-dot--inactive]="row.is_active !== 1"
    [title]="row.is_active === 1 ? 'Active' : 'Inactive'"
  ></span>

  <!-- title (reserve right padding so it never runs under the dot) -->
  <h6 class="list-item-title mb-0 text-truncate" style="padding-right: 16px">{{ row.code }}</h6>

  <!-- muted sub-line -->
  <p class="list-item-subtitle mb-0 text-truncate">{{ row.name }}</p>

  <!-- meta: icon+label chips and/or a type tag and/or a strong value -->
  <div class="list-item-meta">
    <span class="list-item-chip"><mat-icon>apartment</mat-icon><span>{{ row.group }}</span></span>
    <span class="list-item-tag list-item-tag--primary">System</span>
    <span class="list-item-value">15%</span>
  </div>
</button>

@if (model.filtered().length === 0) {
  <div class="list-empty-state">
    <mat-icon>inbox</mat-icon>
    <p>No records found</p>
  </div>
}
```

**Global class vocabulary** (all in `_form-page.scss`):

| Class | Use |
|-------|-----|
| `.status-dot.status-dot--corner` + `--active` / `--inactive` | Active/inactive status light, top-right |
| `.list-item-title` | Bold primary line (`text-truncate` for long values) |
| `.list-item-subtitle` | Muted second line |
| `.list-item-id` | Muted business id shown INLINE next to the title (e.g. name · EMP-1001) |
| `.list-item-meta` | Flex-wrap row holding the chips / tags / value |
| `.list-item-chip` | `<mat-icon>` + inner `<span>` label (the span truncates) |
| `.list-item-tag` (+ `--primary` / `--warning`) | Type/category pill (NOT status) |
| `.list-item-value` | Strong right-aligned value (e.g. a percentage) |
| `.list-empty-state` | Centered empty state (icon + text) |

**Rules:**
- Active/inactive → **dot**, never a text badge. Type labels → `.list-item-tag`.
- The `[sidebarList]` wrapper is a flex column (gap handled globally) — do NOT add `p-3`,
  `mb-1`, dividers, or `border` to the items; the global `.list-group-item` owns
  rounded rows, hover, and the active accent bar.
- Inline a business id next to the title with `.list-item-id` only when it reads as
  one unit (e.g. user name + employee code). Otherwise use the subtitle.
- Reference forms: SYS1002 (Branch), SYS1004 (Currency), SYS1005 (Tax),
  SYS1101 (User), SYS1102 (Role).

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
  <label class="field-label">Field Name</label>
  <div class="custom--checkbox">
    <mat-checkbox formControlName="some_flag" color="primary">
      <span class="field-label mb-0" style="cursor: pointer">Affirmative</span>
    </mat-checkbox>
  </div>
</div>
```

- Always `color="primary"`.
- **Every checkbox field carries a top `<label class="field-label">` (the field
  name) just like every other input field** — so the control lines up with the
  rest of the form grid. The inner `<span class="field-label mb-0">` is a SHORT
  affirmative state that complements (never duplicates) the top label.
  - ✅ top `Account Lock` + inner `Locked`; top `Status` + inner `Active`;
    top `Base Currency` + inner `Set as base currency`.
  - ❌ top `Account Lock` + inner `Account is locked` (redundant — both say the
    same thing).
- Bind with `formControlName` for flags saved with the form; use `[checked]`
  plus `(change)` for a checkbox that fires an immediate action.
- Reference forms: `SYS1002` (`is_main_branch`), `SYS1004` (`is_base_currency`),
  `SYS1005` / `SYS1007` (`is_active`), `SYS1101` (account lock).

### Select Options & Enums — centralize in `{module}.constants.ts` (NO inline option arrays) (CRITICAL)

**Never hard-code a `select` / `ng-select` option list inside a component.** Every
enum / status / type / category dropdown is defined ONCE in the module's constants
file and imported into forms. Inline arrays (`statusOptions = [{ value: 1, label: 'Draft' }, …]`
scattered across components) drift, duplicate, and are the opposite of a single source of truth.

**Where:** `features/{module}/constants/{module}.constants.ts` — one exported object per
module (`sysConstants`, `hrmConstants`, `invConstants`, `finConstants`, …) holding named
`SelectOption[]` lists. Truly cross-module enums (yes/no, active/inactive) go in
`core/constants/global.constants.ts`. Shape (already in `features/sys/constants/sys.constants.ts`):

```ts
export interface SelectOption { label: string; value: unknown; }
export const hrmConstants = {
  movementTypes:    [ { value: 1, label: 'Promotion' }, { value: 2, label: 'Transfer' }, { value: 3, label: 'Demotion' } ],
  movementStatuses: [ { value: 1, label: 'Draft' }, { value: 2, label: 'Submitted' }, { value: 3, label: 'Approved' }, { value: 4, label: 'Cancelled' } ],
  genderList:       [ { value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' } ],
  approvalStatus:   [ { value: 'A', label: 'Approved' }, { value: 'W', label: 'Waiting' }, { value: 'R', label: 'Rejected' }, { value: 'P', label: 'Processing' } ],
};
```

**The value contract — DB-first (CRITICAL):** the option `value` MUST be exactly what
the backend persists for that column, so it binds straight to the reactive control and
posts back with **zero mapping**.
- **Number** for `SMALLINT` enum columns — the majority of this codebase (status, type,
  movement_type, separation_type, loan_type, run_type…). Use `1, 2, 3…` matching the
  backend's `CHECK (col IN (…))` codes.
- **Single-char** only where the column actually stores a char code — e.g. `genderList`
  (`'M'/'F'/'O'`), an `approvalStatus` (`'A'` approved · `'W'` waiting · `'R'` rejected ·
  `'P'` processing). Match the stored char exactly (case included).
- **Never** invent a UI-only value and translate it before saving. If unsure of a column's
  type, check the entity (`Short` ⇒ number, `String`/`CHAR` ⇒ char) — round-tripping is the
  whole point.

**Use it in a form** (no local arrays, no magic numbers in the template):

```ts
import { hrmConstants } from '../../constants/hrm.constants';
// component
readonly movementTypes = hrmConstants.movementTypes;
readonly statusOptions = hrmConstants.movementStatuses;
// label from value (don't re-type status strings): a shared helper, not a per-form switch
statusLabel = (v: unknown) => this.statusOptions.find(o => o.value === v)?.label ?? String(v ?? '');
```

```html
<ng-select formControlName="movement_type" [items]="movementTypes" bindValue="value" bindLabel="label" />
<!-- or -->
@for (o of statusOptions; track o.value) { <ng-option [value]="o.value">{{ o.label }}</ng-option> }
```

**Rules:**
- Status pills/labels resolve via the constant list (`statusLabel(v)`), never a duplicated inline map.
- When you touch a form that still hard-codes options, **migrate them** into the module constants file.
- Lookups loaded from the API (employees, branches, accounts) stay in `CommonDataService` /
  the form's model — the constants file is for **static enums**, not server data.
- Reference: `features/sys/constants/sys.constants.ts` (`sysConstants.taxTypes`/`currencies`/`months` = numeric; `countries`/`dateFormats` = char codes).

### Content Area Height — fill 100%, NEVER viewport math (CRITICAL)

`app-page-form-layout` already gives `[formContent]` a **flex-filled column** of the
correct height (`page-card-body.flex-grow-1` inside an `h-100` column). So content
must fill that space with **flex/`height:100%`**, not by guessing the viewport.

- ❌ **NEVER** size a content card or scroll area with `calc(100vh - 320px)`,
  `min-height`, or any hard-coded viewport math — it desyncs from the real layout
  (header/footer/padding/embedding) and looks wrong next to other forms.
- ✅ When a form should fill the height (a tall table/grid), make the `[formContent]`
  wrapper a flex column and let the inner scroll area fill:

```html
<div formContent class="h-100 d-flex flex-column">
  <!-- fixed bits (header, hint) → flex-shrink:0 -->
  <!-- the scrolling area → flex:1; min-height:0; overflow:auto -->
</div>
```

```scss
:host { height: 100%; }
.fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.scroll-area { flex: 1 1 auto; min-height: 0; overflow: auto; }   /* no max-height */
```

- `min-height: 0` on every flex child is required, or the child grows to its content
  instead of scrolling.
- With `<app-common-table>`, pass `maxHeight: '100%'` in its config and let the host
  flex-fill (see SYS1104). Forms whose content is naturally short don't need this —
  just don't impose a viewport-based height.
- Reference forms: `SYS1103` (matrix), `SYS1104` (common-table grid).

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

**Fixed table rule (frontend + backend):** every tabular data list in a form MUST render
with `<app-common-table>`; do not hand-roll `<table>`, `mat-table`, or Bootstrap table
markup. The backing form API must return DTO fields whose snake_case names match the
`ColumnDef.field` values exactly, so search, sort, export, and custom-template `value`
accessors all work from the same data contract.

**Required table design rule (CRITICAL):** whenever any form needs a table, use the
same common-table structure and visual behavior as **SYS1003 Financial Year Setup â†’
Accounting Periods**. This is the reference table for the whole ERP. The common table
owns the search/export/column controls, header styling, row dividers, pagination/footer
colors, and sticky bottom total row. Do not create a form-specific table design.

**Visual structure rule (CRITICAL):** the common table must look and sit like
**SYS1003 Accounting Periods**. That means:
- table section = outer `.form-section-card.card` with its own `.card-header`;
- table body = `.card-body.p-0`;
- only child inside the body = `<app-common-table ...>`;
- header row and footer/paginator colors come from the shared table tokens, not
  per-form CSS;
- search/export toolbar stays inside `<app-common-table>`, not in the parent card.
- column totals use the built-in pinned footer row by setting `bottomTotal: true`
  on the numeric `ColumnDef`; do not build a separate totals bar under the table.
- the pinned footer row is generic: use `footerLabel: 'Total'` to show text under
  any column, `bottomTotal: true` to sum a numeric column, and `footerValue:
  (rows) => ...` when the footer value is computed from the visible rows. Never
  place grid totals in a card header or form-specific footer outside the table.

Exchange-rate grids (**SYS1006**) and all future rate/period/line-item grids must
use this same Accounting Periods structure exactly.

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
- **`custom-template` (and any column whose display ≠ `row[field]`) MUST set a `value`
  accessor** — `value: (row) => <label>` — so **search, sort, and export use the text the
  user sees**, not the raw id. Without it, searching a `custom-template` column of ids is
  useless and exports dump numbers. Example (SYS1104):
  ```ts
  { title: 'Branch', field: 'branch_no', cellType: 'custom-template',
    customTemplate: this.branchTpl(), value: (r) => this.branchLabel(r['branch_no']) }
  ```
  The table resolves `value` centrally for the search box, `sortingDataAccessor`, and all
  export formats — no per-form filtering hacks.
- **Status columns** → `cellType: 'badge'` with the shared `statusBadge` mapper, so every
  form renders the same pill:
  ```ts
  import { statusBadge } from '@app/shared/components/common-table';
  { title: 'Status', field: 'status', cellType: 'badge', badgeConfig: statusBadge }
  ```
  It maps active flags (`1`/`0`) and common statuses (pending/posted/confirmed/…) to colored pills.
- Row actions render as a single kebab (`⋯`) menu (config `actions: [...]`), not inline
  icon buttons. Editable cells use `ng-select` (not native `<select>`) on double-click.
- See `shared/components/common-table/example-usage.ts` for full feature demos.

### PDF Reports — `PdfTemplateService` (CRITICAL)

**Never manually create a jsPDF document or draw headers/footers in your component.** Every PDF export MUST use the shared `PdfTemplateService` to ensure a consistent company header, page footer, and signature block across the entire ERP.

**How to use:**
1. Inject `PdfTemplateService` from `shared/pdf-templates/pdf-template.service`.
2. Call `pdfTemplateService.render()` with a `PdfTemplate` configuration.

Example:

```ts
import { PdfTemplateService } from '@app/shared/pdf-templates/pdf-template.service';

private readonly pdfTemplateService = inject(PdfTemplateService);

async exportToPdf() {
  await this.pdfTemplateService.render({
    id: 'my-custom-report',
    module: 'SYS',
    formId: 'SYS1001',
    title: 'Report Title',
    fileName: 'report-file-name',
    showSignatures: true,
    showPageFooter: true,
    buildSections: () => [
      { type: 'title', text: 'Data List' },
      { type: 'table', columns: this.columns, rows: this.data }
    ]
  }, {});
}
```

If your PDF requires a heavily custom-drawn layout, use a `custom` section type, which gives you access to the `jsPDF` instance and `helpers` (`{ drawHeader, drawPageFooter }`) for adding headers/footers on new pages.
```

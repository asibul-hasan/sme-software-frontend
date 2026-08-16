# CLAUDE.md — Aidly ERP Frontend

Angular frontend for Aidly ERP, organized as an Nx workspace.

- **App:** `apps/web-client`
- **Feature forms:** `apps/web-client/src/app/features/{module}/forms/{formId}`
- **Shared code:** `apps/web-client/src/app/shared` (components, pipes, directives)
- **Global styles:** `apps/web-client/src/assets/styles` (`_form-page.scss`, `styles.scss`)
- **Build:** `npx nx build web-client` | **Serve:** `npx nx serve web-client`

Broader architecture & business docs live in `../aidly-business-doc/frontend/` (e.g. `FRONTEND_ARCHITECTURE.md`, `*-forms-design.md`). DB schema design, migrations and backend design docs live in `../aidly-business-doc/backend/` (incl. `db-migration/`).

---

## Tailwind Migration Rule (CRITICAL)

This project is created using Tailwind CSS. Whenever you work on any form, first migrate the form's Bootstrap classes to Tailwind CSS before adding new styling or making layout changes.

- Prefer Tailwind utility classes over Bootstrap classes.
- If a form still uses Bootstrap styling, update that form to Tailwind as part of the current task.
- Do not introduce new Bootstrap-based styling in forms.

---

## Master Form Action Rule (CRITICAL)

For any master form action such as save, delete, or reset (excluding grid-based forms), perform the action only after validation is checked and use the shared AlertService confirmation flow for destructive or confirmatory actions.

- Use `AlertService` for confirmation prompts on master save/delete actions.
- Keep the Save, New, Delete, and Reset buttons visible on master forms.
- If a button is not currently applicable, disable it instead of hiding it.
- Do not hide action buttons just because the form is empty or validation is incomplete.

## Action Result Handling Rule (CRITICAL)

For every save/delete/action API call, handle success and error explicitly:

- Show a toaster message for every action result.
- For success, use the backend message when available, otherwise fall back to a meaningful hardcoded message such as `result.body.message || 'Save successful'`.
- For error, show the error message from the response and do not call any success-side master refresh logic.
- Backend success status codes are `200`, `201`, `202`, etc. Treat those as success and proceed with the success flow.
- After a successful save or delete, always reselect the relevant node/item in the master list so the selected row stays valid and visible.
- For grid data actions, after a successful save/delete, also select the affected row when appropriate so the selection remains true and visible.
- On error, do not trigger any master refresh, selection change, or success callback flow.

```typescript
// ✅ CORRECT
const success = response.status === 200;
if (success) {
  this.toaster.success(result.body?.message || 'Save successful');
  this.loadItems(selectedNo);
} else {
  this.toaster.error(result.body?.message || 'Action failed');
}
```

---

## Alerts, Toasts & Loader (CRITICAL)

This app has ONE way to do each: `AlertService` for blocking confirmations/alerts,
`ToastrService` (ngx-toastr) for non-blocking result banners, and `LoaderService`
(auto-driven by `loaderInterceptor`) for the full-screen spinner. Do NOT hand-roll
modal overlays, `window.confirm()`, `alert()`, or per-form spinner markup.

**Stack — all Tailwind, no Bootstrap:**

- `AlertService` → opens the shared **`ConfirmDialogComponent`** (Tailwind card) via
  MatDialog. Returns `Observable<boolean>` (`true` = confirmed / OK, `false` = cancelled).
- `GlobalLoaderComponent` (`<app-global-loader>`) → rendered ONCE in
  `main-layout.component.html`, bound to `LoaderService.isLoading()` (signal). Every
  HTTP call drives it through `loaderInterceptor` unless the request opts out with
  `SKIP_LOADER`. `LoaderComponent` still exists but is **not rendered** — it watched
  the same signal, so both fired on every request and its white ring on a dark
  overlay covered the global loader. Do not re-add it to `app.component.html`.
- `ToastrService` → provided in `app.config.ts` (`positionClass: 'toast-bottom-right'`,
  `preventDuplicates: true`). Every save/delete/action result MUST fire a toast (see
  "Action Result Handling Rule" above).

**Z-index hierarchy (single source of truth in `styles.scss` — do not override
in a form):**

| Layer                                    | z-index         |
| ---------------------------------------- | --------------- |
| MatDialog / CDK overlay (default)        | ~1050           |
| Alert dialog (`.alert-dialog-panel`)     | 99999           |
| Full-screen loader (`.loader-overlay`)   | 99999           |
| Toasts (`.toast-container`)              | 999999999       |

Toasts sit above **everything** and the container is `pointer-events: none` so
they never block clicks on the underlying UI (individual toasts re-enable pointer
events for their own buttons). Alert dialogs are boosted above other open
MatDialogs so an alert opened from within a modal still floats on top.

### `AlertService` — confirmation & alerts

Import from `core/services/alert.service`. All methods return `Observable<boolean>`.

```ts
import { AlertService } from '@app/core/services/alert.service';
private alertService = inject(AlertService);

// Confirmation (Yes/No)
this.alertService.confirm('Submit this voucher for approval?')
  .subscribe(ok => ok && this.submit());

// Destructive confirmation — red icon + red confirm button + "Delete" label
this.alertService.deleteConfirm()
  .subscribe(ok => ok && this.remove());

// Single-button alerts (OK-only)
this.alertService.success('Invoice saved successfully.');
this.alertService.danger('Save failed — please check the highlighted fields.');
this.alertService.warning('Selected period is closed.');
this.alertService.info('This action requires an active fiscal year.', { title: 'Heads up' });

// Full escape hatch — pass a complete ConfirmDialogData
this.alertService.create({
  title: 'Post to ledger',
  message: 'This will finalise the voucher and cannot be undone.',
  type: 'warn',
  confirmText: 'Post',
  showCancel: true,
});
```

**Rules:**

- **Never** call `window.confirm()`, `alert()`, or open a bespoke modal for a
  confirmation. Always route through `AlertService`.
- **Never** hand-roll a `<div class="modal fade show...">` overlay controlled by a
  boolean signal. For a full custom dialog use `DialogService.open(Component, ...)`
  (see the Modals & Dialogs section below).
- `<app-action-button>` already confirms destructive/consequential actions
  automatically via `AlertService` — do NOT wrap `.confirm()` around a
  `(run)` handler that came from `<app-action-button kind="delete">`.
- The dialog is opened with `disableClose: true` — the user must click a button
  or the top-right close (which resolves to `false`).

### `LoaderService` — global spinner

Import from `core/services/loader.service`. It exposes a signal, not an observable.

```ts
import { LoaderService } from '@app/core/services/loader.service';
private loader = inject(LoaderService);

// Manual (rare — only when you're not going through HttpClient)
this.loader.show();
try { await heavyWork(); } finally { this.loader.hide(); }
```

**Rules:**

- The `loaderInterceptor` calls `show/hide` for every HTTP request. Do NOT wrap a
  normal `this.http.get(...)` in manual `show/hide` — it will double-count and the
  overlay will linger.
- To make a request **silent** (background polling, autocomplete, notification
  bell), opt out with the `SKIP_LOADER` context token:

  ```ts
  import { HttpContext } from '@angular/common/http';
  import { SKIP_LOADER } from '@app/core/interceptors/loader.interceptor';

  this.http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) });
  ```

- `LoaderService.show()` uses reference counting, so overlapping HTTP calls don't
  flicker the spinner off early. Never reset the counter manually inside a form.

### `ToastrService` — result banners

Injected everywhere as `private toastr = inject(ToastrService)` (some legacy files
call it `toaster`). Backed by `ngx-toastr`, styled globally.

```ts
this.toastr.success(res.body?.message || 'Save successful');
this.toastr.error(err?.error?.message || 'Save failed');
this.toastr.warning('Nothing to submit.');
this.toastr.info('Loading latest exchange rates…');
```

**Rules:**

- Every save/delete/action result MUST fire a toast — success or error (see the
  Action Result Handling Rule above).
- Prefer the backend message; fall back to a meaningful hardcoded string.
- Do NOT use toasts for confirmations — they are non-blocking and can be missed.
  Use `AlertService.confirm()` when the user must decide before the flow continues.
- Never override the toast position or z-index in a form; the global config in
  `app.config.ts` + `styles.scss` is the single source of truth.

**Reference implementations:** any `fin1001/1002/1003` model service shows the
toast + `AlertService` flow; `LoaderComponent` is wired in `app.component.html`;
the interceptor lives at `core/interceptors/loader.interceptor.ts`.

---

## Post-Save Selection Rule (CRITICAL)

After every save in a master-detail form with a sidebar list:

| Action                     | What to select after reload                                                   |
| -------------------------- | ----------------------------------------------------------------------------- |
| **Create new record**      | The newly created record — pass its PK (from `res.data`) to the reload method |
| **Update existing record** | Keep the current selection — pass `selectedXxxNo()` to the reload method      |
| **Delete record**          | Clear the form / select nothing — pass `null`                                 |

```typescript
// ✅ CORRECT
const savedNo = isUpdate
  ? this.selectedItemNo() // update → keep selection
  : (res.data?.item_no ?? null); // create → select new record by PK from response
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

Apply this rule to every `filteredXxx = computed(...)` signal that feeds a sidebar list or a `@for` loop in `sidebarList`. Backend APIs already return rows ascending by PK; the sort is applied on the frontend computed signal, not in the HTTP call.

---

## Shared UI Patterns

App-wide conventions. Reuse these instead of `mat-tab-group`, a raw
`mat-checkbox`, or ad-hoc markup so every form stays visually consistent.

### Form building blocks — `shared/components/form-ui` (CRITICAL, the standard)

**Forms ship ZERO css** (only the `:host { display:block; height:100% }` inline
block). Form bodies are built from these SharedModule components — do NOT
hand-roll `.row/.col-md-*` grids, `.field-group` wrappers, or `.custom--checkbox`
markup in new/touched forms. Reference implementation: **FIN_1001** (Chart of
Accounts). Full standard: `../aidly-business-doc/form-design-standard.md`.

```html
<app-form-section title="Account" icon="menu_book">
  <!-- card + 12-col grid body -->
  <app-form-field label="Account Code" for="account_code" required [span]="3">
    <input id="account_code" formControlName="account_code" class="form-control" />
  </app-form-field>
  <app-check-field label="Status" text="Active" [span]="2" formControlName="is_active" />
</app-form-section>
```

- `[span]` = grid columns of 12 from the `md` breakpoint (replaces `col-md-*`);
  spans on one visual row sum to 12. Optional `[xlSpan]` refines at `xl`.
- `<app-check-field>` is a CVA that round-trips the numeric `1/0` flag contract —
  bind it with `formControlName`, never `[checked]`/`(change)`.
- `<app-form-section flush>` gives a `p-0` body for `<app-erp-grid>` grids.
- Validation messages render automatically under any projected `formControlName`
  control (`ValidationMessageDirective`) — don't add per-form error markup.
- Tailwind utilities are layered; legacy global SCSS is unlayered and wins ties.
  If a utility must beat a global class on the same element, use the `!` form
  (`!p-2`, `!text-indigo`) — never a per-form stylesheet.

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
<div sidebarList>@for (row of model.pager.paged(); track row.id) { … }</div>
<app-sidebar-pagination sidebarFooter [pager]="model.pager" />
```

**Sort toggle (asc/desc).** The layout shows the sort button by default
(`showSort=true`), but it only _works_ when wired. The standard way: give the
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
**`<app-erp-grid>`**, which owns its own search / pagination / export / column
toggle / totals. Use it for the grid, NOT for the master record selector. A grid form
may have `[hasSidebar]="false"`. If the grid requires a top-level global filter, place
it in a separate "Filter Card" (`.form-section-card.card`) directly above the table
card, exactly like `SYS1108` or `FIN_1006`.

Reference form: **SYS1108** (Approval Workflow Setup) — the canonical grid form; see
the AG Grid section. **FIN_1006** (GL Account Mapping) shows a standalone grid with a
top-level filter card.
Any form that shows an editable/supporting grid must copy that pattern: an outer
`.form-section-card` section, a normal card header/title/action row, a zero-padding
`.card-body p-0`, and one `<app-erp-grid>` filling that body. Do not invent a different
table wrapper, split-table layout, Bootstrap table, or custom `mat-table`.

**Why two styles exist:** master-detail (browse many records, edit one) and
data-grid (operate on rows in place) are genuinely different jobs. The mistake is
_within_ an archetype — paginating one sidebar but not another, or hand-rolling a
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
<button type="button" class="list-group-item list-group-item-action" [class.active]="model.selectedNo() === row.id" (click)="model.select(row)">
  <!-- status light, top-right corner -->
  <span class="status-dot status-dot--corner" [class.status-dot--active]="row.is_active === 1" [class.status-dot--inactive]="row.is_active !== 1" [title]="row.is_active === 1 ? 'Active' : 'Inactive'"></span>

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

| Class                                                        | Use                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `.status-dot.status-dot--corner` + `--active` / `--inactive` | Active/inactive status light, top-right                                 |
| `.list-item-title`                                           | Bold primary line (`text-truncate` for long values)                     |
| `.list-item-subtitle`                                        | Muted second line                                                       |
| `.list-item-id`                                              | Muted business id shown INLINE next to the title (e.g. name · EMP-1001) |
| `.list-item-meta`                                            | Flex-wrap row holding the chips / tags / value                          |
| `.list-item-chip`                                            | `<mat-icon>` + inner `<span>` label (the span truncates)                |
| `.list-item-tag` (+ `--primary` / `--warning`)               | Type/category pill (NOT status)                                         |
| `.list-item-value`                                           | Strong right-aligned value (e.g. a percentage)                          |
| `.list-empty-state`                                          | Centered empty state (icon + text)                                      |

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
  <button type="button" class="form-tab-btn" [class.active]="activeTab() === 'first'" (click)="activeTab.set('first')">
    <mat-icon class="tab-icon">icon_name</mat-icon>
    First Tab
  </button>
  <button type="button" class="form-tab-btn" [class.active]="activeTab() === 'second'" (click)="activeTab.set('second')">
    <mat-icon class="tab-icon">icon_name</mat-icon>
    Second Tab
  </button>
</div>

@if (activeTab() === 'first') {
<!-- first panel -->
} @if (activeTab() === 'second') {
<!-- second panel -->
}
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

### Modals & Dialogs — `DialogService` (CRITICAL)

**Never hand-roll HTML modal overlays** (`<div class="modal fade show d-block"...>`) inside a parent component template controlled by a boolean signal (`showModal()`).
Always use central **`DialogService`** (`core/services/dialog.service`) to open modals/dialogs as standalone components. Reference implementation: **`HRM_1321`** (`LeaveHistoryDialogComponent` in `features/hrm/forms/hrm1321/components/leave-history-dialog/`).

**1. Opening a Dialog from Parent Component (`.ts`):**

```ts
import { DialogService } from '../../../../core/services/dialog.service';
import { LeaveHistoryDialogComponent } from './components/leave-history-dialog/leave-history-dialog.component';

private dialogService = inject(DialogService);

openHistoryModal(): void {
  this.dialogService.open(LeaveHistoryDialogComponent, {
    size: 'xl', // 'sm' (400px) | 'md' (650px) | 'lg' (900px) | 'xl' (1200px) | custom string
    data: {
      employeeNo: this.empNo(),
      leaveTypes: this.leaveTypes(),
    },
  }).subscribe((res) => {
    // Handle dialog close result if applicable
  });
}
```

**2. Dialog Component Class (`.ts`):**
Inject `MatDialogRef` for closing and `MAT_DIALOG_DATA` for receiving payload data:

```ts
import { Component, inject, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MyDialogData {
  employeeNo?: number;
}

@Component({
  selector: 'app-my-dialog',
  templateUrl: './my-dialog.component.html',
})
export class MyDialogComponent {
  private dialogRef = inject(MatDialogRef<MyDialogComponent>);
  @Optional() @Inject(MAT_DIALOG_DATA) public data?: MyDialogData;

  close(): void {
    this.dialogRef.close();
  }
}
```

**3. Dialog Component Template (`.html`):**
Do NOT include `<div class="modal fade...">` or `<div class="modal-dialog">` or `<div class="modal-content">`. The `MatDialog` container automatically supplies the overlay, backdrop, centering, and dialog wrapper. Start directly with the card container:

```html
<div class="form-section-card card shadow-lg border-0 m-0 overflow-hidden">
  <!-- Dialog Header -->
  <div class="modal-header card-header d-flex justify-content-between align-items-center py-2.5 px-4 bg-surface border-bottom">
    <h4 class="card-header__title mb-0 fw-bold d-flex align-items-center gap-2 text-content">
      <mat-icon class="text-primary">history</mat-icon>
      Dialog Title
    </h4>
    <button type="button" class="btn-close" aria-label="Close" (click)="close()"></button>
  </div>

  <!-- Dialog Body -->
  <div class="modal-body p-4 bg-body overflow-y-auto" style="max-height: 78vh;">
    <!-- Modal content goes here -->
  </div>

  <!-- Dialog Footer -->
  <div class="modal-footer py-2.5 px-4 border-top bg-surface d-flex justify-content-end">
    <button type="button" class="btn btn-sm btn-outline-secondary" (click)="close()">Close</button>
  </div>
</div>
```

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

### GL Account Selection Format (CRITICAL)

Whenever a form contains a dropdown, search box, or table column that displays a GL Account, the display format MUST be exactly `Code Name` (e.g. `1010 Cash in Hand`).

- Do **NOT** use hyphens, dashes, or parentheses (e.g. ❌ `1010 - Cash`, ❌ `Cash (1010)`).
- For `ng-select` components, use `<ng-template ng-label-tmp>` and `<ng-template ng-option-tmp>` to enforce this format consistently:
  ```html
  <ng-select id="account_no" formControlName="account_no" bindValue="account_no" [items]="accounts">
    <ng-template ng-label-tmp let-item="item">{{ item.account_code }} {{ item.account_name }}</ng-template>
    <ng-template ng-option-tmp let-item="item">{{ item.account_code }} {{ item.account_name }}</ng-template>
  </ng-select>
  ```
- For `GridColumns.select` / `GridColumns.lookup` columns, ensure the `label` property of your `GridLookupOption` matches this exact format:
  ```ts
  accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.account_code} ${a.account_name}`,
      value: a.account_no,
    })),
  );
  ```

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
export interface SelectOption {
  label: string;
  value: unknown;
}
export const hrmConstants = {
  movementTypes: [
    { value: 1, label: 'Promotion' },
    { value: 2, label: 'Transfer' },
    { value: 3, label: 'Demotion' },
  ],
  movementStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'Cancelled' },
  ],
  genderList: [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
  ],
  approvalStatus: [
    { value: 'A', label: 'Approved' },
    { value: 'W', label: 'Waiting' },
    { value: 'R', label: 'Rejected' },
    { value: 'P', label: 'Processing' },
  ],
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
:host {
  height: 100%;
}
.fill-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fill-card > .card-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.scroll-area {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
} /* no max-height */
```

- `min-height: 0` on every flex child is required, or the child grows to its content
  instead of scrolling.
- With `<app-erp-grid>`, pass `height="100%"` and let the host flex-fill (see SYS1104).
  Forms whose content is naturally short don't need this — just don't impose a
  viewport-based height.
- Reference forms: `SYS1103` (matrix), `SYS1104` (`<app-erp-grid>` filling a card).

### Card-to-Card Gap — `.form-section-card`

Cards within a form column stack vertically. The spacing system is:

| Layer                        | Value      | Source                                                        |
| ---------------------------- | ---------- | ------------------------------------------------------------- |
| Between cards in same column | `4px`      | `.form-section-card { margin-bottom: 4px }`                   |
| Between rows (`row-group`)   | `8px`      | `.row-group { --bs-gutter-y: 0.5rem }`                        |
| Page card body children gap  | `4px`      | `.page-card-body { gap: 4px }`                                |
| Card header padding          | `8px 12px` | `.form-section-card .card-header { padding: 0.5rem 0.75rem }` |
| Card body padding            | `8px 12px` | `.form-section-card .card-body { padding: 0.5rem 0.75rem }`   |
| Field group gap              | `5px`      | `.field-group { gap: 5px }`                                   |

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

### Tables — use AG Grid, not `<app-common-table>` (LEGACY)

**AG Grid `<app-erp-grid>` is THE table for this app.** Every tabular data list — new
or rewritten — renders with it. See the AG Grid section below for the full contract.

`<app-common-table>` (`shared/components/common-table`) is **legacy**. It still exists
and ~44 form templates still render it, so you will meet it when opening an older form,
but:

- **Do NOT use it in new forms**, and do not add features to it.
- When you substantially rework a form that uses it, **migrate that form to
  `<app-erp-grid>`** rather than patching the old table.
- Do **not** delete the folder: `<app-erp-grid>` imports `TableExportService` from it,
  so export behaviour is shared. (Status pills are not — AG Grid has its own
  `GridColumns.status`.)

Never hand-roll `<table>`, `mat-table`, or Bootstrap table markup in either case.

### AG Grid — `<app-erp-grid>` (THE grid, `shared/ag-grid`)

AG Grid (Community 36, MIT) is registered app-wide by `provideErpGrid()` in
`app.config.ts`. The framework lives in `shared/ag-grid`.

**Reference implementation: `SYS1108` Approval Workflow Setup** — three chained
grids, per-selection API loading, filters, permissions, totals. Copy it. A simpler
single-grid example is `SYS1104`.

> **Which component:** use **`<app-erp-grid>`**. A `<app-grid>` / `GridBuilder` pair
> also exists in the folder but **no form uses it**, and it lacks most of what is
> documented here (external row state, controlled selection, permissions, totals,
> pagination). Do not start new work on it.

A grid is a `GridConfig` object plus `[data]`. Toolbar, search, column chooser,
export, pagination, totals, layout persistence and density come from the framework.

```html
<div class="card-body p-0">
  <app-erp-grid [config]="stepGrid" [data]="steps()" [selectedId]="model.selectedStepUid()" (ready)="onStepGridReady($event)" (rowClick)="onStepRowClick($event)" (rowChange)="onStepChange($event)" (rowRemove)="onStepRemove($event)" (addRow)="addStepRow()"></app-erp-grid>
</div>
```

```ts
readonly stepGrid: GridConfig<ApprovalStep> = {
  gridKey: 'SYS_1108_STEP_GRID',          // {MODULE}_{FORM}_{ENTITY}_GRID — permanent
  rowIdField: '__uid',
  height: '150px',
  selectionMode: 'single',
  autoSelectFirstRow: true,
  externalRowState: true,                 // the FORM owns the rows (see below)
  showPagination: true,
  pageSize: 50,
  pageSizeOptions: [25, 50, 100, 500],
  // a child grid also requires a selected parent, or Add creates an orphan
  canAdd:       () => this.permissionService.canInsert() && this.model.selectedScopeUid() !== null,
  canEdit:      () => this.permissionService.canUpdate(),
  canDeleteRow: (row) => this.canDeleteStep(row),
  toolbar: {
    title: 'Approval Steps', showAdd: true, showDelete: false, showSearch: true,
    showExport: true, showColumnChooser: true, searchPlaceholder: 'Search steps...',
  },
  columns: [
    GridColumns.number<ApprovalStep>('step_number', 'Step No').width(90).build(),
    GridColumns.select<ApprovalStep>('step_type', 'Step Type',
        sysConstants.approvalStepTypes as GridLookupOption[]).width(140).build(),
    GridColumns.text<ApprovalStep>('step_name', 'Step Name').flex(1).minWidth(140).build(),
    GridColumns.action<ApprovalStep>().build(),
  ],
};
```

**Build the config ONCE into a `readonly` field, in the `.ts`.** It is static; rows
flow separately through `[data]`, so refreshing a list never rebuilds columns or
loses the user's saved layout. Building it in the template re-evaluates it on every
change-detection pass.

**The Grid ID is mandatory and permanent.** Column widths, order, visibility and sort
persist under `gridKey`. Renaming it silently discards every user's layout.

#### Who owns the rows — pick one

|              | Grid-owned (default)                              | Form-owned (`externalRowState: true`)                           |
| ------------ | ------------------------------------------------- | --------------------------------------------------------------- |
| Rows live in | the grid's `GridApiService`                       | your model service                                              |
| Add / delete | grid mutates its own list                         | grid **emits**, you apply                                       |
| Saving       | `getDirtyRows()` → `{inserted, updated, deleted}` | your own payload                                                |
| Use when     | one self-contained grid                           | chained grids, or rows shared with anything the grid cannot see |

**`externalRowState` is required whenever a grid shows a _slice_ of a bigger list.**
In SYS1108 the model holds every step and approver; changing workflow replaces the
child grid's `[data]`, and grid-owned state would be thrown away with it. With it on,
the grid reports intent and your model stays authoritative:

```ts
onStepChange(row: ApprovalStep) { this.model.updateStep(row.__uid, row); }   // (rowChange)
onStepRemove(row: ApprovalStep) { this.model.removeStep(row.__uid); }        // (rowRemove)
addStepRow()                    { this.model.addStepRow(); }                 // (addRow)
```

Outputs always hand you the **domain row** (your object, original id type), never the
grid's internal row. `(ready)` hands you the `GridApiService` — keep it only if you need
imperative access (refresh, dirty rows); selection and data do not require it.

#### Columns

`GridColumns.text` · `number` · `decimal` · `currency` · `date` · `select` · `lookup` ·
`checkbox` · `status` · `action`. Chain modifiers, finish with `.build()`.

- `field` matches the backend DTO (snake_case) — search, sort, export and editing all key off it.
- Numeric columns right-align automatically. **Never hard-code precision.**
- **`select` / `lookup` display the option `label` and store the option `value`** — the
  code the backend persists. Static enums come from the module constants file;
  server-loaded lookups are passed as a **function** so they stay reactive as they load,
  without rebuilding columns:
  ```ts
  GridColumns.lookup<ApprovalScope>('branch_no', 'Branch', () => this.opts(this.model.branchOptions()))
    .flex(1)
    .build();
  ```
- Any _other_ column whose display differs from `row[field]` must set
  `.valueFormatter(...)`, so search, sort and export use the text on screen.
- `.sum()` / `.footer('Total')` / `.footerValue(rows => ...)` drive the pinned totals
  row, which reflects the **current filter**, not the raw input.
- `GridColumns.action()` gives the pinned right delete column.

#### Selection and editing

Single click **selects**; double click **edits the whole row** (`editType: 'fullRow'`).
Several forms drive a child grid off the selected parent row, so selection must not
require hitting a checkbox — `selectionMode: 'single'` therefore renders **no** checkbox
column.

- `autoSelectFirstRow: true` keeps a row selected and emits `(rowClick)`, so the child
  grid loads instead of sitting empty.
- **`[selectedId]` makes selection controlled.** Bind it whenever the form decides what
  is current — e.g. restoring the edited row after save. Without it the auto-select
  fights the form and bounces the user back to row 1.
- Add Row appends and immediately opens the new row for editing, seeded from
  `newRowDefaults`.
- A derived column must not be editable — letting a user type a value the next
  recalculation overwrites is a data-integrity bug.
- **The grid never calls an API.** It records intent; saving stays the form's job.

#### Permissions — always wire them

Pass **functions**, not booleans: permissions resolve after the config is built
(`useLocalPermissions()` runs in `ngOnInit`), so a captured boolean freezes the
pre-load value.

```ts
canAdd:       () => this.permissionService.canInsert(),
canEdit:      () => this.permissionService.canUpdate(),   // ANDed into every column's editable
canDeleteRow: (row) => this.permissionService.canDelete() && !this.hasChildren(row),
```

`canDeleteRow` is per-row, so use it for **both** permission and referential rules — a
parent keeps its children or its delete button, never both. Removing a row does **not**
confirm; Save is the commit point. A view-only user (no insert/update/delete) gets a
read-only grid for free: no Add, no editing, no delete.

A parent's child count changes without the parent's own rows changing, so the count must
come from the server (`step_count` / `approver_count` on the list DTO) for rows whose
children are not loaded, and from the loaded children for the selected row.

#### Chained master–detail (the SYS1108 pattern)

Selecting a row loads the next grid from its own endpoint:

```
GET /workflows?branch_no=&department_no=&menu_no=   -> grid 1
GET /workflows/{scopeNo}/steps                      -> grid 2  (on grid-1 row click)
GET /steps/{stepNo}/approvers                       -> grid 3  (on grid-2 row click)
```

Each level auto-selects its first row, which cascades to the next. After **save**,
reload the list and pass the saved PK so the user lands back on the row they were
editing (see the Post-Save Selection Rule at the top of this file). Filters above the
grid re-query the list; put them in a `<app-form-section dense>` filter card.

The list endpoint returns **parent rows only** — children load per selection. Nesting
them costs a query per parent plus one per child (an N+1) for data the screen shows one
parent at a time.

**Consequence to design for:** because children load per selection, switching parent rows
discards unsaved child edits. Save is per-parent, so that is coherent — but there is no
unsaved-changes warning.

#### Height, density, pagination

- **Height belongs in the config** (`height: '220px'`). `[height]` on the component
  overrides it for a one-off screen (`height="100%"` inside a flex-filled card). Never
  viewport math.
- `density`: `compact` 30/26 · `comfortable` 34/30 (default) · `spacious` 42/38.
- `showPagination: true` + `pageSize: 50` + `pageSizeOptions: [25, 50, 100, 500]`. The
  pager renders in the status bar; AG Grid's own panel is suppressed.
- Totals sum the whole **filtered** set, not just the visible page.

#### Toolbar

Title + Add/Delete on the left; search + column chooser + export right-aligned as one
segmented control. Search matches the **text on screen** (a lookup column is searched by
its label, not its stored code). Export goes through the app's shared
`TableExportService` (Excel / PDF / CSV / Print), so every export in the app looks the
same, and only filtered rows and visible columns are written.

#### Gotchas that fail silently

AG Grid fails **silently**: a bad column type, a missing height or a stale class name
renders a blank or wrong grid with nothing in the console. Inspect the DOM before
assuming the code is wrong. Specifically:

- **Never `appendTo="body"` on a cell editor.** `stopEditingWhenCellsLoseFocus` makes
  editors modal popups that AG Grid destroys on any mousedown outside the popup — with
  the panel on `body`, clicking an option kills the editor before its click handler runs
  and the selection is silently dropped. _The tell: keyboard Enter commits, mouse click
  does not._ The select editor overrides the app-wide `NgSelectConfig.appendTo = 'body'`
  with a component-scoped config; the `appendTo` **input cannot** do this, because
  ng-select resolves `appendTo() || config.appendTo`.
- **Full-row editing needs INLINE editors**, not popups — a modal popup is dismissed by
  clicking another field, which ends the whole row edit.
- **v36 renamed the pinned-row classes** to `.ag-grid-pinned-bottom-rows` /
  `.ag-row-pinned` (was `.ag-floating-bottom`). Old selectors match nothing.
- **`cellRendererSelector` returning `undefined` falls back to `cellRenderer`** — to
  suppress a renderer on the totals row, omit `cellRenderer` entirely.
- **Signal inputs are unreadable in field initializers** (`NG8118`). Anything derived
  from `config()` belongs in `ngOnInit`.
- **`modelUpdated` fires before `gridReady` assigns the api** — take the api from the
  event, not the field.
- **Never put a backtick in a comment inside a `template:` or `styles:` literal** — it
  terminates the string and yields a baffling `Failed to resolve styles` error.
- **The dev server serves stale grid bundles.** If a change does not appear, check the
  live `gridOptions` before re-debugging the code; touch the file or restart the server.

### Standard action buttons — `<app-action-button>` (CRITICAL)

Every ERP action (Add, Edit, View, Delete, Save, Update, Cancel, Submit, Approve,
Reject, Post, Print, Export, Import, Refresh, Search, Filter, Reset, Download,
Duplicate, Close) is defined ONCE in `shared/actions/erp-actions.ts`.

```html
<app-action-button kind="save" (run)="save()" [loading]="saving()" /> <app-action-button kind="delete" (run)="remove()" />
<!-- confirms automatically -->
```

- Naming the `kind` is enough — icon, label, tooltip and colour come from the catalog.
- **`(run)` fires only after confirmation is accepted.** Destructive actions
  (delete/reject/cancel) and consequential ones (submit/approve/post) confirm by
  default via `AlertService`; pass `[confirm]="false"` to suppress or an object to
  customise. Never hand-roll a confirm for these.
- Do not invent new icon/label pairings in a form — add to the catalog instead.

### Numbering — `shared/numbering`

`serialNumber()`, `formatDocumentNumber()`, `parseDocumentNumber()`, `padNumber()`.

```ts
formatDocumentNumber(123, { prefix: 'PO', year: 2026 }); // PO-2026-000123
```

**Authority rule:** persisted document/transaction numbers are ALWAYS generated by
the backend inside the saving transaction — that is the only gapless, race-free
source. These helpers only format/parse/display. `previewNextSequence()` is for a
UI hint only; never save its result.

### Currency and Decimal Handling (CRITICAL)

**Never hardcode currency symbols or precision.** Always use the global `AppDecimalPipe` (`appDecimal`) which automatically reads the active currency precision from the centralized setup loaded at bootstrap via `CommonDataService`.

- **In templates:** Use `{{ amount | appDecimal }}` or `{{ amount | appDecimal:2 }}` if an override is explicitly needed. Do not use the standard Angular `number` pipe for monetary values.
- **In a grid:** Use `GridColumns.currency(...)` or `GridColumns.decimal(...)`. The column automatically applies the correct pipe and precision using the global service — never call `.precision(2)` to hard-code it.
- **Alignment:** Decimal, Currency, and Number fields must ALWAYS be right-aligned. The grid does this automatically from the column type, but ensure any form input follows this rule so that digits align cleanly.

### PDF Reports — `PdfTemplateService` (CRITICAL)

**Never manually create a jsPDF document or draw headers/footers in your component.** Every PDF export MUST use the shared `PdfTemplateService` to ensure a consistent company header, page footer, and signature block across the entire ERP.

**How to use:**

1. Inject `PdfTemplateService` from `shared/pdf-templates/pdf-template.service`.
2. Call `pdfTemplateService.render()` with a `PdfTemplate` configuration.

Example:

````ts
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
````

If your PDF requires a heavily custom-drawn layout, use a `custom` section type, which gives you access to the `jsPDF` instance and `helpers` (`{ drawHeader, drawPageFooter }`) for adding headers/footers on new pages.

---

## Database Schema Changes (CRITICAL)

**Never add or delete database columns dynamically from middleware or Java services** (e.g., using `jdbcTemplate` in a `@PostConstruct` block).

All database structure modifications must be done via explicit SQL migration scripts provided to the developer, placed in the `../sme-software-backend/db-migration/` or equivalent backend migration directories. Always output the script for the user to run manually or manage via the database migration tool.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

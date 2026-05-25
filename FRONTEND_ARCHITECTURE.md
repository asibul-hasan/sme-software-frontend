# Aidly ERP — Frontend Architecture & Bootstrap → Tailwind Migration

> Status: **in progress** on branch `feat/tailwind-migration`.
> This document is the blueprint and the living migration tracker.

---

## 1. Current-state assessment

The `web-client` app is an Angular 21 (standalone + signals) application inside an
Nx monorepo. The architecture is already ~70% of an enterprise modular monolith:
feature-based folders, `core` / `shared` / `layout` separation, lazy-loaded module
routes, HTTP interceptors, guards, i18n, a permission system, and — critically — a
**CSS-variable design-token system with light/dark themes** (`_themes.scss`).

What this migration fixes:

| Problem | Resolution |
|---|---|
| Bootstrap loaded 3× (compiled CSS in `project.json`, SCSS `@use`, and `bootstrap.js`) | Remove all three; Tailwind v4 replaces it |
| Three coexisting UI systems (Bootstrap + Angular Material + ng-select) patched with `!important` | Single Tailwind-native design system + Angular CDK primitives |
| NgRx installed but unused | Remove; standardize on signal stores |
| Three parallel token systems (`_variables.scss`, `_themes.scss`, `--etbl-*`) | One token source: CSS variables, exposed to Tailwind via `@theme` |
| Inconsistent feature internals (`pages/` vs `forms/sysNNNN/`) | One documented standard (§4) |
| Dead files (`core.config.ts`, unused `components/_*.scss`, `libs/shared-ui` stub) | Removed or populated |

Key insight: the **visual design already lives in custom CSS variables**, not in
Bootstrap. Bootstrap only supplies the grid, a reset, a handful of utilities, and
JS behaviors. That makes a pixel-faithful migration low-risk.

---

## 2. Target architecture — Modular Monolith

A single deployable app, internally partitioned into **bounded domain modules**
with explicit, enforced boundaries. Each module is independently developable and
extractable to an Nx library (and later a micro-frontend) without rewrites.

```
                 ┌─────────────────────────────────────────┐
                 │                 app                     │
                 │  bootstrap, root routes, providers       │
                 └───────────────────┬─────────────────────┘
        ┌────────────────┬───────────┴───────┬──────────────────┐
        ▼                ▼                   ▼                  ▼
   ┌─────────┐     ┌────────────┐      ┌────────────┐     ┌────────────┐
   │  core   │     │   layout   │      │  features  │     │   shared   │
   │ cross-  │     │ app shell  │      │  domains:  │     │ ui kit +   │
   │ cutting │     │ (chrome)   │      │ sys/hr/inv │     │ utilities  │
   └─────────┘     └────────────┘      │ sal/pur/.. │     └────────────┘
                                       └────────────┘
```

**Dependency rule (one direction only):**

```
features ─▶ shared ─▶ core
   │                    ▲
   └────────────────────┘   features may use core; never the reverse.
layout  ─▶ shared, core      features must NOT import other features.
core    ─▶ (nothing app-level)   shared ─▶ core only.
```

Cross-feature communication goes through `core` services or the router — never a
direct import of another feature's internals. This is what keeps a future split
into micro-frontends mechanical rather than archaeological.

---

## 3. Folder structure (standard)

```
apps/web-client/src/
├─ app/
│  ├─ core/                       cross-cutting, app-wide singletons
│  │  ├─ constants/
│  │  ├─ directives/              app-wide (has-permission, …)
│  │  ├─ guards/                  auth.guard, permission.guard
│  │  ├─ interceptors/            auth, api-error, loader
│  │  ├─ models/                  base-entity, response, user, permission
│  │  ├─ services/                auth, theme, storage, app-config, …
│  │  ├─ utils/
│  │  └─ validators/
│  │
│  ├─ shared/                     reusable, presentational, no business logic
│  │  ├─ ui/                      ★ design-system primitives (the UI kit)
│  │  │  ├─ button/  card/  input/  select/  checkbox/  toggle/
│  │  │  ├─ modal/  datepicker/  menu/  tooltip/  icon/  badge/
│  │  │  └─ index.ts
│  │  ├─ components/              composite shared components
│  │  │  (page-form-layout, page-header, breadcrumb, confirm-dialog,
│  │  │   data-list-modal, logo-upload, erp-table, …)
│  │  ├─ directives/              collapsible-card, click-outside, …
│  │  ├─ pipes/                   date-format, number-format, currency, …
│  │  └─ index.ts
│  │
│  ├─ layout/                     authenticated + auth chrome
│  │  ├─ main-layout/  auth-layout/
│  │  └─ components/              header, sidebar, footer, switchers
│  │
│  ├─ features/                   one folder per bounded domain
│  │  └─ <domain>/                sys | hr | inv | sal | pur | fin | rpt
│  │     ├─ <domain>.routes.ts    lazy entry; owns its sub-routes
│  │     ├─ forms/<code>/         ERP transactional forms (sys1001, hr1001…)
│  │     │  ├─ <code>.component.{ts,html,scss}
│  │     │  └─ services/          model.service / data.service (per form)
│  │     ├─ pages/<name>/         list / report / dashboard screens
│  │     ├─ components/           feature-local components
│  │     ├─ models/               feature-local interfaces
│  │     └─ services/             feature-shared data services
│  │
│  ├─ app.component.ts  app.config.ts  app.routes.ts
│
├─ assets/
│  └─ styles/                     global stylesheet + tokens (§6)
└─ index.html
```

**Why `forms/<code>/` and `pages/<name>/` coexist:** ERP forms are addressed by a
stable program code (`sys1001`) that the backend menu/permission tables key on —
that convention stays. Non-form screens (lists, reports, dashboards) use
descriptive `pages/`. Both are now documented and consistent across all domains.

---

## 4. Conventions

**Files** — `kebab-case`; Angular suffix kept: `*.component.ts`, `*.service.ts`,
`*.guard.ts`, `*.routes.ts`, `*.model.ts`, `*.pipe.ts`, `*.directive.ts`.

**Selectors** — components `app-*`; UI-kit primitives `ui-*` (e.g. `ui-button`).

**Symbols** — `PascalCase` classes/interfaces, `camelCase` members; route arrays
`SCREAMING_SNAKE` (`AUTH_ROUTES`). Interfaces are not `I`-prefixed.

**Component structure** — standalone; `changeDetection: OnPush`; inputs/outputs via
`input()` / `output()` signal APIs; DI via `inject()`; subscriptions via `takeUntilDestroyed`
or the `async` pipe. Template + styles in sibling files (no inline for non-trivial).

**Imports** — use the path aliases (§11), never deep relative `../../../`.

---

## 5. Standards per concern

| Concern | Standard |
|---|---|
| **State** | Signals for local/UI state. Cross-cutting state = a `core` service exposing `signal()`/`computed()` (lightweight signal store). NgRx removed — reintroduce only for a genuinely complex domain. |
| **API layer** | All HTTP through `core/services/base-data.service.ts`. One `data.service.ts` per feature extends it. Components never call `HttpClient` directly. Interceptors own auth headers, error toast, loader. |
| **Forms** | Reactive forms only. Each transactional form has a `model.service.ts` (the form view-model: `FormGroup`, dirty/saving signals, load/save). Components stay thin. |
| **Validation** | Shared validators in `core/validators`. Inline errors rendered by the `ValidationMessage` directive; `.required` marker via the field component. |
| **Routing** | Lazy `loadChildren` per domain. Each domain owns `<domain>.routes.ts`. Guards: `AuthGuard` on the shell, `PermissionGuard` per route with a `data.formCode`. |
| **Access control** | Server-driven permissions via `PermissionService`. Structural: `*hasPermission`. Buttons bind `canInsert()/canUpdate()/canDelete()`. |
| **Theming** | `data-theme` on `<html>` (`light`/`dark`). All color/spacing via CSS variables → Tailwind tokens. No hard-coded hex in components. |
| **Responsiveness** | Tailwind breakpoints (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`). Mobile-first utilities; the sidebar collapses below `lg`. |

---

## 6. Design system strategy

Three layers, one token source:

**Layer 1 — Tokens.** CSS custom properties remain the single runtime source of
truth (they already drive light/dark in `_themes.scss`). They are *exposed* to
Tailwind via `@theme inline` so every token is also a utility class. The legacy
`_variables.scss` SCSS vars and the `--etbl-*` table tokens are folded into this
one set.

**Layer 2 — Utilities.** Tailwind v4 utilities for all layout/spacing/typography.
This replaces the Bootstrap grid, Bootstrap utilities, and the bespoke `_utilities.scss`.

**Layer 3 — Components.** A versioned UI kit in `shared/ui/` — Angular components
that encapsulate the repeated patterns so screens stay declarative:

```
ui-button   ui-icon-button   ui-card        ui-input      ui-select
ui-checkbox ui-toggle        ui-textarea    ui-badge      ui-field
ui-modal    ui-datepicker    ui-menu        ui-tooltip    ui-tabs
```

Rules: UI-kit components are **presentational only** (no HTTP, no router, no
feature imports), fully theme-token driven, OnPush, and accessible (CDK `a11y`,
`FocusTrap`, `Overlay`). Composite app-level components (e.g. `page-form-layout`)
live in `shared/components/` and compose the kit.

The current semantic CSS (`.field-group`, `.form-section-card`, `.btn-action`,
`.etbl-*`) is preserved — it is already token-driven and Bootstrap-independent.
It is gradually absorbed into UI-kit components.

---

## 7. Tailwind v4 configuration strategy

CSS-first — **no `tailwind.config.js`**.

- `npm i -D tailwindcss @tailwindcss/postcss postcss`
- `.postcssrc.json` → `{ "plugins": { "@tailwindcss/postcss": {} } }`
- Global entry imports Tailwind and the token files:
  ```scss
  @use 'tailwindcss';            // injected via layer to silence Sass
  @use 'themes';                 // :root / [data-theme] CSS variables
  ```
- A `@theme` block maps CSS variables → Tailwind tokens, so `--indigo`,
  `--bg-primary`, etc. become `bg-indigo`, `text-primary`, … utilities.
- Dark mode: a custom variant bound to the existing attribute —
  `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`
- Content scanning is automatic in v4.

**Spacing fidelity (important).** Bootstrap's spacing scale is non-linear; Tailwind's
is linear (`n × 0.25rem`). Migrate with this mapping so layouts don't shift:

| Bootstrap | rem | Tailwind |
|---|---|---|
| `*-1` | .25 | `*-1` |
| `*-2` | .5  | `*-2` |
| `*-3` | 1   | `*-4` |
| `*-4` | 1.5 | `*-6` |
| `*-5` | 3   | `*-12` |

---

## 8. Bootstrap → Tailwind class mapping

| Bootstrap | Tailwind |
|---|---|
| `container` | `mx-auto w-full px-4` |
| `row` | `grid grid-cols-12 gap-4` |
| `col-md-6` | `col-span-12 md:col-span-6` |
| `col-xl-8` `col-lg-12` | `col-span-12 xl:col-span-8` |
| `d-flex` | `flex` |
| `d-none` / `d-lg-block` | `hidden` / `lg:block` |
| `align-items-center` | `items-center` |
| `justify-content-between` | `justify-between` |
| `flex-grow-1` | `grow` (or `flex-1`) |
| `g-3` (gutter) | `gap-4` |
| `mb-3` / `me-2` / `p-2` | `mb-4` / `me-2` / `p-2` (see §7) |
| `fw-bold` / `fw-semibold` | `font-bold` / `font-semibold` |
| `text-center` / `text-end` | `text-center` / `text-end` |
| `text-muted` | `text-secondary` (token) |
| `w-100` / `h-100` | `w-full` / `h-full` |
| `rounded` / `border` | `rounded-md` / `border` |
| `btn btn-primary` | `<ui-button variant="primary">` |
| `card` / `card-header` / `card-body` | `<ui-card>` / slots |
| `form-control` / `form-select` | `<ui-input>` / `<ui-select>` |
| `modal` (BS JS) | `<ui-modal>` (CDK Dialog) |
| `dropdown` (BS JS) | `<ui-menu>` (CDK Overlay) |
| `data-bs-toggle="tooltip"` | `uiTooltip` directive |
| `.collapse` (BS JS) | `CollapsibleCard` directive (exists) |

---

## 9. Library replacement plan

| Removed | Replaced by | Notes |
|---|---|---|
| `bootstrap` (CSS ×2 + JS) | Tailwind v4 utilities + UI kit | full removal |
| `bootstrap-icons` | `material-icons` font + `ui-icon` | one icon set |
| `@angular/material` | UI-kit components on `@angular/cdk` | **CDK stays** (Overlay, Dialog, A11y, Portal) |
| `@ng-select/ng-select` | `ui-select` (CDK Overlay + listbox) | searchable/virtual-scroll select |
| `@ngrx/*` | signal-based `core` stores | unused today |

`@angular/cdk` is **kept** — it is the accessibility/overlay foundation the UI kit
is built on, and is independent of Bootstrap and Material theming.

---

## 10. Migration phases

Each phase ends green (build passes) and is committed.

- **P0 — Foundation.** Branch, Tailwind v4 install + PostCSS, token port to `@theme`,
  remove duplicate Bootstrap CSS load. ← *current*
- **P1 — UI kit.** Build `shared/ui/` primitives (button, card, input, select,
  field, checkbox, toggle, badge, icon).
- **P2 — Overlays.** `ui-modal`, `ui-menu`, `ui-tooltip`, `ui-datepicker` on CDK;
  retire `mat-*` overlay usage.
- **P3 — Layout shell.** header, sidebar, footer, layouts → Tailwind.
- **P4 — Features.** auth → dashboard → sys → hr; one module at a time.
- **P5 — Shared components.** page-form-layout, breadcrumb, dialogs, etc.
- **P6 — Teardown.** Remove `bootstrap`, `@angular/material`, `ng-select`, `@ngrx/*`
  from `package.json` / `project.json` / styles. Delete dead SCSS. Verify prod build.
- **P7 — Docs.** Rewrite `AI_INSTRUCTIONS.md` to the Tailwind standard.

---

## 11. Path aliases

Add to `tsconfig.base.json` `paths` (extends the existing `@app/*`):

```
@app/*        → apps/web-client/src/app/*
@core/*       → apps/web-client/src/app/core/*
@shared/*     → apps/web-client/src/app/shared/*
@ui/*         → apps/web-client/src/app/shared/ui/*
@layout/*     → apps/web-client/src/app/layout/*
@features/*   → apps/web-client/src/app/features/*
```

---

## 12. Scalability path (beyond this migration)

1. **Now:** modular monolith with the boundaries in §2 enforced by convention.
2. **Next:** extract `core`, `shared` and each `feature/<domain>` into Nx libraries
   (`libs/`); enable `@nx/enforce-module-boundaries` with `scope:*` / `type:*` tags
   so the dependency rule is compiler-enforced, not just documented.
3. **Later:** the `web-support` app + Module Federation are already present — once
   domains are libraries, a heavy module (e.g. `inv`) can be served as a remote
   micro-frontend with no change to its source.

The migration in this document is a prerequisite for steps 2–3: a single,
consistent styling system and clean module boundaries are what make extraction
mechanical.

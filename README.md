# Aidly Frontend — Enterprise Pharmacy Management System (PMS) & SME ERP

High-performance, modular enterprise frontend monorepo built with **Angular 21**, **Nx**, **Tailwind CSS**, and **NG-ZORRO (Ant Design)**.

---

## 🚀 Overview

The `sme-software-frontend` workspace is an Nx monorepo powering two high-scale business web applications:

1. **Aidly PMS (`apps/aidlyPms`)**: A dedicated, feature-rich Pharmacy Management System tailored for retail and wholesale pharmacy operations with real-time POS, batch tracking, stock ledger, dynamic Excel product importing, requisition planning, and double-entry financial accounting.
2. **Aidly ERP / Web Client (`apps/web-client`)**: Modular enterprise business ERP supporting HRM, Finance, Purchase, and Sales workflows.

---

## 🛠️ Tech Stack

* **Framework**: [Angular 21](https://angular.dev/) (Standalone Components, Signals, Reactive Forms)
* **Workspace Engine**: [Nx 22 Monorepo](https://nx.dev/)
* **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) + [NG-ZORRO Ant Design](https://ng.ant.design/) + Bootstrap Utility compatibility
* **Data Grids & Tables**: [AG Grid Angular](https://www.ag-grid.com/angular-data-grid/)
* **State & Reactivity**: Angular Signals & [RxJS](https://rxjs.dev/)
* **Reporting & Documents**: [ExcelJS](https://github.com/exceljs/exceljs), [jsPDF](https://github.com/parallax/jsPDF), `jspdf-autotable`
* **Charts & Analytics**: [Chart.js](https://www.chartjs.org/) + `ng2-charts`
* **Code Quality & Git Hooks**: [Husky](https://typicode.github.io/husky/) + [Commitlint](https://commitlint.js.org/) (Strict Conventional Commits)
* **Automated Versioning & Releases**: [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version)

---

## 📁 Monorepo Structure

```text
sme-software-frontend/
├── apps/
│   ├── aidlyPms/               # Aidly Pharmacy Management System (PMS)
│   │   ├── src/app/
│   │   │   ├── core/           # Session management, auth interceptors, base API services
│   │   │   ├── features/       # Business modules:
│   │   │   │   ├── accounting/ # Dual-ledger double-entry accounting & voucher posting
│   │   │   │   ├── auth/       # Login, tokens, role guards
│   │   │   │   ├── cash/       # Cash drawer, day book, petty cash
│   │   │   │   ├── customer/   # Customer registration, credit limits, accounts
│   │   │   │   ├── dashboard/  # Real-time KPIs, sales charts, low stock alerts
│   │   │   │   ├── doctors/    # Prescribing doctor registry & commissions
│   │   │   │   ├── due/        # Customer due collections & receipts
│   │   │   │   ├── products/   # Medicines, batches, Excel import, requisitions
│   │   │   │   ├── reconciliation/ # Bank statement reconciliations
│   │   │   │   ├── representatives/# Medical representatives & supplier agents
│   │   │   │   ├── roles/      # RBAC permission matrix
│   │   │   │   ├── settings/   # VAT, currency, receipt printer, alert configs
│   │   │   │   ├── subscription/ # SaaS subscription & license validation
│   │   │   │   └── supplier/   # Supplier ledger & purchase orders
│   │   │   ├── layout/         # Header, responsive sidebar, breadcrumbs
│   │   │   └── shared/         # Reusable UI-kit components, modals, filters
│   ├── web-client/             # SME Business ERP client application
│   └── web-support/            # Shared support utilities and helpers
├── .github/workflows/
│   ├── deploy-pms.yml          # Automated cPanel FTP build & deployment pipeline
│   └── release.yml             # Automated SemVer versioning, Git tagging & GitHub releases
├── .versionrc.json             # Conventional Commits changelog section mapping
├── commitlint.config.js        # Strict Conventional Commits rule definitions
└── package.json
```

---

## ⚡ Getting Started

### Prerequisites

* **Node.js**: `v20.x` or `v24.x` (Recommended)
* **npm**: `v10.x` or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:asibul-hasan/sme-software-frontend.git
cd sme-software-frontend

# Install dependencies (respecting legacy peer deps where required by Nx/Angular plugins)
npm install --legacy-peer-deps
```

---

## 💻 Development Scripts

| Command | Description |
|---|---|
| `npm run start:pms` | Serves **Aidly PMS** on `http://localhost:4203` with hot-reload |
| `npm start` | Serves **ERP Web Client** on `http://localhost:4202` |
| `npm run build:pms` | Compiles production bundle for Aidly PMS (`dist/apps/aidlyPms`) |
| `npm run build` | Compiles production bundle for ERP Web Client |
| `npm run lint` | Runs ESLint and Angular lint rules across workspace |
| `npm test` | Runs unit tests via Jest |
| `npm run verify:pms-schema` | Validates frontend and backend DTO schema parity |

---

## 🏷️ Conventional Commits & Versioning

All commits strictly follow the [Conventional Commits specification](https://www.conventionalcommits.org/):

```text
<type>(<optional-scope>): <subject>
```

### Allowed Types
* `feat`: New user-facing feature or enhancement
* `fix`: Bug fix
* `perf`: Performance improvements
* `refactor`: Code changes that neither fix a bug nor add a feature
* `style`: Styling or formatting changes
* `docs`: Documentation updates
* `test`: Adding or correcting tests
* `build`: Build system or external dependency changes
* `ci`: CI/CD workflow updates
* `chore`: Maintenance tasks, tooling configs, and releases

### Release & Version Management

This repository uses automated SemVer versioning and tag management via `commit-and-tag-version`:

| Script | Purpose |
|---|---|
| `npm run release` | Automatically determines next SemVer from commit history and tags release |
| `npm run release:patch` | Forces a patch release (e.g., `v1.0.1`) |
| `npm run release:minor` | Forces a minor release (e.g., `v1.1.0`) |
| `npm run release:major` | Forces a major release (e.g., `v2.0.0`) |
| `npm run release:dry` | Dry-run preview of changelog and next version without committing |

---

## 🤖 CI/CD Automation

* **Automated Releases (`.github/workflows/release.yml`)**: On pushes to `main`, Conventional Commits are analyzed to update [`CHANGELOG.md`](./CHANGELOG.md), bump `package.json`, commit with `[skip ci]`, tag `vX.Y.Z`, and publish a GitHub Release.
* **cPanel Deployment (`.github/workflows/deploy-pms.yml`)**: On pushes modifying PMS files or `package.json`, compiles a production build with `.htaccess` SPA routing and syncs to cPanel via secure FTP.

---

## 📄 License

MIT © [Asibul Hasan](https://github.com/asibul-hasan) & Aidly Engineering Team.

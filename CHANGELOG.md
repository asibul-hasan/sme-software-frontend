# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.33.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.32.0...v1.33.0) (2026-10-26)


### 🚀 Features

* **db:** sync sys_menus migrations 12 and 13 with schema parity ([86fff13](https://github.com/asibul-hasan/sme-software-frontend/commit/86fff13a483657e86b78a7eb680d8cee1f937c80))

## [1.32.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.31.2...v1.32.0) (2026-10-25)


### 🚀 Features

* **pos:** add default pos screen branch config and enforce out-of-stock warning rules ([2e0631d](https://github.com/asibul-hasan/sme-software-frontend/commit/2e0631d1c9d82fd783ac4011f48565a7da99f99a))

## [1.31.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.31.1...v1.31.2) (2026-10-25)


### 🐛 Bug Fixes

* **pos:** probe public /health endpoint and gate connectivity polling to authenticated sessions ([de3f370](https://github.com/asibul-hasan/sme-software-frontend/commit/de3f37010dd7479265c9b4b67713c5090cde3285))

## [1.31.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.31.0...v1.31.1) (2026-10-25)


### 🐛 Bug Fixes

* **reps:** stop loading spinner after representatives fetch completes ([fcd72a0](https://github.com/asibul-hasan/sme-software-frontend/commit/fcd72a0ae11b33f7fdea507541780db06d87634b))

## [1.31.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.30.0...v1.31.0) (2026-10-25)


### 🚀 Features

* **pos:** implement WebUSB thermal receipt printer and direct checkout printing ([fa7fbba](https://github.com/asibul-hasan/sme-software-frontend/commit/fa7fbba57c1887b38e2b40f44680902016dce2de))

## [1.30.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.29.1...v1.30.0) (2026-10-25)


### 🚀 Features

* **pos:** implement offline POS for plain sales with sync gateway and clinical safety guards ([4d418ec](https://github.com/asibul-hasan/sme-software-frontend/commit/4d418ec654f23d24c7ef25fb1fdc824fb198303e))

## [1.29.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.29.0...v1.29.1) (2026-10-25)


### 📝 Documentation

* **rules:** document frontend-first push order in AGENTS.md ([88b6f84](https://github.com/asibul-hasan/sme-software-frontend/commit/88b6f8479129c5b31dc6fdfee3836d037d2ca616))

## [1.29.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.28.0...v1.29.0) (2026-10-25)


### 🚀 Features

* **inventory:** standardize stock movement types and sync schema migration ([26c461a](https://github.com/asibul-hasan/sme-software-frontend/commit/26c461a01fb19aebee5c44f72bc1246acf128cd9))

## [1.28.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.27.1...v1.28.0) (2026-10-24)


### 🚀 Features

* **inventory:** add stocktake screens, unreceived sales view, and ledger integrity badges ([e5a770e](https://github.com/asibul-hasan/sme-software-frontend/commit/e5a770e0f5cf5c8c59d1cf140d4f7f3d437a41d3))

## [1.27.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.27.0...v1.27.1) (2026-10-23)


### 🐛 Bug Fixes

* **products:** remove hardcoded stock_qty 100 default from medicine creation form ([ee8d3c0](https://github.com/asibul-hasan/sme-software-frontend/commit/ee8d3c07eb9ba191f92fe994bcf19e9e97d50529))

## [1.27.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.26.0...v1.27.0) (2026-10-23)


### 🚀 Features

* **pos:** add stock column after item in cart table ([e545b6f](https://github.com/asibul-hasan/sme-software-frontend/commit/e545b6fc9e2ae9cd4e1f9215f538241ff4fbe66e))

## [1.26.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.25.0...v1.26.0) (2026-10-23)


### 🚀 Features

* **pos:** relocate cart table to left pane and remove category pills & cards in screen 3 ([214c701](https://github.com/asibul-hasan/sme-software-frontend/commit/214c701a58f7495bfbddd1eea28997e5c266e837))

## [1.25.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.24.2...v1.25.0) (2026-10-23)


### 🚀 Features

* **pos:** implement screen 3 zero-click LOV combobox and barcode workflow ([0bef2d6](https://github.com/asibul-hasan/sme-software-frontend/commit/0bef2d673f753fcbe554b9f58b98a19fdbf651c8))

## [1.24.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.24.1...v1.24.2) (2026-10-23)


### ⚡ Performance Improvements

* **discovery:** eliminate 15s health polling loop, adopt web-client single-probe strategy ([26834fe](https://github.com/asibul-hasan/sme-software-frontend/commit/26834fe64ccd01382d1a21ef08eb13e5fda311eb))

## [1.24.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.24.0...v1.24.1) (2026-10-23)


### 🐛 Bug Fixes

* **pos:** harmonize exchange request payload models with backend ([a47c843](https://github.com/asibul-hasan/sme-software-frontend/commit/a47c8436a5a7928c9cd9baed73bdf4d6d059224e))

## [1.24.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.23.3...v1.24.0) (2026-10-23)


### 🚀 Features

* **pos:** add comprehensive keyboard shortcuts tooltip menu on hover ([e515769](https://github.com/asibul-hasan/sme-software-frontend/commit/e515769802486a44fbe29543c71554a81234dbab))

## [1.23.3](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.23.2...v1.23.3) (2026-10-23)


### ♻️ Code Refactoring

* **pos:** hide add customer and quick print from header bar ([c1bb615](https://github.com/asibul-hasan/sme-software-frontend/commit/c1bb61539e9cec3da58cb39648452d6cdfb86389))

## [1.23.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.23.1...v1.23.2) (2026-10-23)


### ♻️ Code Refactoring

* **pos:** use LOV select dropdown for terminal view switcher ([6fe4b1b](https://github.com/asibul-hasan/sme-software-frontend/commit/6fe4b1b85deea539dc32ac06545b2171224e6803))

## [1.23.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.23.0...v1.23.1) (2026-10-22)


### ♻️ Code Refactoring

* **pos:** move view switcher into header navigation list without label ([3c05a41](https://github.com/asibul-hasan/sme-software-frontend/commit/3c05a41129fe558a8179225a8dcde3f131aa8cad))

## [1.23.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.22.1...v1.23.0) (2026-10-22)


### 🚀 Features

* **pos:** add stock details in search dropdown and cart table for Screen 2 ([ac88b9b](https://github.com/asibul-hasan/sme-software-frontend/commit/ac88b9b9debb4c0c76bb14537047c69c0db8fba3))

## [1.22.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.22.0...v1.22.1) (2026-10-22)


### 🐛 Bug Fixes

* **pos:** simplify view switcher button labels to Screen 1 and Screen 2 ([c03b996](https://github.com/asibul-hasan/sme-software-frontend/commit/c03b99664854bc23498c0483307f0ea9c7e11cfe))

## [1.22.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.21.1...v1.22.0) (2026-10-22)


### 🚀 Features

* **pos:** add Screen 2 view with pixel-to-pixel fidelity and view switcher ([a3660db](https://github.com/asibul-hasan/sme-software-frontend/commit/a3660db3712d76f8000ee4a8ee9d5a3f04a74b9d))

## [1.21.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.21.0...v1.21.1) (2026-10-22)


### 🐛 Bug Fixes

* **subscription:** sync schema parity and migrations for subscription hardening ([35f13f5](https://github.com/asibul-hasan/sme-software-frontend/commit/35f13f5d0afe7886738e435877321596d65877db))

## [1.21.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.20.0...v1.21.0) (2026-10-22)


### 🚀 Features

* **ux:** streamline pos checkout, sale return, grn conversion, and expiry quarantine ([fc1ed98](https://github.com/asibul-hasan/sme-software-frontend/commit/fc1ed98428b86ecc67d509a0e2dfe5e87be857c8))

## [1.20.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.19.0...v1.20.0) (2026-10-22)


### 🚀 Features

* **ux:** add actionable empty state CTAs, loading spinners, and error retries ([e2b0034](https://github.com/asibul-hasan/sme-software-frontend/commit/e2b00343444e092ba377506d8649ff1c8077d7f6))

## [1.19.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.18.0...v1.19.0) (2026-10-22)


### 🚀 Features

* **pos:** add Bangla patient dosage sticker generation and thermal printing ([9859770](https://github.com/asibul-hasan/sme-software-frontend/commit/985977092dc70807aaef601df07e84a22ea4326c))

## [1.18.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.17.1...v1.18.0) (2026-10-22)


### 🚀 Features

* **a11y:** WCAG 2.2 AA modal focus trap, escape-to-close, button aria-labels, and input label IDs ([580f630](https://github.com/asibul-hasan/sme-software-frontend/commit/580f63066ea42ab10a3c77caf7efe3681e30f275))
* **pos:** split two-pane catalog layout, keyboard shortcuts F2/F4/F8, and auto-default tender ([61840a9](https://github.com/asibul-hasan/sme-software-frontend/commit/61840a902a75e67c0b6a6d4ff50ed9a781c0b3e9))
* **responsive:** enlarge POS cart touch targets to 32px and prevent table overflow on 768px tablet ([283041e](https://github.com/asibul-hasan/sme-software-frontend/commit/283041ec7a5395e14bcf72fe795598c4b0cc8a24))
* **tables:** add column sorting, pagination controls, and quick row actions ([a52d3be](https://github.com/asibul-hasan/sme-software-frontend/commit/a52d3bef676c7e6a1761e952f80ef99540cb5ef7))


### 🐛 Bug Fixes

* **trust:** replace stubs with real API calls, add branch switcher ([d77d4f2](https://github.com/asibul-hasan/sme-software-frontend/commit/d77d4f25e762eb66ef24ca1de9e4d7fb2b0454bc))


### 🎨 UI & Styling

* **design:** resolve badge color collisions and unify table action icon sizing ([1019a5b](https://github.com/asibul-hasan/sme-software-frontend/commit/1019a5b1e79b8c08067cfc826d326a950dad2756))

## [1.17.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.17.0...v1.17.1) (2026-10-22)


### 🐛 Bug Fixes

* **products:** ensure valid company and generic reference in product add form ([d6b2f03](https://github.com/asibul-hasan/sme-software-frontend/commit/d6b2f033d6275bb44b7e1a0fdb52c7cf67e11ca3))

## [1.17.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.16.0...v1.17.0) (2026-10-22)


### 🚀 Features

* complete aidly pms items 0 to 7 enhancements and schema sync ([24b3962](https://github.com/asibul-hasan/sme-software-frontend/commit/24b39628f5519e3f840fb1f626d0052814651c83))

## [1.16.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.15.0...v1.16.0) (2026-10-22)


### 🚀 Features

* **auth:** add role_name, status and SysRoleMenuPermission models ([8a42f9b](https://github.com/asibul-hasan/sme-software-frontend/commit/8a42f9b6cec61d10a2f9bc6e07f5bf08b3c120e3))


### 🔧 Maintenance & Chores

* **schema:** sync zero defaults, sequences, and migration order ([cd48c04](https://github.com/asibul-hasan/sme-software-frontend/commit/cd48c04fcff0b93e12dab3a4838aa7694948defb))

## [1.15.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.14.0...v1.15.0) (2026-10-21)


### 🚀 Features

* **menus:** implement Menu and Role Permission web client forms and routing ([ccced5e](https://github.com/asibul-hasan/sme-software-frontend/commit/ccced5e871c8e9119e8bc409b0b74e73276755de))


### 🐛 Bug Fixes

* **database:** add DEFAULT TRUE to sys_roles.status and add menu UI components ([c7374e6](https://github.com/asibul-hasan/sme-software-frontend/commit/c7374e6103d2a48cd82f240a90e504054b635b53))

## [1.14.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.13.0...v1.14.0) (2026-10-21)


### 🚀 Features

* **database:** add sys_menus and sys_role_menu_permissions schema ([b87dfd2](https://github.com/asibul-hasan/sme-software-frontend/commit/b87dfd21e4a9aa4f55a14f8627ec2317ee5b5869))


### 🐛 Bug Fixes

* **database:** scope fk constraint check to current schema and synchronize migrations ([c010078](https://github.com/asibul-hasan/sme-software-frontend/commit/c010078a675239da85efaf7a812a89cbb27fea2f))


### 📝 Documentation

* add AGENTS.md with mandatory pull before push rule ([1f21de4](https://github.com/asibul-hasan/sme-software-frontend/commit/1f21de4a6bd4a69e0d72055633e4befa448eea00))

## [1.13.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.12.1...v1.13.0) (2026-10-21)


### 🚀 Features

* **database:** synchronize monotonic ID sequences and migration scripts ([87d3f46](https://github.com/asibul-hasan/sme-software-frontend/commit/87d3f4600d80057bbbc3218f0a6675db4ae5fef9))

## [1.12.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.12.0...v1.12.1) (2026-10-21)


### 🐛 Bug Fixes

* **security:** implement branch switcher, escape print html, add migrations ([f8d18ae](https://github.com/asibul-hasan/sme-software-frontend/commit/f8d18aeaf4f868fb526d49f99c2388c8197b2424))

## [1.12.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.11.2...v1.12.0) (2026-10-21)


### 🚀 Features

* **database:** add schema_pre_migration baseline for upgrade testing ([3e8ab45](https://github.com/asibul-hasan/sme-software-frontend/commit/3e8ab4557dbc40debf1dc37a95fad77a6f228fdb))


### 🐛 Bug Fixes

* **schema:** resolve circular FK and synchronize db_script with schema ([941fda2](https://github.com/asibul-hasan/sme-software-frontend/commit/941fda26bc63640f42e9624c5c2322a0d17c8269))

## [1.11.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.11.1...v1.11.2) (2026-10-21)


### 🐛 Bug Fixes

* **shared:** widen getOptionLabel and getOptionValue generic types for string options ([4a2747b](https://github.com/asibul-hasan/sme-software-frontend/commit/4a2747ba15c39e67a057863490d3460e0e57e91f))

## [1.11.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.11.0...v1.11.1) (2026-10-21)


### 🔧 Maintenance & Chores

* **database:** synchronize db_script.sql with schema.sql and DGDA compliance fields ([77f9004](https://github.com/asibul-hasan/sme-software-frontend/commit/77f9004ad8b5504a218f18b2e4a9dd2b70087895))

## [1.11.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.10.0...v1.11.0) (2026-10-21)


### 🚀 Features

* **compliance:** add DGDA dar_number, drug_schedule dropdowns, and doctor bmdc_reg_no ([e2bce90](https://github.com/asibul-hasan/sme-software-frontend/commit/e2bce904b9fdaef4088629bb703ac86fe5573f31))
* **compliance:** refactor drug_schedule to frontend-driven lookup and document rules ([06d773a](https://github.com/asibul-hasan/sme-software-frontend/commit/06d773a585427aa7ff6f51507587595ce56724ea))

## [1.10.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.9.1...v1.10.0) (2026-10-21)


### 🚀 Features

* **cash:** add 4-check day-end reconciliation badge, universal sale.return migration, backfill payments, and reusable idempotency key ([9c007d4](https://github.com/asibul-hasan/sme-software-frontend/commit/9c007d48739f688b6b3b9f5654d4f47aedc5fbcc))


### 🐛 Bug Fixes

* **pms:** remove corrupt symlink CLAUDE.md causing checkout failure ([b582bab](https://github.com/asibul-hasan/sme-software-frontend/commit/b582baba775eb2ded3e18bf04e6d97d82d9ee803))

## [1.9.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.9.0...v1.9.1) (2026-10-21)


### 🐛 Bug Fixes

* **pos:** resolve TypeScript strict types for catalog products and exchange response ([9f7e235](https://github.com/asibul-hasan/sme-software-frontend/commit/9f7e2350bf761d4a5e986196c4df841296eaf60f))

## [1.9.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.8.1...v1.9.0) (2026-10-21)


### 🚀 Features

* **pos:** add safe sales return, exchange, schema parity, and fix CI deployment ([f00a371](https://github.com/asibul-hasan/sme-software-frontend/commit/f00a37177c3ba59645b190ef1b79e9f09f987a68))
* **pos:** update pos-sale.service to send void payload with reason and approval ([8be9b75](https://github.com/asibul-hasan/sme-software-frontend/commit/8be9b751cb037cb8df5afac8808b22ec6f4b78d2))

## [1.8.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.8.0...v1.8.1) (2026-10-21)


### 📝 Documentation

* **repo:** organize documentation under apps/aidlyPms and apps/web-client ([0dca63b](https://github.com/asibul-hasan/sme-software-frontend/commit/0dca63b95abb6cb6c0c78a91316d184e992b6396))

## [1.8.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.7.0...v1.8.0) (2026-10-21)


### 🚀 Features

* **pos:** add split tender, MFS TrxID, clinical Rx checks, and BIN slips ([5279b60](https://github.com/asibul-hasan/sme-software-frontend/commit/5279b60f364f4ee23426c854ba657ea960b553a0))

## [1.7.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.6.0...v1.7.0) (2026-10-18)


### 🚀 Features

* **requisition:** enforce minimum restock quantity default population and save validation ([b528bd1](https://github.com/asibul-hasan/sme-software-frontend/commit/b528bd17b35721390d3916d8835969493631d89b))

## [1.6.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.5.1...v1.6.0) (2026-10-18)


### 🚀 Features

* **pms:** move discount ৳/% toggle to the beginning of discount inputs across forms ([c86662c](https://github.com/asibul-hasan/sme-software-frontend/commit/c86662cb408e5ccd0347587a6b7a4a6eac023d8b))

## [1.5.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.5.0...v1.5.1) (2026-10-18)


### 🐛 Bug Fixes

* **pos:** send net payment excluding change amount in single-tender checkout ([5309867](https://github.com/asibul-hasan/sme-software-frontend/commit/5309867d04462d04a58dc48af137a97872c48649))

## [1.5.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.4.3...v1.5.0) (2026-10-18)


### 🚀 Features

* **pms:** add proportional discount, due adjustments, and routing aliases to sale return ([ca9deaf](https://github.com/asibul-hasan/sme-software-frontend/commit/ca9deaf3d9b35cfeb3d699fc870bc81b639e2ba6))

## [1.4.3](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.4.2...v1.4.3) (2026-10-18)


### 🐛 Bug Fixes

* **purchase,requisition:** reactive discount, voucher modal, and stock fixes ([cab3745](https://github.com/asibul-hasan/sme-software-frontend/commit/cab3745f985994d0e508c7e74a34ad63456b81a2))

## [1.4.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.4.1...v1.4.2) (2026-10-18)


### 🐛 Bug Fixes

* **auth:** update login page brand name to Demo Pharmacy ([7104b98](https://github.com/asibul-hasan/sme-software-frontend/commit/7104b98302f8e3c725a5e3744c754b5d8a037258))

## [1.4.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.4.0...v1.4.1) (2026-10-17)


### 🐛 Bug Fixes

* **common:** standardize date pickers and API date filtering to dd-MM-yyyy format ([906e034](https://github.com/asibul-hasan/sme-software-frontend/commit/906e0348948004f2cfb911b53414c2bbbf611a91))

## [1.4.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.3.0...v1.4.0) (2026-10-17)


### 🚀 Features

* **inventory:** add stock valuation and inventory report screen ([b27dce3](https://github.com/asibul-hasan/sme-software-frontend/commit/b27dce3e23c9114346b07e1aa86ded82d1c5c4e3))

## [1.3.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.7...v1.3.0) (2026-10-17)


### 🚀 Features

* **reports:** build account module reports with date filters ([f49deee](https://github.com/asibul-hasan/sme-software-frontend/commit/f49deee9c3a92e0e09371fc6a70e83d14a568d02))

## [1.2.7](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.6...v1.2.7) (2026-10-17)


### 🐛 Bug Fixes

* **forms:** rename audit screens and logs to register ([586d931](https://github.com/asibul-hasan/sme-software-frontend/commit/586d931afb4edd18498c4a276e97ab957564f5ce))

## [1.2.6](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.5...v1.2.6) (2026-10-17)


### 🐛 Bug Fixes

* **accounting:** lock account deletion when transactions or active balance exist ([77ea892](https://github.com/asibul-hasan/sme-software-frontend/commit/77ea89228e81924bef76918894dabc65084da9a8))

## [1.2.5](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.4...v1.2.5) (2026-10-17)


### 🐛 Bug Fixes

* **requisition:** make fulfilled requisitions view only and lock from editing and unapproving ([00c155a](https://github.com/asibul-hasan/sme-software-frontend/commit/00c155a3c70b5c6a6e6f57d59bfd8c879010b107))

## [1.2.4](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.3...v1.2.4) (2026-10-17)


### 🐛 Bug Fixes

* **requisition:** lock approved requisitions from editing and deleting ([2a6a34d](https://github.com/asibul-hasan/sme-software-frontend/commit/2a6a34d647d6be04696b3cf7810c26f58cfaa70b))

## [1.2.3](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.2...v1.2.3) (2026-10-17)


### 🐛 Bug Fixes

* **purchase:** ensure receive and update stock button is visible and accessible ([bf7f76c](https://github.com/asibul-hasan/sme-software-frontend/commit/bf7f76cc2360a35baf273772697c002c7487c970))

## [1.2.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.1...v1.2.2) (2026-10-17)


### 🐛 Bug Fixes

* **pos:** auto-focus add button after selecting product from dropdown ([d80f9a5](https://github.com/asibul-hasan/sme-software-frontend/commit/d80f9a5a052890d92e491749fb05a7e6c97d379c))

## [1.2.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.2.0...v1.2.1) (2026-10-17)


### 🐛 Bug Fixes

* **pos:** contrast colors for selected product in search dropdown ([c232a45](https://github.com/asibul-hasan/sme-software-frontend/commit/c232a456e13679b777f42987077fca38b16c896c))

## [1.2.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.1.0...v1.2.0) (2026-10-17)


### 🚀 Features

* **pos:** hide split payment option and balance payment method grid ([a4f2410](https://github.com/asibul-hasan/sme-software-frontend/commit/a4f24100b6b0f9866c660b1c79a60c78a5b52840))

## [1.1.0](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.0.2...v1.1.0) (2026-10-17)


### 🚀 Features

* **sales:** invoice-driven customer returns with auto-populated items ([cb4715c](https://github.com/asibul-hasan/sme-software-frontend/commit/cb4715cf6808c47fd1bce30f367da9ae0a927170))

## [1.0.2](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.0.1...v1.0.2) (2026-10-17)


### 📝 Documentation

* add comprehensive frontend monorepo README documentation ([225639b](https://github.com/asibul-hasan/sme-software-frontend/commit/225639b08f05bc61d1ba96a034cfca674c4bf939))

## [1.0.1](https://github.com/asibul-hasan/sme-software-frontend/compare/v1.0.0...v1.0.1) (2026-10-17)


### 📝 Documentation

* **memory:** update release and semver tagging documentation in GEMINI.md ([84cfd14](https://github.com/asibul-hasan/sme-software-frontend/commit/84cfd14fcf6a837c3539b55c91bb415db52a4ccf))


### 🤖 Continuous Integration

* **release:** enhance release notes preparation and GitHub Release action ([742d0c6](https://github.com/asibul-hasan/sme-software-frontend/commit/742d0c63ba2345071abb82eb8da4d49832f2a803))

## 1.0.0 (2026-10-17)

### 🚀 Features

* add AuthDataService and implement shared form layout, sidebar pagination, and user management component components ([c0486ee](https://github.com/asibul-hasan/sme-software-frontend/commit/c0486ee39d8d4021a12cb1ca5b3d477cad187444))
* add CDK-based overlay components to the UI kit (Phase 2) ([f22f47e](https://github.com/asibul-hasan/sme-software-frontend/commit/f22f47ee744619ba5771a84be708f88a46f735d6))
* add dynamic environment configuration to auto-detect and switch between local and live API endpoints ([46d8df3](https://github.com/asibul-hasan/sme-software-frontend/commit/46d8df384528348fadf09f9285d1bbed319dc41f))
* add ERP forms and sidebar checkpoint ([7d5f912](https://github.com/asibul-hasan/sme-software-frontend/commit/7d5f9121eda193598722691e6032f5b97e842afd))
* add FIN1102 bank reconciliation form and common table component ([65a3a5a](https://github.com/asibul-hasan/sme-software-frontend/commit/65a3a5af73581e35a293062e081a70cea2082415))
* add form & dialog components to the UI kit (Phase 3) ([4f03391](https://github.com/asibul-hasan/sme-software-frontend/commit/4f03391f87c5ad58cc9b6f5c54982c5aca0fe819))
* add inventory modules for rack setup, batch management, and related services ([4de53b8](https://github.com/asibul-hasan/sme-software-frontend/commit/4de53b89bf7812b869bf61f37bb108b38aa23558))
* add Tailwind v4 foundation for Bootstrap migration ([697e1da](https://github.com/asibul-hasan/sme-software-frontend/commit/697e1da840e53279eb0628553a94d23bbc2ddad3))
* add Tailwind-native UI-kit primitives (Phase 1) ([24ed995](https://github.com/asibul-hasan/sme-software-frontend/commit/24ed9958d2a5c8f9f2122492543799a6d1e2d212))
* **api:** add backend discovery with local auto-reconnect and hf fallback ([d56ed54](https://github.com/asibul-hasan/sme-software-frontend/commit/d56ed54ba94ec9af3197cba21f587bd5b1a9133c))
* bootstrap ERP frontend architecture with custom AG Grid integration, UI component library, and base feature modules. ([8ddb4bc](https://github.com/asibul-hasan/sme-software-frontend/commit/8ddb4bcde095e8debae036d2d3f5a6a18e3b6577))
* complete removal of hardcoded mock data and integrate live APIs across all screens ([c24a2e3](https://github.com/asibul-hasan/sme-software-frontend/commit/c24a2e3013161c4f291d87267090ae29ffb73b27))
* define system constants and initialize SYS1001 component structure ([a04bcc3](https://github.com/asibul-hasan/sme-software-frontend/commit/a04bcc31d4ac235d8a8461dcb637fbfbaf978965))
* enhance common table component with status badges and inline editing ([5d1a538](https://github.com/asibul-hasan/sme-software-frontend/commit/5d1a53812464bc35f311947c7cd0f091dc6dc2b1))
* enhance requisition planner, enforce role & settings UX, and remove page size selectors ([1ffb22b](https://github.com/asibul-hasan/sme-software-frontend/commit/1ffb22bada3fdf59482f0676adc5035214c40095))
* implement AppBootstrapService for global session initialization and AuthSessionConfigService for managed authentication configuration ([aab123b](https://github.com/asibul-hasan/sme-software-frontend/commit/aab123b71f4daea9ee593e9d61d08e3ad3d272a0))
* implement authentication, global loader, and permission system infrastructure for AidlyERP ([47e2e34](https://github.com/asibul-hasan/sme-software-frontend/commit/47e2e3477fb984a62b09ddcea7db97626e33a85f))
* implement CommonTableComponent with enhanced features and types ([b9c07a9](https://github.com/asibul-hasan/sme-software-frontend/commit/b9c07a990c114dbfc54ed83fbf86133d3d1d8ced))
* implement company profile management component with logo upload functionality and associated core services ([f9c63a1](https://github.com/asibul-hasan/sme-software-frontend/commit/f9c63a19d75cc06f7183f7ffa1f381e30bb5dcd8))
* implement core auth services, shared components, and scaffold multiple module feature forms ([38b7003](https://github.com/asibul-hasan/sme-software-frontend/commit/38b7003e1ad3194f98bbf1a43ce21b592ede0628))
* implement core authentication system and dynamic sidebar menu builder ([6b43410](https://github.com/asibul-hasan/sme-software-frontend/commit/6b43410a86273f712e205f707d9dcbebf896e6b0))
* implement core authentication system and initial branch management module ([00bce71](https://github.com/asibul-hasan/sme-software-frontend/commit/00bce71615a4649cc63a84b41f368c5b1462c739))
* implement core layout styles, themes, and base modules for system feature components ([1f10bf7](https://github.com/asibul-hasan/sme-software-frontend/commit/1f10bf7d813eab47b21a779ffc4263879201470b))
* implement dynamic environment URL configuration with local API connectivity checks ([e65859c](https://github.com/asibul-hasan/sme-software-frontend/commit/e65859c96bd004ae8d148077ff852bf0c23fd828))
* implement HR1004 Grade/Pay-Scale management module with shared table and layout components ([007d58a](https://github.com/asibul-hasan/sme-software-frontend/commit/007d58acf45ea186c1e35d6665621d78fea93909))
* implement hrm1321 leave approval component and supporting services ([8839413](https://github.com/asibul-hasan/sme-software-frontend/commit/883941310d1eae4082981911c898f5d5b7eb5aa8))
* implement layout components including branch, language, and theme switchers with session management ([ca04b83](https://github.com/asibul-hasan/sme-software-frontend/commit/ca04b83aae224b17db05d54e33031b1a772c5523))
* implement login component structure and add system form scaffolding ([ad39fa7](https://github.com/asibul-hasan/sme-software-frontend/commit/ad39fa7b9c4eaa3339d20658839d29406c5178fd))
* implement main layout with responsive sidebar, global keyboard shortcuts, and tax setup module structure ([0eb1f24](https://github.com/asibul-hasan/sme-software-frontend/commit/0eb1f24f4a2f4f37035247ca30f9b509800cf48a))
* implement module routing and add user management feature component with associated services ([52e17f6](https://github.com/asibul-hasan/sme-software-frontend/commit/52e17f6ebeae12ea192b6029d2e1590e5cc3d820))
* implement new form modules and base data services for the web client application ([bcaf905](https://github.com/asibul-hasan/sme-software-frontend/commit/bcaf905668fe4ee4cbb65f45b28a164aad736bd2))
* implement PDF reporting engine and add supporting components for HRM and Finance modules ([6371eb6](https://github.com/asibul-hasan/sme-software-frontend/commit/6371eb63d2b47c25055c3c7d315f72af9b322412))
* implement responsive sidebar navigation and add skeleton for sys1101 and hrm1301 features ([3d9b24a](https://github.com/asibul-hasan/sme-software-frontend/commit/3d9b24acfef5542a7345b2ff4185ec73c10fd1cd))
* implement reusable data-list-modal component and add supporting core services and module configurations ([913c989](https://github.com/asibul-hasan/sme-software-frontend/commit/913c989a78936152e7a1d09fbb507b393cfe5975))
* implement session-manager service and initialize Nx workspace data ([4a84cad](https://github.com/asibul-hasan/sme-software-frontend/commit/4a84cad93c4f969b8fd84235e2f42944a1bb5904))
* implement sys1101 component and corresponding model service ([db82f3e](https://github.com/asibul-hasan/sme-software-frontend/commit/db82f3e7962e1575333d47a17706d80d5af006c0))
* implement system configuration forms, logo upload component, and layout services ([f020c42](https://github.com/asibul-hasan/sme-software-frontend/commit/f020c4283a1a48bbb144ed877e0707e8f5be4f72))
* implement user management module with authentication services and employee mapping interface ([780fe8a](https://github.com/asibul-hasan/sme-software-frontend/commit/780fe8a7c0d1238a1ad39d62d879b4ecc319d0bf))
* implement user role-branch mapping and role-based menu permissions in database and application layers ([affd7aa](https://github.com/asibul-hasan/sme-software-frontend/commit/affd7aa84cd45eb1fdc97e915d07da97913a7e90))
* initialize web-client architecture with core services, shared AG-Grid components, and ERP-specific UI controls ([97ca1e5](https://github.com/asibul-hasan/sme-software-frontend/commit/97ca1e5b1e5a2d61c4bcccb3c35bae0c9ade9dc9))
* introduce AG Grid infrastructure and standard ERP action components ([ab96d78](https://github.com/asibul-hasan/sme-software-frontend/commit/ab96d7894f7ddd5ddd79a4d324d6ab08d3b4cc33))
* introduce system-wide data services and implement module-level business logic and forms ([39c68e1](https://github.com/asibul-hasan/sme-software-frontend/commit/39c68e1ed1f46a8009688d25ab52e5c85c27c554))
* **pms:** apply web-client sidebar design with tree lines, tooltips and no form IDs ([19ca5d8](https://github.com/asibul-hasan/sme-software-frontend/commit/19ca5d8d00e4e45b217ab30561e6f05099a84f7c))
* **pms:** complete Aidly PMS frontend application with 64 screens, shared theme, and API integration ([28cf09f](https://github.com/asibul-hasan/sme-software-frontend/commit/28cf09f2166f1b72906d9dc743db1f094177fac7))
* **pms:** consolidate navigation into 5 core modules with submodules ([c142e64](https://github.com/asibul-hasan/sme-software-frontend/commit/c142e64316b842fa36f419db63d4042500ed0da9))
* **pos:** mobile-first customer registration with duplicate check and name confirmation ([4abb078](https://github.com/asibul-hasan/sme-software-frontend/commit/4abb0785ff56e2ec9ffbee2c3548181126eaf819))
* **pos:** redesign right-side checkout drawer matching prototype UI ([4d3bf0d](https://github.com/asibul-hasan/sme-software-frontend/commit/4d3bf0dd71a7e8b6a9d9a8da2b574c311d093fe6))
* **pos:** replace payment titles with brand icons for bKash, Nagad, Rocket, and Upay ([09d2802](https://github.com/asibul-hasan/sme-software-frontend/commit/09d28027cd48618f95c559bed9142cdb46f44afe))
* **print:** executive A4 PDF reports and thermal receipts with anti-spill rules ([d47f270](https://github.com/asibul-hasan/sme-software-frontend/commit/d47f270dbea4a8f734166e888c21f36b2e4f9451))
* **products:** dynamic Excel import with lookup & find-or-create ([7b7cef0](https://github.com/asibul-hasan/sme-software-frontend/commit/7b7cef0f2c3af33a3498e0bb5985cc9dd8f9fdaf))
* **pur:** align purchase master top-row with purchase ID, date and layout parity ([99ffba5](https://github.com/asibul-hasan/sme-software-frontend/commit/99ffba5175799c0109ec3d7953caa47e73b5c21e))
* **pur:** manual-first batch entry with optional untracked internal auto-gen ([d73cf01](https://github.com/asibul-hasan/sme-software-frontend/commit/d73cf01eef50019125862a881ad8158473c894a3))
* **pur:** pos-style master-detail purchase entry with requisition linking ([c17e02a](https://github.com/asibul-hasan/sme-software-frontend/commit/c17e02a29afe54337f60a1613b03ce452df7ad66))
* **pur:** top-aligned master and payment summary with readonly purchase id ([4dbaa00](https://github.com/asibul-hasan/sme-software-frontend/commit/4dbaa0063568ef28d2a0d0c1d362998e2a184c38))
* **requisition:** link audit history to planner, edit and approval flow ([3ddc778](https://github.com/asibul-hasan/sme-software-frontend/commit/3ddc7784adb76441f5c0d84264c8f1d3ad3d14b2))
* scaffold core architecture and dashboard components for web-client application ([c70a046](https://github.com/asibul-hasan/sme-software-frontend/commit/c70a046d3c27057308b9ddd3ab42960bf1e41f62))
* scaffold core architecture and system feature modules with essential services, guards, and interceptors ([57614f1](https://github.com/asibul-hasan/sme-software-frontend/commit/57614f15b676ae0c5feaca9a73c28d9a4a1d9ec7))
* scaffold core authentication, feature modules, and shared UI components for the web client ([1fb7b33](https://github.com/asibul-hasan/sme-software-frontend/commit/1fb7b33dc733e413896df6bff5788f3f61fb0edf))
* scaffold core sidebar models and services for feature modules ([ce1908a](https://github.com/asibul-hasan/sme-software-frontend/commit/ce1908a348949c2c3a00e15f09a638ab8a317019))
* scaffold foundational feature modules, services, and components across HRM, FIN, PUR, and SAL modules ([41ec78b](https://github.com/asibul-hasan/sme-software-frontend/commit/41ec78ba11576bff96610b8099d63a4d0e85333e))
* **sidebar:** enhance menu service and UI for improved navigation ([c3b7547](https://github.com/asibul-hasan/sme-software-frontend/commit/c3b754787d0979ce8789377eeef147641b84e60f))
* **table:** enhance common table component with improved styling and functionality ([1a18ce1](https://github.com/asibul-hasan/sme-software-frontend/commit/1a18ce1311e8a18a4e4c63499c53683283f60e14))
* **tree-view:** add reusable tree view component with toolbar and search functionality ([9a9bb19](https://github.com/asibul-hasan/sme-software-frontend/commit/9a9bb198f525759bc65e071b0e2684c213fcf359))
* **ui:** implement action button handlers and dialog triggers across management pages ([6d87f51](https://github.com/asibul-hasan/sme-software-frontend/commit/6d87f5177134f1c67d7929a91bc813daa46fdf55))
* **ui:** unified semantic color-coded button design system and zero-wireframe styling ([b132bd7](https://github.com/asibul-hasan/sme-software-frontend/commit/b132bd729aab16ea019e3091577de3274e14b34d))

### 🐛 Bug Fixes

* **auth:** remove duplicate api/v1 prefix in login call ([c2de70c](https://github.com/asibul-hasan/sme-software-frontend/commit/c2de70c71cb8e0f6ff800d5f558b0f1e199ae884))
* **pos:** remove sales record delete button and enforce return-only flow ([efeca65](https://github.com/asibul-hasan/sme-software-frontend/commit/efeca65c273603794c44e9aa392b087b95358683))
* **print:** anchor thank-you section and footer to bottom of last page ([5182477](https://github.com/asibul-hasan/sme-software-frontend/commit/51824772e7b169cbe6afbb327379e603ced900a6))
* **print:** standard document printing without modal chrome ([d5883ad](https://github.com/asibul-hasan/sme-software-frontend/commit/d5883ada556f1b1def91d13e8f546beef08bbb29))
* update layout and styles in sys1108 component for better responsiveness ([1a4e907](https://github.com/asibul-hasan/sme-software-frontend/commit/1a4e907d1bbe0a26a940c15300b626a601dc2175))

### ♻️ Code Refactoring

* implement responsive main layout, establish global notification toast, and scaffold HRM/SYS form modules with supporting services ([d07162e](https://github.com/asibul-hasan/sme-software-frontend/commit/d07162e0973654e7da4568cd8552f5774da28968))
* migrate footer to Tailwind utilities ([4cc1750](https://github.com/asibul-hasan/sme-software-frontend/commit/4cc17500e296382d211f448688048ee021eddc5a))
* migrate forgot-password screen to Tailwind ([031018a](https://github.com/asibul-hasan/sme-software-frontend/commit/031018ab400cd49182626eca6aeeaa9eba28834a))
* migrate main-layout to Tailwind ([fcbfcbe](https://github.com/asibul-hasan/sme-software-frontend/commit/fcbfcbeb941edecea659f682ac2aca3d7fd1b02c))
* migrate register screen to Tailwind ([4f21d03](https://github.com/asibul-hasan/sme-software-frontend/commit/4f21d037dce56f61f792c626d21030723aa6453f))
* migrate sidebar to Tailwind + UI kit ([822995c](https://github.com/asibul-hasan/sme-software-frontend/commit/822995c99e29f2e8aa31686cf1062635055bd7c8))
* **pur,inv:** extract inline templates to dedicated html files ([fd3a568](https://github.com/asibul-hasan/sme-software-frontend/commit/fd3a56857ae39780944961a55f454a12f07aac17))
* **sales:** extract inline templates to dedicated html files ([909e46f](https://github.com/asibul-hasan/sme-software-frontend/commit/909e46fca3220ebd2c4eb54a198812aa6d55b90d))

### 📝 Documentation

* add GEMINI.md project memory and architecture guide ([14987c1](https://github.com/asibul-hasan/sme-software-frontend/commit/14987c131aafee1f9fb62dee56b1a48329d3bd5f))
* **memory:** document Conventional Commits enforcement in GEMINI.md ([6f137eb](https://github.com/asibul-hasan/sme-software-frontend/commit/6f137eb308439b8fbfe6b1e2ec807b6b915785e6))
* **memory:** update comprehensive master developer memory and account specs ([44cd6ec](https://github.com/asibul-hasan/sme-software-frontend/commit/44cd6ec1d5db620790cf55043fb6feb369f7fc74))

### 🤖 Continuous Integration

* **deploy:** add pms-deploy workflow for cpanel using pms ftp credentials ([9366b25](https://github.com/asibul-hasan/sme-software-frontend/commit/9366b254073963919fce1f37bb75946c17586090))
* **deploy:** auto-purge actions artifacts and caches on every workflow run ([d4a0b98](https://github.com/asibul-hasan/sme-software-frontend/commit/d4a0b98a39108c242d04f1acd856bc6285b6de8d))
* **git-hooks:** integrate conventional commits with commitlint and husky ([c2ea069](https://github.com/asibul-hasan/sme-software-frontend/commit/c2ea06960c524152e561b7426bb966583dacdfbf))
* **release:** add automated tagging and versioning workflow with commit-and-tag-version ([ae48cef](https://github.com/asibul-hasan/sme-software-frontend/commit/ae48cef2aa864706546b94adee00e30410eec18a))

### 🔧 Maintenance & Chores

* lock dependency versions to 21.1.3 in package.json ([2f3df62](https://github.com/asibul-hasan/sme-software-frontend/commit/2f3df6217100441dbc6d99898dbd4e88c237b150))
* pin Angular dependencies and devDependencies to version 21.1.3 ([825a77b](https://github.com/asibul-hasan/sme-software-frontend/commit/825a77becd85008738fe12269b6f20109b8efdd2))
* update UI, components, and routing ([592b0f7](https://github.com/asibul-hasan/sme-software-frontend/commit/592b0f7c8220922950f807360c142d092616f5d2))

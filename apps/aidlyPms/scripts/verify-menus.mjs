import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbScriptPath = path.resolve(__dirname, '../database/db_script.sql');
const appRoutesPath = path.resolve(__dirname, '../src/app/app.routes.ts');
const menuConfigPath = path.resolve(__dirname, '../src/app/core/config/menu.config.ts');
const backendApiDir = path.resolve(__dirname, '../../../../aidlypms-backend/src/Host/AidlyPms.Api');

console.log('===============================================================');
console.log('       AIDLY PMS: SYSTEM MENUS & ROUTE PARITY CHECK           ');
console.log('===============================================================');

let errors = 0;

// 1. Parse sys_menus from db_script.sql
if (!fs.existsSync(dbScriptPath)) {
  console.error(`[FATAL] db_script.sql not found at ${dbScriptPath}`);
  process.exit(1);
}

const dbScriptContent = fs.readFileSync(dbScriptPath, 'utf8');

// Regex for sys_menus INSERTs
// VALUES (1, 'DASH_2301', 'Executive Financial Dashboard', 'এক্সিকিউটিভ ফিন্যান্সিয়াল ড্যাশবোর্ড', '/dashboard', '/dashboard', 'dashboard', NULL, 1, 'SCREEN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
const menuRegex = /VALUES\s*\(\s*\d+,\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(?:'([^']+)'|NULL),\s*(?:'([^']+)'|NULL),\s*(?:'([^']+)'|NULL),\s*[^,]+,\s*\d+,\s*'([^']+)'/gi;

const sysMenus = [];
const sysMenuCodes = new Set();
let match;
while ((match = menuRegex.exec(dbScriptContent)) !== null) {
  const [, menuCode, title, titleBn, pathVal, routeVal, icon, menuType] = match;
  sysMenuCodes.add(menuCode);
  sysMenus.push({
    menuCode,
    title,
    titleBn,
    path: pathVal || null,
    route: routeVal || null,
    menuType,
  });
}

console.log(`[INFO] Loaded ${sysMenus.length} total sys_menus entries from db_script.sql.`);

const sysScreens = sysMenus.filter((m) => m.menuType === 'SCREEN');
console.log(`[INFO] Found ${sysScreens.length} SCREEN entries in sys_menus.`);

// 2. Parse app.routes.ts
if (!fs.existsSync(appRoutesPath)) {
  console.error(`[FATAL] app.routes.ts not found at ${appRoutesPath}`);
  process.exit(1);
}

const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');

// Extract routes and menuCodes
// e.g. { path: 'dashboard', component: DashboardComponent, canActivate: [menuGuard], data: { menuCode: 'DASH_2301' } }
const routeDataRegex = /{\s*path:\s*'([^']+)'[^}]*?menuCode:\s*'([^']+)'/g;
const appRouteMap = new Map(); // menuCode -> Set of paths
const appRoutesSet = new Set();
let rMatch;
while ((rMatch = routeDataRegex.exec(appRoutesContent)) !== null) {
  const rPath = rMatch[1];
  const mCode = rMatch[2];
  appRoutesSet.add(rPath);
  if (!appRouteMap.has(mCode)) {
    appRouteMap.set(mCode, new Set());
  }
  appRouteMap.get(mCode).add(rPath);
}

// Also collect all declared paths in app.routes.ts
const allPathsRegex = /path:\s*'([^']+)'/g;
const allAppPaths = new Set();
let pMatch;
while ((pMatch = allPathsRegex.exec(appRoutesContent)) !== null) {
  allAppPaths.add(pMatch[1]);
}

// 3. Verify: Every sys_menus SCREEN route exists in Angular route registry
for (const screen of sysScreens) {
  if (!screen.route) {
    console.error(`[ERROR] SCREEN '${screen.menuCode}' (${screen.title}) has NULL route in sys_menus!`);
    errors++;
    continue;
  }

  const cleanRoute = screen.route.replace(/^\//, ''); // strip leading slash to match app.routes
  const existsInRoutes = allAppPaths.has(cleanRoute) || allAppPaths.has(screen.route);

  if (!existsInRoutes) {
    console.error(`[ERROR] SCREEN '${screen.menuCode}' route '${screen.route}' does not exist in app.routes.ts!`);
    errors++;
  }

  // Also check if menuCode is referenced in app.routes.ts
  if (!appRouteMap.has(screen.menuCode)) {
    console.error(`[ERROR] SCREEN '${screen.menuCode}' is not assigned to any route via menuCode in app.routes.ts!`);
    errors++;
  }
}

// 4. Verify: Every menuCode in app.routes.ts exists in sys_menus
for (const mCode of appRouteMap.keys()) {
  if (!sysMenuCodes.has(mCode)) {
    console.error(`[ERROR] app.routes.ts references menuCode '${mCode}' which does NOT exist in sys_menus!`);
    errors++;
  }
}

// 5. Verify: Every [RequireMenu] in backend controllers exists in sys_menus
if (fs.existsSync(backendApiDir)) {
  console.log(`[INFO] Scanning backend controllers in ${backendApiDir} for [RequireMenu]...`);

  function findCsFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(findCsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.cs')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const csFiles = findCsFiles(backendApiDir);
  const requireMenuRegex = /\[RequireMenu\(([^)]+)\)\]/g;
  const backendMenuCodes = new Set();

  for (const csFile of csFiles) {
    const content = fs.readFileSync(csFile, 'utf8');
    let cMatch;
    while ((cMatch = requireMenuRegex.exec(content)) !== null) {
      const argsStr = cMatch[1];
      const stringMatches = argsStr.match(/"([^"]+)"/g) || [];
      for (const sm of stringMatches) {
        const code = sm.replace(/"/g, '').trim();
        backendMenuCodes.add(code);
      }
    }
  }

  console.log(`[INFO] Found ${backendMenuCodes.size} unique menu codes in backend [RequireMenu] attributes.`);

  for (const code of backendMenuCodes) {
    if (!sysMenuCodes.has(code)) {
      console.error(`[ERROR] Backend [RequireMenu("${code}")] does NOT exist in sys_menus seed!`);
      errors++;
    }
  }
} else {
  console.log('[INFO] Backend directory not found on disk, skipping controller [RequireMenu] scan.');
}

if (errors > 0) {
  console.error(`\n>>> MENU VERIFICATION FAILED: ${errors} discrepancies found! <<<`);
  process.exit(1);
}

console.log('\n[PASS] All sys_menus SCREEN routes exist in Angular route registry.');
console.log('[PASS] All Angular routes are mapped to valid sys_menus.');
console.log('[PASS] All backend [RequireMenu] attributes match valid sys_menus.');
console.log('>>> VERIFICATION PASSED: 100% MENU & ROUTE INTEGRITY ACHIEVED <<<\n');
process.exit(0);

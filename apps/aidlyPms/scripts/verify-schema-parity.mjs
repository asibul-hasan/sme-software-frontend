import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaSqlPath = path.resolve(__dirname, '../database/schema.sql');
const dbScriptSqlPath = path.resolve(__dirname, '../database/db_script.sql');

function parseSqlTables(filePath) {
  let sql = fs.readFileSync(filePath, 'utf16le');
  if (!sql.includes('CREATE TABLE')) {
    sql = fs.readFileSync(filePath, 'utf8');
  }

  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
  let match;
  const tables = {};
  while ((match = regex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const lines = body.split('\n');
    const cols = [];
    for (let l of lines) {
      l = l.trim();
      if (
        !l ||
        l.startsWith('--') ||
        l.startsWith('CONSTRAINT') ||
        l.startsWith('PRIMARY KEY') ||
        l.startsWith('FOREIGN KEY') ||
        l.startsWith('UNIQUE') ||
        l.startsWith('CHECK')
      ) {
        continue;
      }
      const colMatch = l.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+(\([^)]+\))?)/);
      if (colMatch) {
        cols.push({ name: colMatch[1], type: colMatch[2] });
      }
    }
    tables[tableName] = cols;
  }
  return tables;
}

const schemaTables = parseSqlTables(schemaSqlPath);
const dbScriptTables = parseSqlTables(dbScriptSqlPath);

console.log('===============================================================');
console.log('   AIDLY PMS: POSTGRESQL SCHEMA & DB SCRIPT PARITY CHECK       ');
console.log('===============================================================');

let syncErrors = 0;
const allTableNames = new Set([...Object.keys(schemaTables), ...Object.keys(dbScriptTables)]);

for (const tableName of allTableNames) {
  const schemaCols = (schemaTables[tableName] || []).map(c => c.name);
  const dbScriptCols = (dbScriptTables[tableName] || []).map(c => c.name);

  if (!schemaTables[tableName]) {
    console.error(`[SYNC FAIL] Table '${tableName}' is missing from schema.sql`);
    syncErrors++;
    continue;
  }
  if (!dbScriptTables[tableName]) {
    console.error(`[SYNC FAIL] Table '${tableName}' is missing from db_script.sql`);
    syncErrors++;
    continue;
  }

  const inSchemaNotScript = schemaCols.filter(c => !dbScriptCols.includes(c));
  const inScriptNotSchema = dbScriptCols.filter(c => !schemaCols.includes(c));

  if (inSchemaNotScript.length > 0 || inScriptNotSchema.length > 0) {
    console.error(`[SYNC FAIL] Table '${tableName}' column mismatch:`);
    if (inSchemaNotScript.length) console.error(`  - In schema.sql but missing in db_script.sql: ${inSchemaNotScript.join(', ')}`);
    if (inScriptNotSchema.length) console.error(`  - In db_script.sql but missing in schema.sql: ${inScriptNotSchema.join(', ')}`);
    syncErrors++;
  }
}

if (syncErrors > 0) {
  console.error(`>>> PARITY FAILED: schema.sql and db_script.sql have ${syncErrors} discrepancies! <<<`);
  process.exit(1);
} else {
  console.log(`[PASS] schema.sql and db_script.sql are 100% synchronized (${allTableNames.size} tables).`);
}

console.log('===============================================================');
console.log('   AIDLY PMS: POSTGRESQL SCHEMA FIELD-TO-FIELD VERIFICATION   ');
console.log('===============================================================');

const modelsDir = path.resolve(__dirname, '../src/app/core/models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.models.ts'));
let allModelsContent = '';
for (const f of files) {
  allModelsContent += fs.readFileSync(path.join(modelsDir, f), 'utf8') + '\n';
}

let totalTables = 0;
let totalFields = 0;
let missingFieldsCount = 0;
const results = [];

for (const [table, cols] of Object.entries(schemaTables)) {
  totalTables++;
  const missingCols = [];
  for (const col of cols) {
    totalFields++;
    const hasCol =
      allModelsContent.includes(col.name + ':') ||
      allModelsContent.includes(col.name + '?:');
    if (!hasCol) {
      missingCols.push(col.name);
      missingFieldsCount++;
    }
  }
  if (missingCols.length > 0) {
    results.push({ table, count: cols.length, status: 'FAIL', missing: missingCols });
  } else {
    results.push({ table, count: cols.length, status: 'PASS' });
  }
}

for (const r of results) {
  if (r.status === 'PASS') {
    console.log(`[PASS] ${r.table.padEnd(35)} (${r.count} fields verified)`);
  } else {
    console.log(`[FAIL] ${r.table.padEnd(35)} MISSING: ${r.missing.join(', ')}`);
  }
}

console.log('---------------------------------------------------------------');
console.log(`Total Tables Verified : ${totalTables}`);
console.log(`Total Schema Columns  : ${totalFields}`);
console.log(`Missing Fields Found  : ${missingFieldsCount}`);
console.log('---------------------------------------------------------------');

if (missingFieldsCount > 0) {
  console.error(`>>> VERIFICATION FAILED: ${missingFieldsCount} fields missing! <<<`);
  process.exit(1);
}

console.log('===============================================================');
console.log('   AIDLY PMS: DATABASE MIGRATIONS PARITY CHECK                 ');
console.log('===============================================================');

const frontendMigrationsDir = path.resolve(__dirname, '../database/migrations');
const backendMigrationsDir = path.resolve(__dirname, '../../../../aidlypms-backend/database/migrations');

if (fs.existsSync(backendMigrationsDir) && fs.existsSync(frontendMigrationsDir)) {
  const feFiles = fs.readdirSync(frontendMigrationsDir).filter(f => f.endsWith('.sql')).sort();
  const beFiles = fs.readdirSync(backendMigrationsDir).filter(f => f.endsWith('.sql')).sort();

  let migErrors = 0;
  if (feFiles.length !== beFiles.length) {
    console.error(`[MIGRATION MISMATCH] Frontend has ${feFiles.length} migrations, but Backend has ${beFiles.length} migrations!`);
    migErrors++;
  }

  const allMigFiles = new Set([...feFiles, ...beFiles]);
  for (const f of allMigFiles) {
    if (!feFiles.includes(f)) {
      console.error(`[MIGRATION MISSING] File '${f}' exists in Backend migrations but is missing in Frontend migrations.`);
      migErrors++;
    } else if (!beFiles.includes(f)) {
      console.error(`[MIGRATION MISSING] File '${f}' exists in Frontend migrations but is missing in Backend migrations.`);
      migErrors++;
    } else {
      const feContent = fs.readFileSync(path.join(frontendMigrationsDir, f), 'utf8').trim();
      const beContent = fs.readFileSync(path.join(backendMigrationsDir, f), 'utf8').trim();
      if (feContent !== beContent) {
        console.error(`[MIGRATION CONTENT MISMATCH] Migration '${f}' differs between Backend and Frontend copies!`);
        migErrors++;
      }
    }
  }

  if (migErrors > 0) {
    console.error(`>>> MIGRATION PARITY FAILED: ${migErrors} discrepancies found! <<<`);
    process.exit(1);
  } else {
    console.log(`[PASS] database/migrations are 100% in parity (${feFiles.length} migration files verified).`);
  }
} else {
  console.log('[INFO] Sibling backend repository not detected on disk. Migrations check deferred to CI pipeline.');
}

// Run menu & route integrity check
const verifyMenusScript = path.resolve(__dirname, 'verify-menus.mjs');
if (fs.existsSync(verifyMenusScript)) {
  const { execSync } = await import('node:child_process');
  try {
    execSync(`node "${verifyMenusScript}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error('>>> MENU & ROUTE INTEGRITY CHECK FAILED <<<');
    process.exit(1);
  }
}

console.log('>>> VERIFICATION PASSED: 100% FIELD-TO-FIELD, MIGRATION & MENU PARITY ACHIEVED <<<');
process.exit(0);


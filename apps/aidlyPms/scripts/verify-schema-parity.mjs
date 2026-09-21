import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../database/db_script.sql');

let sql = fs.readFileSync(sqlPath, 'utf16le');
if (!sql.includes('CREATE TABLE')) {
  sql = fs.readFileSync(sqlPath, 'utf8');
}

const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
let match;
const dbSchema = {};
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
  dbSchema[tableName] = cols;
}

const modelsDir = path.resolve(__dirname, '../src/app/core/models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.models.ts'));
let allModelsContent = '';
for (const f of files) {
  allModelsContent += fs.readFileSync(path.join(modelsDir, f), 'utf8') + '\n';
}

console.log('===============================================================');
console.log('   AIDLY PMS: POSTGRESQL SCHEMA FIELD-TO-FIELD VERIFICATION   ');
console.log('===============================================================');

let totalTables = 0;
let totalFields = 0;
let missingFieldsCount = 0;
const results = [];

for (const [table, cols] of Object.entries(dbSchema)) {
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

if (missingFieldsCount === 0) {
  console.log('>>> VERIFICATION PASSED: 100% FIELD-TO-FIELD PARITY ACHIEVED <<<');
  process.exit(0);
} else {
  console.error(`>>> VERIFICATION FAILED: ${missingFieldsCount} fields missing! <<<`);
  process.exit(1);
}

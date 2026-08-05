const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Asibul\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// Check all directories to find the project
console.log("=== ALL DISTINCT DIRECTORIES ===");
const dirs = db.prepare(`
  SELECT DISTINCT substr(directory, 1, 120) as dir, COUNT(*) as cnt
  FROM session
  GROUP BY substr(directory, 1, 120)
  ORDER BY cnt DESC
  LIMIT 30
`).all();
dirs.forEach(r => console.log(r.cnt + ' | ' + r.dir));

// Check recent sessions globally
console.log("\n=== MOST RECENT 20 SESSIONS GLOBALLY ===");
const recent = db.prepare(`
  SELECT id, title, substr(directory, 1, 80) as dir, time_created
  FROM session
  ORDER BY time_created DESC
  LIMIT 20
`).all();
recent.forEach(r => console.log(r.time_created + ' | ' + r.id + ' | ' + (r.title || '').substring(0, 60) + ' | ' + r.dir));

db.close();

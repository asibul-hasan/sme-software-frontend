const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Asibul\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// List recent sessions for this project
console.log("=== RECENT SESSIONS (sme-software-frontend) ===");
const sessions = db.prepare(`
  SELECT id, title, substr(directory, 1, 100) as dir, time_created 
  FROM session 
  WHERE directory LIKE '%sme-software-frontend%' 
  ORDER BY time_created DESC 
  LIMIT 20
`).all();
sessions.forEach(r => console.log(r.time_created + ' | ' + r.id + ' | ' + (r.title || '').substring(0, 80)));

// Count messages per session
console.log("\n=== MESSAGE COUNTS PER SESSION ===");
const counts = db.prepare(`
  SELECT m.session_id, COUNT(*) as msg_count, 
         MIN(m.time_created) as first_msg, MAX(m.time_created) as last_msg
  FROM message m
  JOIN session s ON s.id = m.session_id
  WHERE s.directory LIKE '%sme-software-frontend%'
  GROUP BY m.session_id
  ORDER BY last_msg DESC
  LIMIT 20
`).all();
counts.forEach(r => console.log(r.session_id + ' | msgs: ' + r.msg_count + ' | ' + r.first_msg + ' to ' + r.last_msg));

db.close();

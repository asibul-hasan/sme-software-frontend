const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Asibul\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// Search for user messages containing rules/decisions keywords in recent sessions
console.log("=== USER MESSAGES WITH RULES/DECISIONS KEYWORDS ===");
const rules = db.prepare(`
  SELECT s.id as session_id, s.title, m.time_created,
         substr(json_extract(p.data, '$.text'), 1, 300) as text_preview
  FROM session s
  JOIN message m ON m.session_id = s.id
  JOIN part p ON p.message_id = m.id
  WHERE s.directory LIKE '%aidlyErp%'
    AND json_extract(m.data, '$.role') = 'user'
    AND json_extract(p.data, '$.type') = 'text'
    AND (
      json_extract(p.data, '$.text') LIKE '%always%' OR
      json_extract(p.data, '$.text') LIKE '%never%' OR
      json_extract(p.data, '$.text') LIKE '%remember%' OR
      json_extract(p.data, '$.text') LIKE '%rule%' OR
      json_extract(p.data, '$.text') LIKE '%decision%' OR
      json_extract(p.data, '$.text') LIKE '%decided%' OR
      json_extract(p.data, '$.text') LIKE '%tradeoff%' OR
      json_extract(p.data, '$.text') LIKE '%repeat%' OR
      json_extract(p.data, '$.text') LIKE '%every time%' OR
      json_extract(p.data, '$.text') LIKE '%workflow%'
    )
  ORDER BY m.time_created DESC
  LIMIT 30
`).all();
rules.forEach(r => {
  console.log('---');
  console.log('Session: ' + r.session_id + ' | ' + (r.title || '').substring(0, 50));
  console.log('Time: ' + r.time_created);
  console.log('Text: ' + (r.text_preview || '').substring(0, 300));
});

db.close();

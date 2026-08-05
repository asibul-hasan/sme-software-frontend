const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Asibul\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// Get AG Grid session user messages (first and last few)
console.log("=== AG GRID SESSION USER MESSAGES (first 5 + last 5) ===");
const agmsgs = db.prepare(`
  SELECT m.time_created,
         substr(json_extract(p.data, '$.text'), 1, 400) as text_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_031d783fcffemoMI5QBt9Q3U7b'
    AND json_extract(m.data, '$.role') = 'user'
    AND json_extract(p.data, '$.type') = 'text'
    AND json_extract(p.data, '$.text') NOT LIKE '%checkpoint-writer%'
    AND json_extract(p.data, '$.text') NOT LIKE '%Skill search trigger%'
    AND json_extract(p.data, '$.text') NOT LIKE '%system-reminder%'
  ORDER BY m.time_created
`).all();
// Show first 3 and last 3
const filtered = agmsgs.filter(r => (r.text_preview || '').length > 50);
console.log("Total user messages: " + filtered.length);
filtered.slice(0, 3).forEach(r => {
  console.log('---');
  console.log('Time: ' + r.time_created);
  console.log('Text: ' + (r.text_preview || '').substring(0, 400));
});
console.log("...");
filtered.slice(-3).forEach(r => {
  console.log('---');
  console.log('Time: ' + r.time_created);
  console.log('Text: ' + (r.text_preview || '').substring(0, 400));
});

// Check for the AG Grid session's assistant tool calls to understand what was built
console.log("\n=== AG GRID SESSION - FILES EDITED ===");
const edited = db.prepare(`
  SELECT DISTINCT json_extract(p.data, '$.state.input.file_path') as file_path
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_031d783fcffemoMI5QBt9Q3U7b'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'edit'
    AND json_extract(p.data, '$.state.input.file_path') IS NOT NULL
  ORDER BY file_path
`).all();
edited.forEach(r => console.log(r.file_path));

db.close();

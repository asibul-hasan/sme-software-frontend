const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('C:\\Users\\Asibul\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// Get the most recent user messages from the refresh token session
console.log("=== REFRESH TOKEN SESSION (ses_031d5a7a2ffe4qunirbW0RHhCb) USER MESSAGES ===");
const refreshmsgs = db.prepare(`
  SELECT m.time_created,
         substr(json_extract(p.data, '$.text'), 1, 500) as text_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_031d5a7a2ffe4qunirbW0RHhCb'
    AND json_extract(m.data, '$.role') = 'user'
    AND json_extract(p.data, '$.type') = 'text'
  ORDER BY m.time_created
`).all();
refreshmsgs.forEach(r => {
  console.log('---');
  console.log('Time: ' + r.time_created);
  console.log('Text: ' + (r.text_preview || '').substring(0, 500));
});

// Get assistant messages with tool calls from the same session
console.log("\n=== REFRESH TOKEN SESSION - ASSISTANT TOOL CALLS ===");
const tools = db.prepare(`
  SELECT m.time_created,
         json_extract(p.data, '$.tool') as tool_name,
         substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id = 'ses_031d5a7a2ffe4qunirbW0RHhCb'
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
  ORDER BY m.time_created
`).all();
tools.forEach(r => {
  console.log(r.tool_name + ': ' + (r.input_preview || '').substring(0, 150));
});

db.close();

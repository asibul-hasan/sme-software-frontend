/**
 * Fixes upstream NG-ZORRO v21.3.3 ChangeDetectionStrategy.Eager artifact
 * which Angular 21's compiler does not support.
 */
const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-modal.mjs',
  'node_modules/ng-zorro-antd/fesm2022/ng-zorro-antd-tabs.mjs',
];

for (const relPath of files) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('ChangeDetectionStrategy.Eager')) {
      content = content.replaceAll('ChangeDetectionStrategy.Eager', 'ChangeDetectionStrategy.Default');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`[patch-ng-zorro] Successfully patched ${relPath}`);
    }
  }
}

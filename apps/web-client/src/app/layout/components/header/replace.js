const fs = require('fs');

const htmlPath = 'c:\\pridesys\\apps\\sme\\sme-software-frontend\\apps\\web-client\\src\\app\\layout\\components\\header\\header.component.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Remove redundant top-btn icon inline styles
html = html.replace(/<mat-icon style="font-size: 18px; width: 18px; height: 18px"\s*>/g, '<mat-icon>');
html = html.replace(/<mat-icon style="font-size: 17px; width: 17px; height: 17px"\s*>/g, '<mat-icon>');
html = html.replace(/<mat-icon style="font-size: 17px; width: 17px; height: 17px">\s*(.*?)\s*<\/mat-icon>/g, '<mat-icon>$1</mat-icon>');

// Clean up user-card branch switch
html = html.replace(/style="height: 32px; width: 150px"/g, 'class="branch-sw"');
html = html.replace(/<mat-icon\s+style="\s*font-size: 14px;\s*width: 14px;\s*height: 14px;\s*color: var\(--indigo\);\s*flex-shrink: 0;\s*"\s*>/g, '<mat-icon class="branch-icon">');
html = html.replace(/<div class="user-name text-truncate" style="font-size: 11px">/g, '<div class="user-name text-truncate">');
html = html.replace(/<mat-icon\s+style="\s*font-size: 14px;\s*width: 14px;\s*height: 14px;\s*color: var\(--text-3\);\s*margin-left: 2px;\s*flex-shrink: 0;\s*"\s*>/g, '<mat-icon class="chevron-icon">');
html = html.replace(/<mat-icon\s+style="\s*font-size: 14px;\s*width: 14px;\s*height: 14px;\s*color: var\(--text-3\);\s*margin-left: 2px;\s*"\s*>/g, '<mat-icon class="chevron-icon">');


html = html.replace(/<mat-menu #branchMenu="matMenu">/g, '<mat-menu #branchMenu="matMenu" class="custom-mat-menu">');

// Clean up profile tabs inline styles
html = html.replace(/<mat-icon\s+style="\s*font-size: 16px;\s*width: 16px;\s*height: 16px;\s*margin-right: 4px;\s*vertical-align: middle;\s*"\s*>/g, '<mat-icon class="tab-icon">');

// Remove font-size: 16px wrapper
html = html.replace(/<div class="profile-menu-list pb-2" style="font-size: 16px">/g, '<div class="profile-menu-list pb-2">');

fs.writeFileSync(htmlPath, html);

const scssPath = 'c:\\pridesys\\apps\\sme\\sme-software-frontend\\apps\\web-client\\src\\app\\layout\\components\\header\\header.component.scss';
let scss = fs.readFileSync(scssPath, 'utf8');

const scssAppend = `
/* ── Single Source Menu Styles ── */
::ng-deep .custom-mat-menu {
  min-width: 180px !important;
  .mat-mdc-menu-content {
    padding: 8px 0 !important;
  }
  .mat-mdc-menu-item {
    font-size: 13.5px !important;
    min-height: 36px !important;
    padding: 0 16px !important;
    color: var(--text-2);

    mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      line-height: 18px !important;
      margin-right: 8px !important;
    }
  }
  
  .mat-mdc-option-active, .mdc-list-item--selected, .mat-mdc-menu-item:hover {
    background: var(--glass-b) !important;
    color: var(--text) !important;
  }
}

.branch-sw {
  height: 32px; 
  width: 150px;
}
.branch-icon {
  font-size: 15px; width: 15px; height: 15px; color: var(--indigo); flex-shrink: 0;
}
.chevron-icon {
  font-size: 16px; width: 16px; height: 16px; color: var(--text-3); margin-left: auto; flex-shrink: 0;
}
.tab-icon {
  font-size: 16px; width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;
}
`;

scss += scssAppend;

fs.writeFileSync(scssPath, scss);

console.log('done');

import { ColumnDef } from '../../../../shared/components/common-table';
import {
  PdfTemplateSection,
  PdfReportContext,
} from '../../../../shared/pdf-templates';

export interface CoaReportContext {
  currency_code: string;
  rows: CoaRow[];
}

export interface CoaRow {
  account_group_name: string;
  account_code: string;
  account_name: string;
  control_type?: number | null;
  control_type_label?: string;
  is_postable?: number | null;
}

export const controlTypeShortCode = (ct?: number | null): string => {
  switch (ct) {
    case 1:
      return 'AR';
    case 2:
      return 'AP';
    case 3:
      return 'BNK';
    case 4:
      return 'CSH';
    case 5:
      return 'INV';
    case 6:
      return 'TAX';
    case 7:
      return 'RE';
    default:
      return '';
  }
};

// ─── Group rows by account_group_name ───────────────────────────────────────────
function groupByAccountGroup(rows: CoaRow[]): Map<string, CoaRow[]> {
  const map = new Map<string, CoaRow[]>();
  for (const row of rows) {
    const key = row.account_group_name || 'Uncategorized';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return map;
}

// ─── Template Context Builder ───────────────────────────────────────────────────
export function buildCoaReportContext(context: CoaReportContext): PdfReportContext {
  const sections: PdfTemplateSection[] = [];

  if (context.rows.length === 0) {
    sections.push({
      type: 'text',
      text: 'No accounts found.',
      align: 'center',
    });
  } else {
    // ── Custom draw: grouped COA table ────────────────────────────────────
    sections.push({
      type: 'custom',
      draw: (
        doc: any,
        startY: number,
        pageWidth: number,
        marginX: number,
        helpers: { drawHeader: () => void; drawPageFooter: () => void },
      ) => {
        const grouped = groupByAccountGroup(context.rows);
        const groups = Array.from(grouped.entries());

        // Column widths (portrait A4 ≈ 210mm wide, margins 12mm each = 186mm usable)
        const colWidths = [40, 85, 25, 36]; // Acc.No | Description | Currency | Special Acc.Type
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const scale = (pageWidth - marginX * 2) / totalWidth;
        const scaled = colWidths.map((w) => w * scale);
        const colX = [0];
        for (let i = 0; i < scaled.length - 1; i++) {
          colX.push(colX[i] + scaled[i]);
        }
        const tableLeft = marginX;
        const tableRight = pageWidth - marginX;

        let y = startY;
        const lineHeight = 5.5;
        const headerHeight = 7;
        const groupHeight = 7;
        const rowHeight = 5.5;
        const pageBottom = doc.internal.pageSize.getHeight() - 28;
        const headerBottom = 48; // from standard header

        interface TreeNode {
          id: string;
          name: string;
          depth: number;
          children: Map<string, TreeNode>;
          accounts: CoaRow[];
        }

        const rootNode: TreeNode = {
          id: '',
          name: 'Root',
          depth: -1,
          children: new Map(),
          accounts: [],
        };

        context.rows.forEach((r) => {
          const pathStr = r.account_group_name || '|Uncategorized';
          const parts = pathStr.split(' > ');
          let current = rootNode;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const pipeIdx = part.indexOf('|');
            const gId = pipeIdx > -1 ? part.substring(0, pipeIdx) : '';
            const gName = pipeIdx > -1 ? part.substring(pipeIdx + 1) : part;
            
            const key = gId + '|' + gName;
            if (!current.children.has(key)) {
              current.children.set(key, {
                id: gId,
                name: gName,
                depth: i,
                children: new Map(),
                accounts: [],
              });
            }
            current = current.children.get(key)!;
          }
          current.accounts.push(r);
        });

        type RowItem =
          | { type: 'group'; id: string; name: string; depth: number }
          | { type: 'account'; data: CoaRow; depth: number };

        const flattened: RowItem[] = [];
        const flattenNode = (node: TreeNode) => {
          if (node.name !== 'Root') {
            flattened.push({ type: 'group', id: node.id, name: node.name, depth: node.depth });
          }
          for (const acc of node.accounts) {
            flattened.push({
              type: 'account',
              data: acc,
              depth: node.name === 'Root' ? 0 : node.depth + 1,
            });
          }
          for (const child of node.children.values()) {
            flattenNode(child);
          }
        };
        flattenNode(rootNode);

        // Draw table header row
        const drawTableHeader = () => {
          doc.setFillColor(241, 245, 249);
          doc.rect(tableLeft, y, tableRight - tableLeft, headerHeight, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.line(tableLeft, y, tableRight, y);
          doc.line(tableLeft, y + headerHeight, tableRight, y + headerHeight);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          const headers = [
            'Acc. No.',
            'Description',
            'Currency',
            'Special Acc. Type',
          ];
          headers.forEach((h: string, i: number) => {
            doc.text(h, tableLeft + colX[i] + 2, y + 5);
          });
          return headerHeight;
        };

        y += drawTableHeader();

        for (let idx = 0; idx < flattened.length; idx++) {
          const item = flattened[idx];

          if (y + rowHeight > pageBottom) {
            doc.addPage();
            helpers.drawHeader();
            helpers.drawPageFooter();
            y = headerBottom + 6;
            y += drawTableHeader();
          }

          if (item.type === 'group') {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);

            // Group background row
            doc.setFillColor(248, 250, 252);
            doc.rect(tableLeft, y, tableRight - tableLeft, rowHeight, 'F');

            // Draw grid lines
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.1);
            for (let i = 1; i < colX.length; i++) {
              doc.line(tableLeft + colX[i], y, tableLeft + colX[i], y + rowHeight);
            }
            doc.line(tableLeft, y, tableLeft, y + rowHeight);
            doc.line(tableRight, y, tableRight, y + rowHeight);

            // Print group account code in the Acc. No. column
            if (item.id) {
              doc.text(item.id, tableLeft + colX[0] + 2, y + 4);
            }

            // Indent based on depth
            const indent = item.depth * 3;
            doc.text(item.name.toUpperCase(), tableLeft + colX[1] + 2 + indent, y + 4);
            y += rowHeight;
          } else {
            const account = item.data;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);

            // Draw grid lines
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.1);
            for (let i = 1; i < colX.length; i++) {
              doc.line(tableLeft + colX[i], y, tableLeft + colX[i], y + rowHeight);
            }
            doc.line(tableLeft, y, tableLeft, y + rowHeight);
            doc.line(tableRight, y, tableRight, y + rowHeight);

            // Account code
            doc.text(account.account_code, tableLeft + colX[0] + 2, y + 4);

            // Indent account name
            const indent = item.depth * 3;
            doc.text(account.account_name, tableLeft + colX[1] + 2 + indent, y + 4);

            // Currency
            doc.text(context.currency_code, tableLeft + colX[2] + 2, y + 4);

            // Special account type
            const shortCode = controlTypeShortCode(account.control_type);
            if (shortCode) {
              doc.text(shortCode, tableLeft + colX[3] + 2, y + 4);
            }

            y += rowHeight;
          }
        }

        // Bottom border line
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.line(tableLeft, y, tableRight, y);

        return y + 4;
      },
    });
  }

  return {
    module: 'FIN',
    formId: 'FIN_1001',
    title: 'Chart of Accounts',
    fileName: 'chart-of-accounts',
    orientation: 'portrait',
    showSignatures: true,
    showPageFooter: true,
    subTitle: `Currency: ${context.currency_code}`,
    sections,
  };
}

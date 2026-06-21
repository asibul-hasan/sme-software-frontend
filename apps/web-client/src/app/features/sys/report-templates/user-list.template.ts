import { ColumnDef } from '../../../shared/components/common-table';
import {
  PdfSummaryRow, PdfTemplate, PdfTemplateSection,
} from '../../../shared/pdf-templates';

// ─── Context Shape ──────────────────────────────────────────────────────────────
export interface UserListReportContext {
  generatedAt: string;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  rows: UserListRow[];
}

export interface UserListRow {
  user_id: string;
  user_name: string;
  email: string;
  access_scope: number;
  role_name: string;
  branch_name: string;
  is_active: number;
  last_login_at: string;
}

// ─── Columns ────────────────────────────────────────────────────────────────────
const userListColumns: ColumnDef[] = [
  { title: 'User ID', field: 'user_id', width: '110px', cellType: 'text', pin: 'left' },
  { title: 'Name', field: 'user_name', width: '160px', cellType: 'text' },
  { title: 'Email', field: 'email', width: '180px', cellType: 'text' },
  { title: 'Role', field: 'role_name', width: '120px', cellType: 'text' },
  { title: 'Branch', field: 'branch_name', width: '120px', cellType: 'text' },
  {
    title: 'Status',
    field: 'is_active',
    width: '80px',
    cellType: 'badge',
    badgeConfig: (v: any) =>
      v === 1 ? { label: 'Active', variant: 'success' } : { label: 'Inactive', variant: 'neutral' },
  },
  { title: 'Last Login', field: 'last_login_at', width: '130px', cellType: 'date', dateFormat: 'dd/MM/yyyy HH:mm' },
];

// ─── Template ─────────────────────────────────────────────────────────────────
export const userListReportTemplate: PdfTemplate<UserListReportContext> = {
  id: 'SYS.user-list',
  module: 'SYS',
  formId: 'SYS_1101',
  title: 'User Management Report',
  fileName: 'user-list',
  orientation: 'portrait',
  showSignatures: false,
  showPageFooter: true,

  buildSubTitle(context: UserListReportContext): string {
    return `Generated: ${context.generatedAt}   |   Total Users: ${context.totalUsers}`;
  },

  buildSections(context: UserListReportContext): PdfTemplateSection[] {
    const sections: PdfTemplateSection[] = [
      { type: 'title', text: 'User List Report', align: 'center', fontSize: 13 },
      { type: 'spacer', height: 2 },
      { type: 'separator' },
      { type: 'spacer', height: 3 },
    ];

    // Summary cards at top
    const summaryRows: PdfSummaryRow[] = [
      { label: 'Total Users', value: context.totalUsers },
      { label: 'Active Users', value: context.activeUsers },
      { label: 'Inactive Users', value: context.inactiveUsers },
      { label: 'Active %', value: context.totalUsers ? `${((context.activeUsers / context.totalUsers) * 100).toFixed(1)}%` : '0%' },
    ];

    sections.push({
      type: 'summary',
      title: 'Summary',
      columnsPerRow: 4,
      rows: summaryRows,
    });

    sections.push({ type: 'spacer', height: 4 });

    if (context.rows.length === 0) {
      sections.push({ type: 'text', text: 'No users found for the selected criteria.', align: 'center' });
      return sections;
    }

    sections.push({
      type: 'table',
      title: 'User Details',
      columns: userListColumns,
      rows: context.rows as unknown as Record<string, unknown>[],
      showRowNumbers: true,
    });

    return sections;
  },
};

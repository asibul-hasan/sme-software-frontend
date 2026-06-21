import { ColumnDef } from '../../../../shared/components/common-table';

export interface ReportSection<Row = Record<string, unknown>> {
  title: string;
  rows: Row[];
}

export interface PdfReportTemplate<Context, Row = Record<string, unknown>> {
  id: string;
  module: 'HRM';
  formId: string;
  title: string;
  fileName: string;
  columns: ColumnDef[];
  buildRows(context: Context): Row[];
  buildSections?(context: Context): ReportSection<Row>[];
}

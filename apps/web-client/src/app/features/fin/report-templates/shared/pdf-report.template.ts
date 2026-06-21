import { PdfTemplate } from '../../../../shared/pdf-templates';
import { PdfReportContext } from './pdf-report-template.types';

export const pdfReportTemplate: PdfTemplate<PdfReportContext> = {
  id: 'FIN.generic-report',
  module: (ctx) => ctx.module,
  formId: (ctx) => ctx.formId,
  title: (ctx) => ctx.title,
  fileName: (ctx) => ctx.fileName,
  orientation: (ctx) => ctx.orientation,
  pageSize: (ctx) => ctx.pageSize,
  showSignatures: (ctx) => ctx.showSignatures,
  showPageFooter: (ctx) => ctx.showPageFooter,
  buildSubTitle: (ctx) => ctx.subTitle || '',
  buildSections: (ctx) => ctx.sections,
};

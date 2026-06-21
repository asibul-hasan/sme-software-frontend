export * from './pdf-template.types';
export * from './pdf-template.registry';
export * from './pdf-template.service';
export * from './pdf-report.template';

import { pdfReportTemplate } from './pdf-report.template';
import { pdfTemplateRegistry } from './pdf-template.registry';

pdfTemplateRegistry.register(pdfReportTemplate);

import { PdfTemplate } from './pdf-template.types';

/**
 * Global registry for PDF report templates.
 *
 * Any module can register its templates at bootstrap time (typically in the
 * module's index.ts or a dedicated templates.ts file). The PdfTemplateService
 * looks up templates by id to render them.
 *
 * Example registration:
 * ```ts
 * import { trialBalanceTemplate } from '@app/features/fin/report-templates';
 * pdfTemplateRegistry.register(trialBalanceTemplate);
 * ```
 */
class PdfTemplateRegistry {
  private readonly templates = new Map<string, PdfTemplate<unknown>>();

  register<Context>(template: PdfTemplate<Context>): void {
    if (this.templates.has(template.id)) {
      console.warn(`[PdfTemplateRegistry] Template "${template.id}" is already registered. Overwriting.`);
    }
    this.templates.set(template.id, template as PdfTemplate<unknown>);
  }

  registerMany<Context>(templates: PdfTemplate<Context>[]): void {
    templates.forEach((t) => this.register(t));
  }

  get<Context>(id: string): PdfTemplate<Context> | undefined {
    return this.templates.get(id) as PdfTemplate<Context> | undefined;
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  list(): string[] {
    return Array.from(this.templates.keys());
  }

  listByModule(module: string): PdfTemplate<unknown>[] {
    return Array.from(this.templates.values()).filter((t) => t.module === module);
  }
}

/**
 * Singleton instance — import and call `register()` / `get()` directly.
 */
export const pdfTemplateRegistry = new PdfTemplateRegistry();

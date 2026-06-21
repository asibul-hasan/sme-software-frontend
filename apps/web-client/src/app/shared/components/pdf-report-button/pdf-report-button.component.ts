import { Component, input, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PdfTemplateService } from '../../pdf-templates';

/**
 * Reusable PDF report button.
 *
 * Usage in a form component template:
 * ```html
 * <app-pdf-report-button
 *   [templateId]="'FIN.trial-balance'"
 *   [context]="reportContext"
 *   fileName="my-trial-balance"
 *   tooltip="Export Trial Balance as PDF"
 * />
 * ```
 *
 * Or with a dynamic template factory:
 * ```html
 * <app-pdf-report-button
 *   [template]="myDynamicTemplate"
 *   [context]="reportContext"
 * />
 * ```
 */
@Component({
  selector: 'app-pdf-report-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-stroked-button
      color="primary"
      [matTooltip]="tooltip()"
      (click)="onExport()"
      [disabled]="loading"
    >
      <mat-icon>picture_as_pdf</mat-icon>
      <span>{{ label() }}</span>
    </button>
  `,
})
export class PdfReportButtonComponent {
  private readonly pdfService = inject(PdfTemplateService);

  /** Reference a registered template by id */
  templateId = input<string | undefined>(undefined);
  /** Or pass a full template object directly */
  template = input<unknown | undefined>(undefined);
  /** The context data passed to the template builder */
  context = input<unknown | undefined>(undefined);
  /** Override output filename */
  fileName = input<string | undefined>(undefined);
  /** Button label */
  label = input<string>('PDF');
  /** Tooltip text */
  tooltip = input<string>('Export PDF');

  loading = false;

  async onExport(): Promise<void> {
    const tpl = this.template();
    const id = this.templateId();
    const ctx = this.context();

    if (!tpl && !id) {
      console.error('[PdfReportButton] No template or templateId provided.');
      return;
    }
    if (ctx === undefined) {
      console.error('[PdfReportButton] No context provided.');
      return;
    }

    this.loading = true;
    try {
      if (tpl) {
        await this.pdfService.render(tpl as any, ctx, this.fileName());
      } else if (id) {
        await this.pdfService.renderById(id, ctx, this.fileName());
      }
    } catch (e) {
      console.error('[PdfReportButton] PDF export failed:', e);
    } finally {
      this.loading = false;
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { jsPDF } from 'jspdf';
import { ColumnDef } from '../components/common-table';
import { AppBootstrapService } from '../../core/services/app-bootstrap.service';
import { AppConfigService } from '../../core/services/app-config.service';
import { AuthContextService } from '../../core/services/auth-context.service';
import { ApiResponse } from '../../core/models/response.model';
import {
  PdfCustomSection,
  PdfSectionType,
  PdfSignaturesSection,
  PdfSummaryRow,
  PdfSummarySection,
  PdfTableSection,
  PdfTemplate,
  PdfTemplateSection,
  PdfTextSection,
  PdfTitleSection,
  PdfSubtitleSection,
  PdfSpacerSection,
  PdfSeparatorSection,
  PdfPageOrientation,
  PdfPageSize,
} from './pdf-template.types';
import { pdfTemplateRegistry } from './pdf-template.registry';

// ─── Company / Branch Profile Types (same as TableExportService) ───────────────
interface ExportCompanyProfile {
  company_name?: string | null;
  company_addr1?: string | null;
  company_addr2?: string | null;
  city?: string | null;
  state_province?: string | null;
  post_code?: string | null;
  country_code?: string | null;
  mobile_no?: string | null;
  contact_no?: string | null;
  email?: string | null;
  website?: string | null;
}

interface ExportBranchProfile {
  branch_name?: string | null;
  branch_addr1?: string | null;
  branch_addr2?: string | null;
  city?: string | null;
  post_code?: string | null;
  mobile_no?: string | null;
  contact_no?: string | null;
  email?: string | null;
}

// ─── Service ────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PdfTemplateService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly authContext = inject(AuthContextService);
  private readonly bootstrap = inject(AppBootstrapService);

  // Re-useable module lookup
  readonly registry = pdfTemplateRegistry;

  // ─── Public API ───────────────────────────────────────────────────────────────

  /**
   * Render a registered template by id with the provided context data.
   */
  async renderById<Context>(
    templateId: string,
    context: Context,
    fileNameOverride?: string,
  ): Promise<void> {
    const template = this.registry.get<Context>(templateId);
    if (!template)
      throw new Error(`PdfTemplate "${templateId}" is not registered.`);
    await this.render(template, context, fileNameOverride);
  }

  /**
   * Render any PdfTemplate directly (does not need registry registration).
   */
  async render<Context>(
    template: PdfTemplate<Context>,
    context: Context,
    fileNameOverride?: string,
  ): Promise<void> {
    const [profile, branch] = await Promise.all([
      this.getCompanyProfile(),
      this.getBranchProfile(),
    ]);
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const resolve = <T>(
      val: T | ((ctx: Context) => T) | undefined,
    ): T | undefined =>
      typeof val === 'function' ? (val as Function)(context) : val;

    const sections = template.buildSections(context);
    const templateOrientation = resolve(template.orientation) as
      | PdfPageOrientation
      | undefined;
    const orientation = this.resolveOrientation(templateOrientation, sections);
    const templatePageSize = resolve(template.pageSize) as
      | PdfPageSize
      | undefined;
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: templatePageSize || 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;
    const headerBottom = 48; // slightly reduced from TableExportService for more room
    const generatedAt = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date())
      .toUpperCase();

    const subTitle = template.buildSubTitle?.(context) ?? '';
    const title = resolve(template.title) as string;
    const fileName = resolve(template.fileName) as string;
    const showSignatures = resolve(template.showSignatures) ?? false;

    // Shared header/footer callbacks for every page
    const drawHeader = () => {
      this.drawCompanyHeader(
        doc,
        profile,
        branch,
        title,
        subTitle,
        generatedAt,
        marginX,
        pageWidth,
        pageHeight,
        headerBottom,
      );
    };
    const drawPageFooter = () => {
      this.drawPageFooter(doc, marginX, pageWidth, pageHeight, generatedAt);
    };

    // Draw header and footer for the initial page
    drawHeader();
    drawPageFooter();

    let cursorY = headerBottom + 6;

    for (const section of sections) {
      const result = this.drawSection({
        doc,
        section,
        autoTable: autoTable as any,
        cursorY,
        marginX,
        pageWidth,
        pageHeight,
        headerBottom,
        drawHeader,
        drawPageFooter,
        showSignatures,
      });
      cursorY = result.cursorY;

      // If the section pushed us onto a new page, the header/footer was already drawn
      // by the internal didDrawPage hooks; we just continue from the returned Y.
    }

    // Final signature block if requested
    if (showSignatures) {
      this.drawSignatures(doc, marginX, pageWidth, pageHeight);
    }

    const finalName = fileNameOverride || fileName || title || 'report';
    doc.save(`${finalName}.pdf`);
  }

  // ─── Section Rendering ──────────────────────────────────────────────────────────

  private drawSection(args: {
    doc: jsPDF;
    section: PdfTemplateSection;
    autoTable: (doc: jsPDF, options: unknown) => void;
    cursorY: number;
    marginX: number;
    pageWidth: number;
    pageHeight: number;
    headerBottom: number;
    drawHeader: () => void;
    drawPageFooter: () => void;
    showSignatures: boolean;
  }): { cursorY: number } {
    const {
      doc,
      section,
      autoTable,
      cursorY,
      marginX,
      pageWidth,
      pageHeight,
      headerBottom,
      drawHeader,
      drawPageFooter,
    } = args;
    const availableWidth = pageWidth - marginX * 2;
    let y = cursorY;

    // Safety: if we're near the bottom, add a page
    const safetyBottom = pageHeight - 30;
    if (y > safetyBottom) {
      doc.addPage();
      drawHeader();
      drawPageFooter();
      y = headerBottom + 6;
    }

    switch (section.type) {
      case 'title': {
        const s = section as PdfTitleSection;
        const align = s.align ?? 'center';
        const fontSize = s.fontSize ?? 14;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(15, 23, 42);
        const x =
          align === 'center'
            ? pageWidth / 2
            : align === 'right'
              ? pageWidth - marginX
              : marginX;
        doc.text(s.text, x, y, { align });
        y += fontSize * 0.45 + 3;
        break;
      }
      case 'subtitle': {
        const s = section as PdfSubtitleSection;
        const align = s.align ?? 'center';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const x =
          align === 'center'
            ? pageWidth / 2
            : align === 'right'
              ? pageWidth - marginX
              : marginX;
        doc.text(s.text, x, y, { align });
        y += 6;
        break;
      }
      case 'text': {
        const s = section as PdfTextSection;
        const align = s.align ?? 'left';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const split = doc.splitTextToSize(s.text, availableWidth);
        doc.text(
          split,
          align === 'center'
            ? pageWidth / 2
            : align === 'right'
              ? pageWidth - marginX
              : marginX,
          y,
          { align },
        );
        y += split.length * 3.8 + 2;
        break;
      }
      case 'table': {
        const s = section as PdfTableSection;
        const head = [s.columns.map((c) => c.title)];
        const body = s.rows.map((row) =>
          s.columns.map((col) => String(this.getDisplayValue(row, col) ?? '')),
        );

        const autoTableResult = autoTable(doc, {
          head,
          body,
          startY: y,
          styles: {
            fontSize: 8,
            cellPadding: 2.2,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: {
            top: headerBottom + 6,
            right: marginX,
            bottom: 28,
            left: marginX,
          },
          didDrawPage: () => {
            drawHeader();
            drawPageFooter();
          },
        });
        // After autotable, continue from its final Y
        // @ts-expect-error autotable plugin adds lastAutoTable to doc
        y = (doc.lastAutoTable?.finalY ?? y) + 6;
        break;
      }
      case 'summary': {
        const s = section as PdfSummarySection;
        const colsPerRow = s.columnsPerRow ?? 2;
        const colWidth = availableWidth / colsPerRow;
        const rowHeight = 6;

        if (s.title) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(s.title, marginX, y);
          y += 5;
        }

        doc.setFontSize(9);
        let rowY = y;
        let colIdx = 0;
        for (const entry of s.rows) {
          const x = marginX + colIdx * colWidth;

          // Label
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text(`${entry.label}:`, x, rowY);

          // Value
          const labelWidth = doc.getTextWidth(`${entry.label}:`) + 2;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          const valStr = entry.value == null ? '' : String(entry.value);
          doc.text(valStr, x + labelWidth, rowY);

          colIdx++;
          if (colIdx >= colsPerRow) {
            colIdx = 0;
            rowY += rowHeight;
          }
        }
        y = rowY + (colIdx > 0 ? rowHeight : 0) + 3;
        break;
      }
      case 'separator': {
        const s = section as PdfSeparatorSection;
        doc.setDrawColor(...(s.color ?? [203, 213, 225]));
        doc.setLineWidth(s.thickness ?? 0.3);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 3;
        break;
      }
      case 'spacer': {
        const s = section as PdfSpacerSection;
        y += s.height;
        break;
      }
      case 'signatures': {
        const s = section as PdfSignaturesSection;
        this.drawSignatureBlock(doc, marginX, pageWidth, y, s.labels);
        y += 18;
        break;
      }
      case 'custom': {
        const s = section as PdfCustomSection;
        y = s.draw(doc, y, pageWidth, marginX, { drawHeader, drawPageFooter });
        break;
      }
    }

    return { cursorY: y };
  }

  // ─── Orientation Resolution ───────────────────────────────────────────────────

  private resolveOrientation(
    templateOrientation?: 'portrait' | 'landscape',
    sections?: PdfTemplateSection[],
  ): 'portrait' | 'landscape' {
    if (templateOrientation) return templateOrientation;
    // Auto-detect landscape if any table has >7 columns
    const tableSections = (sections ?? []).filter(
      (s): s is PdfTableSection => s.type === 'table',
    );
    const maxCols = Math.max(0, ...tableSections.map((s) => s.columns.length));
    return maxCols > 7 ? 'landscape' : 'portrait';
  }

  // ─── Display Value Resolver (mirrors TableExportService) ────────────────────────

  private getDisplayValue(
    row: Record<string, unknown>,
    col: ColumnDef,
  ): unknown {
    if (col.value) {
      const v = col.value(row);
      return v == null ? '' : v;
    }
    const value = row[col.field];
    if (value == null) return '';
    if (col.cellType === 'select' && col.options) {
      const options =
        typeof col.options === 'function' ? col.options(row) : col.options;
      const lk = col.labelKey || 'label',
        vk = col.valueKey || 'value';
      const opt = options.find(
        (o) => (o as unknown as Record<string, unknown>)[vk] === value,
      );
      return opt ? (opt as unknown as Record<string, unknown>)[lk] : value;
    }
    if (col.cellType === 'badge' && col.badgeConfig) {
      const b = col.badgeConfig(value, row);
      return b ? b.label : value;
    }
    if (col.cellType === 'checkbox') return value ? 'Yes' : 'No';
    return value;
  }

  // ─── Company Header (shared style) ──────────────────────────────────────────────

  private drawCompanyHeader(
    doc: jsPDF,
    profile: ExportCompanyProfile,
    branch: ExportBranchProfile,
    title: string,
    subTitle: string,
    generatedAt: string,
    marginX: number,
    pageWidth: number,
    pageHeight: number,
    headerBottom: number,
  ): void {
    // Border
    doc.setDrawColor(226, 232, 240);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, headerBottom, pageWidth - marginX, headerBottom);

    // Logo
    const logo = this.bootstrap.companyLogoDataUrl() as string;
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', marginX, 10, 22, 18, undefined, 'FAST');
      } catch {
        try {
          doc.addImage(logo, 'JPEG', marginX, 10, 22, 18, undefined, 'FAST');
        } catch {
          /* ignore */
        }
      }
    }

    const textX = logo ? marginX + 28 : marginX;

    // Company name
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(profile.company_name || 'Company', textX, 14);

    // Company address
    const address = this.companyAddressLines(profile);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    address
      .slice(0, 2)
      .forEach((line, index) => doc.text(line, textX, 19 + index * 4));

    // Branch info
    const branchLines = this.branchAddressLines(branch);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(branchLines[0] ?? 'Branch: Branch', textX, 30);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    branchLines
      .slice(1, 4)
      .forEach((line, index) => doc.text(line, textX, 34 + index * 4));

    // Title + subtitle + generated at (right side)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, pageWidth - marginX, 14, { align: 'right' });

    if (subTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(subTitle, pageWidth - marginX, 20, { align: 'right' });
    }

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Generated: ${generatedAt}`,
      pageWidth - marginX,
      subTitle ? 26 : 20,
      { align: 'right' },
    );
  }

  // ─── Footer & Signature Helpers ─────────────────────────────────────────────────

  private drawPageFooter(
    doc: {
      getNumberOfPages: jsPDF['getNumberOfPages'];
      setFont: jsPDF['setFont'];
      setFontSize: jsPDF['setFontSize'];
      setTextColor: jsPDF['setTextColor'];
      text: jsPDF['text'];
      setDrawColor: jsPDF['setDrawColor'];
      setLineWidth: jsPDF['setLineWidth'];
      line: jsPDF['line'];
    },
    marginX: number,
    pageWidth: number,
    pageHeight: number,
    generatedAt: string,
  ): void {
    const yText = pageHeight - 8;

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text('Generated by Aidly ERP', marginX, yText);
    doc.text(generatedAt, pageWidth / 2, yText, { align: 'center' });
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, yText, {
      align: 'right',
    });
  }

  private drawSignatures(
    doc: {
      setDrawColor: jsPDF['setDrawColor'];
      setFont: jsPDF['setFont'];
      setFontSize: jsPDF['setFontSize'];
      setTextColor: jsPDF['setTextColor'];
      line: jsPDF['line'];
      text: jsPDF['text'];
    },
    marginX: number,
    pageWidth: number,
    pageHeight: number,
  ): void {
    const ySig = pageHeight - 24;

    doc.setDrawColor(148, 163, 184);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Use the original balanced spacing formula
    const slot = (pageWidth - marginX * 2) / 2;
    const labels = ['Prepared By', 'Approved By'];

    labels.forEach((label, index) => {
      const x1 = marginX + index * slot + 15; // Indent from edges
      const x2 = marginX + (index + 1) * slot - 15;
      doc.line(x1, ySig, x2, ySig);
      doc.text(label, (x1 + x2) / 2, ySig + 5, { align: 'center' });
    });
  }

  private drawSignatureBlock(
    doc: jsPDF,
    marginX: number,
    pageWidth: number,
    y: number,
    labels?: [string, string, string],
  ): void {
    const slot = (pageWidth - marginX * 2) / 3;
    const defaultLabels: [string, string, string] = [
      'Prepared By',
      'Checked By',
      'Approved By',
    ];
    const useLabels = labels ?? defaultLabels;
    doc.setDrawColor(148, 163, 184);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    useLabels.forEach((label, index) => {
      const x1 = marginX + index * slot + 4;
      const x2 = marginX + (index + 1) * slot - 10;
      doc.line(x1, y, x2, y);
      doc.text(label, (x1 + x2) / 2, y + 5, { align: 'center' });
    });
  }

  // ─── Profile Fetchers (identical to TableExportService) ─────────────────────────

  private companyProfileCache = new Map<
    number,
    Promise<ExportCompanyProfile>
  >();
  private branchProfileCache = new Map<number, Promise<ExportBranchProfile>>();

  private getCompanyProfile(): Promise<ExportCompanyProfile> {
    const user = this.authContext.user() as any;
    const fallback: ExportCompanyProfile = {
      company_name: user?.company_name ?? 'Company',
    };
    if (!user?.company_no) return Promise.resolve(fallback);

    // If local storage did actually have it
    if (user.company_addr1) {
      return Promise.resolve({
        company_name: user.company_name,
        company_addr1: user.company_addr1,
        company_addr2: user.company_addr2,
        city: user.city,
        state_province: user.state_province,
        post_code: user.post_code,
        country_code: user.country_code,
        mobile_no: user.mobile_no,
        contact_no: user.contact_no,
        email: user.email,
        website: user.website,
      });
    }

    if (!this.companyProfileCache.has(user.company_no)) {
      const req = firstValueFrom(
        this.http.get<ApiResponse<ExportCompanyProfile>>(
          `${this.config.apiUrl}/sys/forms/sys1001/${user.company_no}`,
        ),
      )
        .then((res) => (res?.data ? { ...fallback, ...res.data } : fallback))
        .catch(() => {
          this.companyProfileCache.delete(user.company_no);
          return fallback;
        });
      this.companyProfileCache.set(user.company_no, req);
    }
    return this.companyProfileCache.get(user.company_no)!;
  }

  private getBranchProfile(): Promise<ExportBranchProfile> {
    const user = this.authContext.user() as any;
    const fallback: ExportBranchProfile = {
      branch_name: user?.branch_name ?? 'Branch',
    };
    if (!user?.branch_no) return Promise.resolve(fallback);

    if (user.branch_addr1) {
      return Promise.resolve({
        branch_name: user.branch_name,
        branch_addr1: user.branch_addr1,
        branch_addr2: user.branch_addr2,
      });
    }

    if (!this.branchProfileCache.has(user.branch_no)) {
      const req = firstValueFrom(
        this.http.get<ApiResponse<ExportBranchProfile>>(
          `${this.config.apiUrl}/sys/forms/sys1002/branches/${user.branch_no}`,
        ),
      )
        .then((res) => (res?.data ? { ...fallback, ...res.data } : fallback))
        .catch(() => {
          this.branchProfileCache.delete(user.branch_no);
          return fallback;
        });
      this.branchProfileCache.set(user.branch_no, req);
    }
    return this.branchProfileCache.get(user.branch_no)!;
  }

  private companyAddressLines(profile: ExportCompanyProfile): string[] {
    const location = [
      profile.city,
      profile.state_province,
      profile.post_code,
      profile.country_code,
    ]
      .filter(Boolean)
      .join(', ');
    const contact = [
      profile.mobile_no || profile.contact_no
        ? `Phone: ${profile.mobile_no || profile.contact_no}`
        : '',
      profile.email ? `Email: ${profile.email}` : '',
      profile.website ? `Web: ${profile.website}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    return [
      profile.company_addr1,
      profile.company_addr2,
      location,
      contact,
    ].filter((line): line is string => !!line);
  }

  private branchAddressLines(branch: ExportBranchProfile): string[] {
    const location = [branch.city, branch.post_code].filter(Boolean).join(', ');
    const contact = [
      branch.mobile_no || branch.contact_no
        ? `Phone: ${branch.mobile_no || branch.contact_no}`
        : '',
      branch.email ? `Email: ${branch.email}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    return [
      `Branch: ${branch.branch_name || 'Branch'}`,
      branch.branch_addr1,
      branch.branch_addr2,
      location,
      contact,
    ].filter((line): line is string => !!line);
  }
}

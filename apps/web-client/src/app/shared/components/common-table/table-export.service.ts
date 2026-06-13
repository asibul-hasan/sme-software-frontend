import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { jsPDF } from 'jspdf';
import { ColumnDef } from './table.types';
import { AppBootstrapService } from '../../../core/services/app-bootstrap.service';
import { AppConfigService } from '../../../core/services/app-config.service';
import { AuthContextService } from '../../../core/services/auth-context.service';
import { ApiResponse } from '../../../core/models/response.model';

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

@Injectable({ providedIn: 'root' })
export class TableExportService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly authContext = inject(AuthContextService);
  private readonly bootstrap = inject(AppBootstrapService);

  exportToExcel(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export'): void {
    import('xlsx').then((XLSX) => {
      const rows = data.map((row) => {
        const record: Record<string, unknown> = {};
        columns.forEach((col) => { record[col.title] = this.getDisplayValue(row, col); });
        return record;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = columns.map((col) => ({ wch: col.width ? parseInt(col.width, 10) || 15 : 15 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    });
  }

  exportToCsv(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export'): void {
    const headers = columns.map((c) => `"${c.title}"`).join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        const val = this.getDisplayValue(row, col);
        return `"${val == null ? '' : String(val).replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv = [headers, ...rows].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${fileName}.csv`);
  }

  async exportToPdf(data: Record<string, unknown>[], columns: ColumnDef[], fileName = 'export', title?: string): Promise<void> {
    const [profile, branch] = await Promise.all([this.getCompanyProfile(), this.getBranchProfile()]);
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([jsPDFModule, autoTableModule]) => {
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 12;
      const headerBottom = 50;
      const generatedAt = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());

      this.drawPdfHeader(doc, profile, branch, title || fileName, generatedAt, marginX, pageWidth, pageHeight, headerBottom);
      const head = [columns.map((c) => c.title)];
      const body = data.map((row) => columns.map((col) => String(this.getDisplayValue(row, col) ?? '')));
      autoTable(doc, {
        head, body, startY: headerBottom + 6,
        styles: { fontSize: 8, cellPadding: 2.2, lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: headerBottom + 6, right: marginX, bottom: 34, left: marginX },
        didDrawPage: () => {
          this.drawPdfHeader(doc, profile, branch, title || fileName, generatedAt, marginX, pageWidth, pageHeight, headerBottom);
          this.drawPdfPageFooter(doc, marginX, pageWidth, pageHeight);
        },
      });
      this.drawPdfSignatures(doc, marginX, pageWidth, pageHeight);
      doc.save(`${fileName}.pdf`);
    });
  }

  printTable(data: Record<string, unknown>[], columns: ColumnDef[], title?: string): void {
    const headers = columns.map((c) =>
      `<th style="padding:6px 10px;background:#f7f8fc;font-weight:700;font-size:12px;color:#6b7280;border-bottom:1px solid #e2e8f0;text-align:left">${c.title}</th>`
    ).join('');
    const rows = data.map((row) =>
      `<tr>${columns.map((col) =>
        `<td style="padding:5px 10px;font-size:13px;border-bottom:1px solid #e2e8f0">${this.getDisplayValue(row, col) ?? ''}</td>`
      ).join('')}</tr>`
    ).join('');
    const html = `<!DOCTYPE html><html><head><title>${title || 'Export'}</title>
      <style>body{font-family:system-ui;padding:20px;color:#1a1f36}h3{margin:0 0 16px;font-size:16px}
      table{border-collapse:collapse;width:100%}tr:nth-child(even) td{background:#f7f8fc}
      @media print{body{padding:0}@page{margin:10mm}}</style></head>
      <body>${title ? `<h3>${title}</h3>` : ''}<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open(); doc.write(html); doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 300);
    }
  }

  private getDisplayValue(row: Record<string, unknown>, col: ColumnDef): unknown {
    // Explicit accessor wins (custom-template / computed columns).
    if (col.value) {
      const v = col.value(row);
      return v == null ? '' : v;
    }
    const value = row[col.field];
    if (value == null) return '';
    if (col.cellType === 'select' && col.options) {
      const options = typeof col.options === 'function' ? col.options(row) : col.options;
      const lk = col.labelKey || 'label', vk = col.valueKey || 'value';
      const opt = options.find((o) => (o as unknown as Record<string, unknown>)[vk] === value);
      return opt ? (opt as unknown as Record<string, unknown>)[lk] : value;
    }
    if (col.cellType === 'badge' && col.badgeConfig) { const b = col.badgeConfig(value, row); return b ? b.label : value; }
    if (col.cellType === 'checkbox') return value ? 'Yes' : 'No';
    return value;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  }

  private async getCompanyProfile(): Promise<ExportCompanyProfile> {
    const user = this.authContext.user();
    const fallback: ExportCompanyProfile = { company_name: user?.company_name ?? 'Company' };
    if (!user?.company_no) return fallback;
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<ExportCompanyProfile>>(`${this.config.apiUrl}/sys/forms/sys1001/${user.company_no}`),
      );
      return response?.data ? { ...fallback, ...response.data } : fallback;
    } catch {
      return fallback;
    }
  }

  private async getBranchProfile(): Promise<ExportBranchProfile> {
    const user = this.authContext.user();
    const fallback: ExportBranchProfile = { branch_name: user?.branch_name ?? 'Branch' };
    if (!user?.branch_no) return fallback;
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<ExportBranchProfile>>(`${this.config.apiUrl}/sys/forms/sys1002/branches/${user.branch_no}`),
      );
      return response?.data ? { ...fallback, ...response.data } : fallback;
    } catch {
      return fallback;
    }
  }

  private drawPdfHeader(
    doc: jsPDF,
    profile: ExportCompanyProfile,
    branch: ExportBranchProfile,
    title: string,
    generatedAt: string,
    marginX: number,
    pageWidth: number,
    pageHeight: number,
    headerBottom: number,
  ): void {
    doc.setDrawColor(226, 232, 240);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, headerBottom, pageWidth - marginX, headerBottom);

    const logo = this.bootstrap.companyLogoDataUrl();
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', marginX, 10, 22, 18, undefined, 'FAST');
      } catch {
        try { doc.addImage(logo, 'JPEG', marginX, 10, 22, 18, undefined, 'FAST'); } catch { /* ignore invalid logo data */ }
      }
    }

    const textX = logo ? marginX + 28 : marginX;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(profile.company_name || 'Company', textX, 14);

    const address = this.companyAddressLines(profile);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    address.slice(0, 2).forEach((line, index) => doc.text(line, textX, 19 + index * 4));

    const branchLines = this.branchAddressLines(branch);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(branchLines[0] ?? 'Branch: Branch', textX, 30);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    branchLines.slice(1, 4).forEach((line, index) => doc.text(line, textX, 34 + index * 4));

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, pageWidth - marginX, 14, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedAt}`, pageWidth - marginX, 20, { align: 'right' });
  }

  private drawPdfSignatures(doc: {
    setDrawColor: jsPDF['setDrawColor'];
    setFont: jsPDF['setFont'];
    setFontSize: jsPDF['setFontSize'];
    setTextColor: jsPDF['setTextColor'];
    line: jsPDF['line'];
    text: jsPDF['text'];
  }, marginX: number, pageWidth: number, pageHeight: number): void {
    const y = pageHeight - 24;
    const slot = (pageWidth - marginX * 2) / 3;
    const labels = ['Prepared By', 'Checked By', 'Approved By'];
    doc.setDrawColor(148, 163, 184);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    labels.forEach((label, index) => {
      const x1 = marginX + index * slot + 4;
      const x2 = marginX + (index + 1) * slot - 10;
      doc.line(x1, y, x2, y);
      doc.text(label, (x1 + x2) / 2, y + 5, { align: 'center' });
    });
  }

  private drawPdfPageFooter(doc: {
    getNumberOfPages: jsPDF['getNumberOfPages'];
    setFont: jsPDF['setFont'];
    setFontSize: jsPDF['setFontSize'];
    setTextColor: jsPDF['setTextColor'];
    text: jsPDF['text'];
  }, marginX: number, pageWidth: number, pageHeight: number): void {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by Aidly ERP', pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
  }

  private companyAddressLines(profile: ExportCompanyProfile): string[] {
    const location = [profile.city, profile.state_province, profile.post_code, profile.country_code].filter(Boolean).join(', ');
    const contact = [
      profile.mobile_no || profile.contact_no ? `Phone: ${profile.mobile_no || profile.contact_no}` : '',
      profile.email ? `Email: ${profile.email}` : '',
      profile.website ? `Web: ${profile.website}` : '',
    ].filter(Boolean).join(' | ');
    return [profile.company_addr1, profile.company_addr2, location, contact].filter((line): line is string => !!line);
  }

  private branchAddressLines(branch: ExportBranchProfile): string[] {
    const location = [branch.city, branch.post_code].filter(Boolean).join(', ');
    const contact = [
      branch.mobile_no || branch.contact_no ? `Phone: ${branch.mobile_no || branch.contact_no}` : '',
      branch.email ? `Email: ${branch.email}` : '',
    ].filter(Boolean).join(' | ');
    return [
      `Branch: ${branch.branch_name || 'Branch'}`,
      branch.branch_addr1,
      branch.branch_addr2,
      location,
      contact,
    ].filter((line): line is string => !!line);
  }
}

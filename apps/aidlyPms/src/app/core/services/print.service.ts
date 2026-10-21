import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from './settings.service';

export interface CustomerStatementPrintData {
  name: string;
  phone?: string;
  type?: string;
  balance?: number;
  points?: number;
  address?: string;
}

export interface SupplierStatementPrintData {
  name: string;
  phone?: string;
  balance?: number;
  note?: string;
  address?: string;
}

export interface SaleInvoicePrintData {
  inv: string;
  date: string;
  time?: string;
  customer: string;
  customerPhone?: string;
  salesman?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  dlNumber?: string;
  binNumber?: string;
  lines: Array<{
    name: string;
    qty: number;
    price: number;
    total: number;
    batch?: string;
    exp?: string;
  }>;
  subtotal: number;
  disc?: number;
  vat?: number;
  total: number;
  paid: number;
  due?: number;
  change?: number;
  paymentMethod?: string;
  payments?: Array<{ method: string; amount: number }>;
}

export interface PurchaseVoucherPrintData {
  ref: string;
  date: string;
  supplier: string;
  supplierPhone?: string;
  type?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  dlNumber?: string;
  binNumber?: string;
  lines: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    batch?: string;
    exp?: string;
  }>;
  gross: number;
  disc?: number;
  net: number;
  paid?: number;
  due?: number;
  paymentMode?: string;
}

export interface RequisitionPrintData {
  reqCode: string;
  date: string;
  supplier: string;
  createdBy: string;
  status: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  dlNumber?: string;
  binNumber?: string;
  lines: Array<{
    name: string;
    boxQty: number;
    btp: number;
    totalPrice: number;
  }>;
  totalEstimated: number;
}

export interface DueReceiptPrintData {
  receipt: string;
  date: string;
  customer: string;
  phone?: string;
  method: string;
  amount: number;
  note?: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  dlNumber?: string;
  binNumber?: string;
}

function fmtMoney(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);

  private readonly defaultPharmacy = {
    name: 'Aidly Model Pharmacy',
    branch: 'Main Branch (Banani), Dhaka',
    phone: '+880 1700-000000',
    dl: 'DL-2024-DH-8841',
    bin: 'BIN-192837465-0101',
  };

  /**
   * Prints arbitrary HTML content in a dedicated, isolated hidden iframe.
   * Includes complete CSS print stylesheet, @page configuration, and anti-page-spill rules.
   */
  printHtml(htmlContent: string, title = 'Aidly PMS Document', format: 'a4' | 'thermal' = 'a4', rollWidth = '80mm'): void {
    const existingFrame = document.getElementById('aidly-print-iframe') as HTMLIFrameElement;
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'aidly-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const isThermal = format === 'thermal';
    let bodyWidth = '100%';
    let pageSize = 'A4 portrait; margin: 10mm 15mm 12mm 15mm;';

    if (isThermal) {
      if (rollWidth === '57mm' || rollWidth === '58mm') {
        pageSize = '58mm auto; margin: 0;';
        bodyWidth = '54mm';
      } else if (rollWidth === '72mm') {
        pageSize = '72mm auto; margin: 0;';
        bodyWidth = '70mm';
      } else {
        pageSize = '80mm auto; margin: 0;';
        bodyWidth = '76mm';
      }
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: ${pageSize};
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            font-family: ${isThermal ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
            font-size: ${isThermal ? '10px' : '11px'};
            color: ${isThermal ? '#000000' : '#1e293b'};
            line-height: ${isThermal ? '1.3' : '1.4'};
            background: #ffffff;
            padding: ${isThermal ? '3mm 2mm' : '0'};
            margin: 0;
            width: ${bodyWidth};
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-container, .document-wrapper {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }
          header.doc-header {
            text-align: center;
            margin-bottom: 12px;
          }
          .pharmacy-title {
            font-size: 22px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
          }
          .pharmacy-branch {
            font-size: 11.5px;
            color: #475569;
            font-weight: 500;
            margin-bottom: 2px;
          }
          .pharmacy-meta {
            font-size: 11px;
            color: #64748b;
          }
          .pharmacy-meta .sep {
            color: #94a3b8;
            margin: 0 4px;
          }
          .header-divider {
            width: 100%;
            height: 2.5px;
            background: #1e3a8a;
            margin: 10px 0 14px;
          }
          .doc-title-badge {
            text-align: center;
            font-size: 13.5px;
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 14px;
          }
          .meta-card {
            display: flex;
            justify-content: space-between;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #f8fafc;
            padding: 10px 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .meta-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .meta-right {
            text-align: right;
          }
          .meta-item {
            font-size: 11px;
          }
          .meta-label {
            color: #475569;
            font-weight: 600;
            display: inline-block;
            min-width: 75px;
          }
          .meta-right .meta-label {
            min-width: 55px;
          }
          .meta-val {
            color: #0f172a;
            font-weight: 600;
          }
          .table-wrapper {
            width: 100%;
            margin-bottom: 12px;
          }
          table.invoice-table {
            width: 100%;
            border-collapse: collapse;
          }
          table.invoice-table thead {
            display: table-header-group;
          }
          table.invoice-table th {
            background: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1.5px solid #94a3b8;
            text-align: left;
          }
          table.invoice-table td {
            padding: 8px 10px;
            font-size: 11.5px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
          table.invoice-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .summary-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-top: 12px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .summary-box {
            width: 270px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #f8fafc;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sum-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 12px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
          }
          .sum-row:last-child {
            border-bottom: none;
          }
          .sum-label {
            color: #475569;
            font-weight: 500;
          }
          .sum-val {
            font-weight: 600;
            color: #0f172a;
          }
          .sum-row.sum-net {
            background: #eff6ff;
            border-top: 1.5px solid #bfdbfe;
            border-bottom: 1.5px solid #bfdbfe;
          }
          .sum-net .sum-label {
            color: #1e40af;
            font-weight: 800;
            font-size: 13px;
          }
          .sum-net .sum-val {
            color: #1e40af;
            font-weight: 800;
            font-size: 14px;
          }
          .thank-you-box {
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
            margin-top: 14px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .ty-star {
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 3px;
          }
          .ty-policy {
            font-size: 10px;
            color: #475569;
            margin-bottom: 2px;
          }
          .ty-signature-note {
            font-size: 9px;
            color: #64748b;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 36px;
            padding-top: 12px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sig-box {
            width: 170px;
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            font-size: 10px;
            color: #64748b;
          }
          footer.doc-footer {
            margin-top: 10px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #94a3b8;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .last-page-footer-group {
            width: 100%;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #bottom-spacer {
            display: block;
            width: 100%;
            height: 0px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .font-bold { font-weight: 700; }
          .text-emerald { color: #047857; }
          .text-rose { color: #b91c1c; }
        </style>
      </head>
      <body>
        ${!isThermal ? '<div id="print-page-probe" style="position: absolute; top: 0; left: 0; height: 274mm; width: 1px; visibility: hidden; pointer-events: none;"></div>' : ''}
        ${htmlContent}
        ${!isThermal ? `
          <script>
            function alignLastPageFooter() {
              try {
                var probe = document.getElementById('print-page-probe');
                var content = document.getElementById('printable-content');
                var footer = document.getElementById('last-page-footer');
                var spacer = document.getElementById('bottom-spacer');
                if (!probe || !content || !footer || !spacer) return;

                spacer.style.height = '0px';
                spacer.style.breakBefore = 'auto';
                spacer.style.pageBreakBefore = 'auto';

                var pageHeight = probe.getBoundingClientRect().height;
                var contentHeight = content.getBoundingClientRect().height;
                var footerHeight = footer.getBoundingClientRect().height;

                if (!pageHeight || pageHeight <= 0) return;

                var remainder = contentHeight % pageHeight;
                var spaceLeft = pageHeight - remainder;
                var safety = 16;

                if (spaceLeft >= footerHeight + safety) {
                  var neededSpacer = spaceLeft - footerHeight - safety;
                  spacer.style.height = Math.max(0, Math.floor(neededSpacer)) + 'px';
                } else {
                  spacer.style.breakBefore = 'page';
                  spacer.style.pageBreakBefore = 'always';
                  var neededSpacer = pageHeight - footerHeight - safety;
                  spacer.style.height = Math.max(0, Math.floor(neededSpacer)) + 'px';
                }
              } catch (e) {
                console.error(e);
              }
            }

            window.addEventListener('DOMContentLoaded', alignLastPageFooter);
            window.addEventListener('load', alignLastPageFooter);
            window.addEventListener('beforeprint', alignLastPageFooter);
            alignLastPageFooter();
          </script>
        ` : ''}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        const win = iframe.contentWindow;
        if (win && (win as any).alignLastPageFooter) {
          (win as any).alignLastPageFooter();
        }
      } catch (e) {
        // ignore
      }
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }

  /**
   * Prints the DOM element specified by its HTML element or ID.
   */
  printElement(elementOrId: HTMLElement | string, options?: { title?: string }): void {
    let elem: HTMLElement | null = null;
    if (typeof elementOrId === 'string') {
      elem = document.getElementById(elementOrId);
    } else {
      elem = elementOrId;
    }

    if (!elem) {
      window.print();
      return;
    }

    this.printHtml(elem.innerHTML, options?.title || 'Print Document');
  }

  /**
   * Generates and prints an executive A4 Sale Receipt / Tax Invoice.
   * Matches and improves upon the provided reference image with proper semantic tags,
   * crisp typography, and guaranteed anti-page-spill rules.
   */
  printSaleInvoice(data: SaleInvoicePrintData, format: 'a4' | 'thermal' = 'a4'): void {
    if (format === 'thermal') {
      this.printThermalSlip(data);
      return;
    }

    const activeBranch = this.authService.activeBranch();
    const branchName = data.branchName || activeBranch?.name || this.defaultPharmacy.name;
    const branchAddress = data.branchAddress || activeBranch?.address || this.defaultPharmacy.branch;
    const branchPhone = data.branchPhone || activeBranch?.contact_phone || this.defaultPharmacy.phone;
    const dlNumber = data.dlNumber || activeBranch?.drug_license_no || this.defaultPharmacy.dl;
    const binNumber = data.binNumber || activeBranch?.bin_no || this.defaultPharmacy.bin;

    const dateStr = data.date || new Date().toLocaleDateString('en-GB');
    const timeStr = data.time || new Date().toLocaleTimeString('en-GB');

    const rowsHtml = data.lines.length > 0
      ? data.lines.map((item) => `
        <tr>
          <td class="td-item">
            <div class="font-bold">${item.name}</div>
            ${item.batch ? `<div style="font-size: 9.5px; color: #64748b;">Batch: ${item.batch} ${item.exp ? '· Exp: ' + item.exp : ''}</div>` : ''}
          </td>
          <td class="td-qty text-center font-mono">${item.qty}</td>
          <td class="td-price text-right font-mono">৳ ${fmtMoney(item.price)}</td>
          <td class="td-total text-right font-mono font-bold">৳ ${fmtMoney(item.total)}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="4" class="text-center" style="padding: 18px; color: #94a3b8;">
            No item details recorded.
          </td>
        </tr>
      `;

    const invoiceHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <!-- Header -->
          <header class="doc-header">
            <h1 class="pharmacy-title">${branchName}</h1>
            <p class="pharmacy-branch">${branchAddress}</p>
            <p class="pharmacy-meta">Hotline: ${branchPhone} <span class="sep">|</span> DL: ${dlNumber} <span class="sep">|</span> BIN: ${binNumber}</p>
            <div class="header-divider"></div>
          </header>

          <!-- Document Title -->
          <div class="doc-title-badge">SALE RECEIPT</div>

          <!-- Metadata Card -->
          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Bill No:</span> <strong class="meta-val font-mono">${data.inv}</strong></div>
              <div class="meta-item"><span class="meta-label">Customer:</span> <span class="meta-val">${data.customer}${data.customerPhone ? ' (' + data.customerPhone + ')' : ''}</span></div>
              <div class="meta-item"><span class="meta-label">Salesman:</span> <span class="meta-val">${data.salesman || 'Admin'}</span></div>
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-val font-mono">${dateStr}</span></div>
              <div class="meta-item"><span class="meta-label">Time:</span> <span class="meta-val font-mono">${timeStr}</span></div>
              <div class="meta-item"><span class="meta-label">Payment:</span> <span class="meta-val">${data.paymentMethod || 'Cash Counter'}</span></div>
            </div>
          </section>

          <!-- Table -->
          <main class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th class="th-item">ITEM DESCRIPTION</th>
                  <th class="th-qty text-center" style="width: 70px;">QTY</th>
                  <th class="th-price text-right" style="width: 110px;">UNIT PRICE</th>
                  <th class="th-total text-right" style="width: 120px;">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </main>

          <!-- Summary Card -->
          <section class="summary-wrapper">
            <div class="summary-box">
              <div class="sum-row"><span class="sum-label">Subtotal:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.subtotal)}</span></div>
              ${data.disc ? `<div class="sum-row"><span class="sum-label">Discount:</span> <span class="sum-val font-mono text-emerald">-৳ ${fmtMoney(data.disc)}</span></div>` : ''}
              ${data.vat ? `<div class="sum-row"><span class="sum-label">VAT / Tax:</span> <span class="sum-val font-mono">+৳ ${fmtMoney(data.vat)}</span></div>` : ''}
              <div class="sum-row sum-net"><span class="sum-label">Net Payable:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.total)}</span></div>
              <div class="sum-row"><span class="sum-label">Paid Amount:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.paid)}</span></div>
              ${data.due ? `<div class="sum-row" style="color: #b91c1c; font-weight: 700;"><span class="sum-label" style="color: #b91c1c;">Due Remaining:</span> <span class="sum-val font-mono text-rose">৳ ${fmtMoney(data.due)}</span></div>` : ''}
              ${data.change ? `<div class="sum-row"><span class="sum-label">Change Given:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.change)}</span></div>` : ''}
            </div>
          </section>
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <!-- Thank-You & Policies -->
          <section class="thank-you-box">
            <div class="ty-star">*** Thank You for Shopping! ***</div>
            <div class="ty-policy">Medicines sold cannot be returned without receipt.</div>
            <div class="ty-signature-note">This is generated by AidlyPms no authority signature is required</div>
          </section>

          <!-- Running Footer -->
          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(invoiceHtml, `Sale Receipt - ${data.inv}`);
  }

  /**
   * Dedicated 80mm thermal roll receipt printer renderer.
   */
  printThermalSlip(data: SaleInvoicePrintData): void {
    const activeBranch = this.authService.activeBranch();
    const invCfg = this.settingsService.invoiceConfig();

    const branchName = data.branchName || activeBranch?.name || this.defaultPharmacy.name;
    const branchAddress = data.branchAddress || activeBranch?.address || this.defaultPharmacy.branch;
    const branchPhone = data.branchPhone || activeBranch?.contact_phone || this.defaultPharmacy.phone;
    const dlNumber = data.dlNumber || activeBranch?.drug_license_no || this.defaultPharmacy.dl;
    const binNumber = data.binNumber || activeBranch?.bin_no || this.defaultPharmacy.bin;

    // Resolve paper roll width from settings:
    // paper_type: 2 -> 58mm/57mm, 3 -> 72mm, 1 (default) -> 80mm
    let rollWidth = '80mm';
    let containerWidth = '74mm';
    let baseFontSize = '11px';
    if (invCfg?.paper_type === 2) {
      rollWidth = '58mm';
      containerWidth = '52mm';
      baseFontSize = '9.5px';
    } else if (invCfg?.paper_type === 3) {
      rollWidth = '72mm';
      containerWidth = '68mm';
      baseFontSize = '10.5px';
    }

    const showServedBy = invCfg?.show_served_by_row ?? true;
    const showCustomer = invCfg?.show_customer_name ?? true;
    const showPhone = invCfg?.show_customer_phone ?? true;
    const topHeaderText = invCfg?.top_row_text?.trim();
    const bottomDisclaimer = invCfg?.bottom_row_text?.trim() || 'Medicines cannot be returned without receipt within 7 days.';

    const dateStr = data.date || new Date().toLocaleDateString('en-GB');

    const rowsHtml = data.lines.map((i) => `
      <tr>
        <td style="padding: 2px 0; text-align: left; font-size: ${baseFontSize};">${i.name}</td>
        <td style="padding: 2px 0; text-align: center; font-size: ${baseFontSize};">${i.qty}</td>
        <td style="padding: 2px 0; text-align: right; font-size: ${baseFontSize};">${fmtMoney(i.price)}</td>
        <td style="padding: 2px 0; text-align: right; font-size: ${baseFontSize}; font-weight: bold;">${fmtMoney(i.total)}</td>
      </tr>
    `).join('');

    const thermalHtml = `
      <div style="font-family: monospace; font-size: ${baseFontSize}; color: #000; width: ${containerWidth}; margin: 0 auto; text-align: center;">
        ${topHeaderText ? `<div style="font-size: 11px; font-weight: bold; margin-bottom: 4px; white-space: pre-line;">${topHeaderText}</div>` : ''}
        <div style="font-size: 13px; font-weight: bold; text-transform: uppercase;">${branchName}</div>
        <div style="font-size: 10px;">${branchAddress}</div>
        <div style="font-size: 10px;">Hotline: ${branchPhone}</div>
        <div style="font-size: 10px; font-weight: 600;">DL: ${dlNumber} <span style="margin: 0 4px;">|</span> BIN: ${binNumber}</div>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <div style="font-size: 10px; text-align: left; line-height: 1.3;">
          <div style="display: flex; justify-content: space-between;"><span>Bill No:</span><strong>${data.inv}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Date:</span><span>${dateStr}</span></div>
          ${showCustomer ? `<div style="display: flex; justify-content: space-between;"><span>Customer:</span><span>${data.customer}</span></div>` : ''}
          ${showPhone && data.customerPhone ? `<div style="display: flex; justify-content: space-between;"><span>Phone:</span><span>${data.customerPhone}</span></div>` : ''}
          ${showServedBy ? `<div style="display: flex; justify-content: space-between;"><span>Served By:</span><span>${data.salesman || 'Admin'}</span></div>` : ''}
        </div>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #000; text-align: left; font-size: 10px;">
              <th style="padding-bottom: 2px;">Item</th>
              <th style="padding-bottom: 2px; text-align: center;">Qty</th>
              <th style="padding-bottom: 2px; text-align: right;">Price</th>
              <th style="padding-bottom: 2px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <div style="text-align: left; font-size: 11px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>৳ ${fmtMoney(data.subtotal)}</span></div>
          ${data.disc ? `<div style="display: flex; justify-content: space-between;"><span>Discount:</span><span>-৳ ${fmtMoney(data.disc)}</span></div>` : ''}
          ${data.vat ? `<div style="display: flex; justify-content: space-between;"><span>VAT:</span><span>+৳ ${fmtMoney(data.vat)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; border-top: 1px solid #000; padding-top: 2px;">
            <span>Net Payable:</span>
            <span>৳ ${fmtMoney(data.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;"><span>Paid:</span><span>৳ ${fmtMoney(data.paid)}</span></div>
          ${data.due ? `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Due:</span><span>৳ ${fmtMoney(data.due)}</span></div>` : ''}
          ${data.change ? `<div style="display: flex; justify-content: space-between;"><span>Change:</span><span>৳ ${fmtMoney(data.change)}</span></div>` : ''}
        </div>
        <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

        <div style="font-size: 10px; margin-top: 6px;">
          <div>*** Thank You for Shopping! ***</div>
          <div style="font-size: 9px; margin-top: 2px; white-space: pre-line;">${bottomDisclaimer}</div>
          <div style="font-size: 8px; margin-top: 2px; color: #444;">Generated by AidlyPms</div>
        </div>
      </div>
    `;

    this.printHtml(thermalHtml, `Receipt - ${data.inv}`, 'thermal', rollWidth);
  }

  /**
   * Generates and prints an executive A4 Goods Receiving Note (GRN) / Purchase Voucher.
   */
  printPurchaseVoucher(data: PurchaseVoucherPrintData): void {
    const branchName = data.branchName || this.defaultPharmacy.name;
    const branchAddress = data.branchAddress || this.defaultPharmacy.branch;
    const branchPhone = data.branchPhone || this.defaultPharmacy.phone;
    const dlNumber = data.dlNumber || this.defaultPharmacy.dl;
    const binNumber = data.binNumber || this.defaultPharmacy.bin;

    const rowsHtml = data.lines.map((i) => `
      <tr>
        <td class="td-item">
          <div class="font-bold">${i.name}</div>
          ${i.batch ? `<div style="font-size: 9.5px; color: #64748b;">Batch: ${i.batch} ${i.exp ? '· Exp: ' + i.exp : ''}</div>` : ''}
        </td>
        <td class="td-qty text-center font-mono">${i.qty}</td>
        <td class="td-price text-right font-mono">৳ ${fmtMoney(i.unitPrice)}</td>
        <td class="td-total text-right font-mono font-bold">৳ ${fmtMoney(i.total)}</td>
      </tr>
    `).join('');

    const voucherHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <header class="doc-header">
            <h1 class="pharmacy-title">${branchName}</h1>
            <p class="pharmacy-branch">${branchAddress}</p>
            <p class="pharmacy-meta">Hotline: ${branchPhone} <span class="sep">|</span> DL: ${dlNumber} <span class="sep">|</span> BIN: ${binNumber}</p>
            <div class="header-divider"></div>
          </header>

          <div class="doc-title-badge">GOODS RECEIVING NOTE (GRN) / PURCHASE VOUCHER</div>

          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Voucher #:</span> <strong class="meta-val font-mono">${data.ref}</strong></div>
              <div class="meta-item"><span class="meta-label">Vendor / Supplier:</span> <strong class="meta-val">${data.supplier}${data.supplierPhone ? ' (' + data.supplierPhone + ')' : ''}</strong></div>
              <div class="meta-item"><span class="meta-label">Category:</span> <span class="meta-val">${data.type || 'Commercial Medicine Stock'}</span></div>
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Inward Date:</span> <span class="meta-val font-mono">${data.date}</span></div>
              <div class="meta-item"><span class="meta-label">Payment Mode:</span> <span class="meta-val">${data.paymentMode || 'Credit Supplier Payable'}</span></div>
              <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-val text-emerald font-bold">Received & Stocked</span></div>
            </div>
          </section>

          <main class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th class="th-item">ITEM FORMULATION</th>
                  <th class="th-qty text-center" style="width: 75px;">INWARD QTY</th>
                  <th class="th-price text-right" style="width: 110px;">UNIT COST (৳)</th>
                  <th class="th-total text-right" style="width: 120px;">TOTAL (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </main>

          <section class="summary-wrapper">
            <div class="summary-box">
              <div class="sum-row"><span class="sum-label">Gross Value:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.gross)}</span></div>
              ${data.disc ? `<div class="sum-row"><span class="sum-label">Discount Allowed:</span> <span class="sum-val font-mono text-emerald">-৳ ${fmtMoney(data.disc)}</span></div>` : ''}
              <div class="sum-row sum-net"><span class="sum-label">Net Inward Amount:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.net)}</span></div>
              ${data.paid !== undefined ? `<div class="sum-row"><span class="sum-label">Amount Paid:</span> <span class="sum-val font-mono">৳ ${fmtMoney(data.paid)}</span></div>` : ''}
              ${data.due !== undefined ? `<div class="sum-row sum-due"><span class="sum-label">Due Payable:</span> <span class="sum-val font-mono text-rose">৳ ${fmtMoney(data.due)}</span></div>` : ''}
            </div>
          </section>
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <div class="signature-section">
            <div class="sig-box">Receiving Pharmacist</div>
            <div class="sig-box">Supplier Representative</div>
            <div class="sig-box">Accounts Department</div>
          </div>

          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(voucherHtml, `Purchase Voucher - ${data.ref}`);
  }

  /**
   * Generates and prints an executive A4 Commercial Purchase Requisition Order.
   */
  printRequisitionOrder(data: RequisitionPrintData): void {
    const branchName = data.branchName || this.defaultPharmacy.name;
    const branchAddress = data.branchAddress || this.defaultPharmacy.branch;
    const branchPhone = data.branchPhone || this.defaultPharmacy.phone;
    const dlNumber = data.dlNumber || this.defaultPharmacy.dl;
    const binNumber = data.binNumber || this.defaultPharmacy.bin;

    const rowsHtml = data.lines.map((i, idx) => `
      <tr>
        <td class="text-center font-mono" style="width: 32px;">${idx + 1}</td>
        <td class="td-item font-bold">${i.name}</td>
        <td class="td-qty text-center font-mono font-bold">${i.boxQty}</td>
        <td class="td-price text-right font-mono">৳ ${fmtMoney(i.btp)}</td>
        <td class="td-total text-right font-mono font-bold">৳ ${fmtMoney(i.totalPrice)}</td>
      </tr>
    `).join('');

    const reqHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <header class="doc-header">
            <h1 class="pharmacy-title">${branchName}</h1>
            <p class="pharmacy-branch">${branchAddress}</p>
            <p class="pharmacy-meta">Hotline: ${branchPhone} <span class="sep">|</span> DL: ${dlNumber} <span class="sep">|</span> BIN: ${binNumber}</p>
            <div class="header-divider"></div>
          </header>

          <div class="doc-title-badge">COMMERCIAL PURCHASE REQUISITION ORDER</div>

          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Requisition #:</span> <strong class="meta-val font-mono">${data.reqCode}</strong></div>
              <div class="meta-item"><span class="meta-label">Supplier Assigned:</span> <strong class="meta-val">${data.supplier}</strong></div>
              <div class="meta-item"><span class="meta-label">Originator:</span> <span class="meta-val">${data.createdBy}</span></div>
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-val font-mono">${data.date}</span></div>
              <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-val font-bold text-emerald">${data.status}</span></div>
              <div class="meta-item"><span class="meta-label">Order Type:</span> <span class="meta-val">Regular Stock Replenishment</span></div>
            </div>
          </section>

          <main class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 32px;">#</th>
                  <th class="th-item">MEDICINE FORMULATION</th>
                  <th class="th-qty text-center" style="width: 80px;">REQ BOX</th>
                  <th class="th-price text-right" style="width: 110px;">UNIT BTP (৳)</th>
                  <th class="th-total text-right" style="width: 120px;">SUBTOTAL (৳)</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </main>

          <section class="summary-wrapper">
            <div class="summary-box">
              <div class="sum-row sum-net">
                <span class="sum-label">Estimated Total:</span>
                <span class="sum-val font-mono">৳ ${fmtMoney(data.totalEstimated)}</span>
              </div>
            </div>
          </section>
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <div class="signature-section">
            <div class="sig-box">Prepared By (Pharmacist)</div>
            <div class="sig-box">Store Manager Verification</div>
            <div class="sig-box">Commercial Approval</div>
          </div>

          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(reqHtml, `Requisition Order - ${data.reqCode}`);
  }

  /**
   * Generates and prints an executive A4 Customer Due Settlement Money Receipt.
   */
  printDueReceipt(data: DueReceiptPrintData): void {
    const branchName = data.branchName || this.defaultPharmacy.name;
    const branchAddress = data.branchAddress || this.defaultPharmacy.branch;
    const branchPhone = data.branchPhone || this.defaultPharmacy.phone;
    const dlNumber = data.dlNumber || this.defaultPharmacy.dl;
    const binNumber = data.binNumber || this.defaultPharmacy.bin;

    const receiptHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <header class="doc-header">
            <h1 class="pharmacy-title">${branchName}</h1>
            <p class="pharmacy-branch">${branchAddress}</p>
            <p class="pharmacy-meta">Hotline: ${branchPhone} <span class="sep">|</span> DL: ${dlNumber} <span class="sep">|</span> BIN: ${binNumber}</p>
            <div class="header-divider"></div>
          </header>

          <div class="doc-title-badge">CUSTOMER DUE SETTLEMENT MONEY RECEIPT</div>

          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Receipt #:</span> <strong class="meta-val font-mono">${data.receipt}</strong></div>
              <div class="meta-item"><span class="meta-label">Customer:</span> <strong class="meta-val">${data.customer}</strong></div>
              <div class="meta-item"><span class="meta-label">Contact Phone:</span> <span class="meta-val font-mono">${data.phone || 'N/A'}</span></div>
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-val font-mono">${data.date}</span></div>
              <div class="meta-item"><span class="meta-label">Payment Mode:</span> <span class="meta-val">${data.method}</span></div>
              <div class="meta-item"><span class="meta-label">Status:</span> <span class="meta-val text-emerald font-bold">Collected & Settled</span></div>
            </div>
          </section>

          <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 6px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #065f46;">Total Due Collected</div>
              <div style="font-size: 10px; color: #047857; margin-top: 2px;">Customer ledger updated and credit balance settled</div>
            </div>
            <div style="font-size: 20px; font-weight: 800; font-family: monospace; color: #047857;">
              ৳ ${fmtMoney(data.amount)}
            </div>
          </div>

          ${data.note ? `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; background: #f8fafc; font-size: 11px; margin-bottom: 20px;">
              <span style="color: #64748b; font-weight: 600;">Settlement Narration:</span>
              <span style="color: #0f172a; margin-left: 6px;">${data.note}</span>
            </div>
          ` : ''}
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <div class="signature-section">
            <div class="sig-box">Collecting Cashier / Pharmacist</div>
            <div class="sig-box">Customer Signature</div>
            <div class="sig-box">Authorized Signature</div>
          </div>

          <section class="thank-you-box" style="margin-top: 14px;">
            <div class="ty-star">*** Thank You for Your Payment! ***</div>
            <div class="ty-signature-note">Official computer-generated receipt from Aidly PMS</div>
          </section>

          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(receiptHtml, `Money Receipt - ${data.receipt}`);
  }

  /**
   * Generates and prints an executive Customer Statement of Account (Ledger).
   */
  printCustomerStatement(customer: CustomerStatementPrintData, entries: any[] = []): void {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const printTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const rowsHtml = entries.length > 0
      ? entries.map((entry, index) => {
          const debit = Number(entry.debit) || 0;
          const credit = Number(entry.credit) || 0;
          const balance = Number(entry.balance) || 0;
          totalDebit += debit;
          totalCredit += credit;

          const dateStr = entry.doc_date
            ? new Date(entry.doc_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              }) + ' ' + new Date(entry.doc_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : '—';

          return `
            <tr>
              <td class="text-center font-mono">${index + 1}</td>
              <td class="font-mono">${dateStr}</td>
              <td class="font-bold font-mono">${entry.doc_no || '—'}</td>
              <td>${entry.doc_type || 'Ledger Entry'}</td>
              <td class="text-right font-mono">${debit > 0 ? '৳ ' + fmtMoney(debit) : '—'}</td>
              <td class="text-right font-mono text-emerald">${credit > 0 ? '৳ ' + fmtMoney(credit) : '—'}</td>
              <td class="text-right font-mono font-bold ${balance > 0 ? 'text-rose' : 'text-emerald'}">৳ ${fmtMoney(balance)}</td>
              <td>${entry.note || entry.payment_method || '—'}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="8" class="text-center" style="padding: 24px; color: #94a3b8;">
            No transaction records found for this customer.
          </td>
        </tr>
      `;

    const dueBalance = customer.balance !== undefined ? customer.balance : (totalDebit - totalCredit);

    const statementHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <header class="doc-header">
            <h1 class="pharmacy-title">${this.defaultPharmacy.name}</h1>
            <p class="pharmacy-branch">${this.defaultPharmacy.branch}</p>
            <p class="pharmacy-meta">Hotline: ${this.defaultPharmacy.phone} <span class="sep">|</span> DL: ${this.defaultPharmacy.dl}</p>
            <div class="header-divider"></div>
          </header>

          <div class="doc-title-badge">CUSTOMER STATEMENT OF ACCOUNT (LEDGER)</div>

          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Customer Name:</span> <strong class="meta-val">${customer.name}</strong></div>
              <div class="meta-item"><span class="meta-label">Contact Phone:</span> <span class="meta-val font-mono">${customer.phone || 'N/A'}</span></div>
              <div class="meta-item"><span class="meta-label">Customer Type:</span> <span class="meta-val">${customer.type || 'Regular Customer'}</span></div>
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Statement Date:</span> <span class="meta-val font-mono">${today} ${printTime}</span></div>
              <div class="meta-item"><span class="meta-label">Net Due Balance:</span> <strong class="meta-val font-mono text-rose" style="font-size: 13px;">৳ ${fmtMoney(dueBalance)}</strong></div>
              <div class="meta-item"><span class="meta-label">Ledger Status:</span> <span class="meta-val font-bold ${Number(dueBalance) > 0 ? 'text-rose' : 'text-emerald'}">${Number(dueBalance) > 0 ? 'PAYABLE DUE' : 'CLEARED'}</span></div>
            </div>
          </section>

          <main class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 32px;">#</th>
                  <th style="width: 110px;">Date & Time</th>
                  <th style="width: 90px;">Doc #</th>
                  <th style="width: 90px;">Type</th>
                  <th class="text-right" style="width: 85px;">Debit (৳)</th>
                  <th class="text-right" style="width: 85px;">Credit (৳)</th>
                  <th class="text-right" style="width: 95px;">Balance (৳)</th>
                  <th>Method / Note</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </main>

          <section class="summary-wrapper">
            <div class="summary-box">
              <div class="sum-row"><span>Total Sales / Debit:</span> <span class="font-mono">৳ ${fmtMoney(totalDebit)}</span></div>
              <div class="sum-row"><span>Total Payments / Credit:</span> <span class="font-mono text-emerald">৳ ${fmtMoney(totalCredit)}</span></div>
              <div class="sum-row sum-net"><span>Net Outstanding Due:</span> <span class="font-mono text-rose">৳ ${fmtMoney(dueBalance)}</span></div>
            </div>
          </section>
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <div class="signature-section">
            <div class="sig-box">Prepared By (Pharmacist)</div>
            <div class="sig-box">Customer Signature</div>
            <div class="sig-box">Authorized Signatory</div>
          </div>

          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(statementHtml, `Customer Statement - ${customer.name}`);
  }

  /**
   * Generates and prints an executive Supplier Statement of Account (Ledger).
   */
  printSupplierStatement(supplier: SupplierStatementPrintData, entries: any[] = []): void {
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const printTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const rowsHtml = entries.length > 0
      ? entries.map((entry, index) => {
          const debit = Number(entry.debit) || 0;
          const credit = Number(entry.credit) || 0;
          const balance = Number(entry.balance) || 0;
          totalDebit += debit;
          totalCredit += credit;

          const dateStr = entry.doc_date
            ? new Date(entry.doc_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              }) + ' ' + new Date(entry.doc_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : '—';

          return `
            <tr>
              <td class="text-center font-mono">${index + 1}</td>
              <td class="font-mono">${dateStr}</td>
              <td class="font-bold font-mono">${entry.doc_no || '—'}</td>
              <td>${entry.doc_type || 'Ledger Entry'}</td>
              <td class="text-right font-mono">${debit > 0 ? '৳ ' + fmtMoney(debit) : '—'}</td>
              <td class="text-right font-mono text-emerald">${credit > 0 ? '৳ ' + fmtMoney(credit) : '—'}</td>
              <td class="text-right font-mono font-bold ${balance > 0 ? 'text-rose' : 'text-emerald'}">৳ ${fmtMoney(balance)}</td>
              <td>${entry.note || '—'}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="8" class="text-center" style="padding: 24px; color: #94a3b8;">
            No transaction records found for this supplier.
          </td>
        </tr>
      `;

    const dueBalance = supplier.balance !== undefined ? supplier.balance : (totalDebit - totalCredit);

    const statementHtml = `
      <div class="invoice-container">
        <div id="printable-content">
          <header class="doc-header">
            <h1 class="pharmacy-title">${this.defaultPharmacy.name}</h1>
            <p class="pharmacy-branch">${this.defaultPharmacy.branch}</p>
            <p class="pharmacy-meta">Hotline: ${this.defaultPharmacy.phone} <span class="sep">|</span> DL: ${this.defaultPharmacy.dl}</p>
            <div class="header-divider"></div>
          </header>

          <div class="doc-title-badge">SUPPLIER STATEMENT OF ACCOUNT (LEDGER)</div>

          <section class="meta-card">
            <div class="meta-col">
              <div class="meta-item"><span class="meta-label">Supplier / Vendor:</span> <strong class="meta-val">${supplier.name}</strong></div>
              <div class="meta-item"><span class="meta-label">Contact Phone:</span> <span class="meta-val font-mono">${supplier.phone || 'N/A'}</span></div>
              ${supplier.note ? `<div class="meta-item"><span class="meta-label">Note:</span> <span class="meta-val">${supplier.note}</span></div>` : ''}
            </div>
            <div class="meta-col meta-right">
              <div class="meta-item"><span class="meta-label">Statement Date:</span> <span class="meta-val font-mono">${today} ${printTime}</span></div>
              <div class="meta-item"><span class="meta-label">Net Payable Due:</span> <strong class="meta-val font-mono text-rose" style="font-size: 13px;">৳ ${fmtMoney(dueBalance)}</strong></div>
              <div class="meta-item"><span class="meta-label">Account Status:</span> <span class="meta-val font-bold ${Number(dueBalance) > 0 ? 'text-rose' : 'text-emerald'}">${Number(dueBalance) > 0 ? 'PAYABLE' : 'CLEARED'}</span></div>
            </div>
          </section>

          <main class="table-wrapper">
            <table class="invoice-table">
              <thead>
                <tr>
                  <th class="text-center" style="width: 32px;">#</th>
                  <th style="width: 110px;">Date & Time</th>
                  <th style="width: 90px;">Doc #</th>
                  <th style="width: 100px;">Type</th>
                  <th class="text-right" style="width: 85px;">Purchase (৳)</th>
                  <th class="text-right" style="width: 85px;">Paid (৳)</th>
                  <th class="text-right" style="width: 95px;">Balance (৳)</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </main>

          <section class="summary-wrapper">
            <div class="summary-box">
              <div class="sum-row"><span>Total Invoiced / Purchase:</span> <span class="font-mono">৳ ${fmtMoney(totalDebit)}</span></div>
              <div class="sum-row"><span>Total Payments Made:</span> <span class="font-mono text-emerald">৳ ${fmtMoney(totalCredit)}</span></div>
              <div class="sum-row sum-net"><span>Net Payable Balance:</span> <span class="font-mono text-rose">৳ ${fmtMoney(dueBalance)}</span></div>
            </div>
          </section>
        </div>

        <div id="bottom-spacer"></div>

        <div id="last-page-footer" class="last-page-footer-group">
          <div class="signature-section">
            <div class="sig-box">Procurement Officer</div>
            <div class="sig-box">Vendor Representative</div>
            <div class="sig-box">Accounts Department</div>
          </div>

          <footer class="doc-footer">
            <span class="footer-left">AidlyPms by Infoaidtech Solutions</span>
          </footer>
        </div>
      </div>
    `;

    this.printHtml(statementHtml, `Supplier Statement - ${supplier.name}`);
  }
}

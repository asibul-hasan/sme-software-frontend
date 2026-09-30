import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  /**
   * Prints arbitrary HTML content in a dedicated, isolated hidden iframe.
   * This guarantees that app chrome, modal wrappers, close buttons, and background pages
   * are completely excluded from the print preview.
   */
  printHtml(htmlContent: string, title = 'Aidly PMS Document'): void {
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
      // Fallback
      window.print();
      return;
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
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #1e293b;
            line-height: 1.4;
            background: #ffffff;
            padding: 4px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .company-name {
            font-size: 18px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .company-tagline {
            font-size: 11px;
            color: #475569;
            margin-top: 2px;
          }
          .company-contact {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .doc-badge-box {
            text-align: right;
          }
          .doc-badge {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .doc-meta {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
          }
          .info-card {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .info-row {
            margin-bottom: 4px;
          }
          .info-label {
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 600;
            display: inline-block;
            width: 100px;
          }
          .info-value {
            font-weight: 700;
            color: #0f172a;
            font-size: 11px;
          }
          .due-badge {
            text-align: right;
            border-left: 1px dashed #cbd5e1;
            padding-left: 14px;
          }
          .due-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
          }
          .due-amount {
            font-size: 16px;
            font-weight: 800;
            color: #dc2626;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            margin-top: 2px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #334155;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          table.data-table th {
            background: #f1f5f9;
            color: #1e293b;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            padding: 7px 8px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          table.data-table td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
          }
          table.data-table tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .font-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
          .font-bold {
            font-weight: 700;
          }
          .text-emerald {
            color: #047857;
          }
          .text-rose {
            color: #b91c1c;
          }
          .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
          }
          .summary-card {
            width: 280px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            overflow: hidden;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
          }
          .summary-row:last-child {
            border-bottom: none;
            background: #f1f5f9;
            font-weight: 800;
            font-size: 12px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 45px;
            padding-top: 15px;
          }
          .sig-box {
            width: 170px;
            text-align: center;
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            font-size: 10px;
            color: #64748b;
          }
          .footer-note {
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }

  /**
   * Prints the DOM element specified by its HTML element or ID in a standard document view.
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
   * Generates and prints a standard, official Customer Statement of Account (Ledger).
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
              <td class="text-right font-mono">${debit > 0 ? '৳ ' + debit.toFixed(2) : '—'}</td>
              <td class="text-right font-mono text-emerald">${credit > 0 ? '৳ ' + credit.toFixed(2) : '—'}</td>
              <td class="text-right font-mono font-bold ${balance > 0 ? 'text-rose' : 'text-emerald'}">৳ ${balance.toFixed(2)}</td>
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
      <div class="doc-header">
        <div>
          <div class="company-name">Aidly Model Pharmacy</div>
          <div class="company-tagline">Central Pharmacy & Retail Inventory Management System</div>
          <div class="company-contact">Dhaka, Bangladesh · Phone: +880 1700-000000 · Email: info@aidly.com</div>
        </div>
        <div class="doc-badge-box">
          <div class="doc-badge">Statement of Account</div>
          <div class="doc-meta">Statement Date: <strong>${today}</strong></div>
          <div class="doc-meta">Printed at: ${printTime}</div>
        </div>
      </div>

      <div class="info-card">
        <div>
          <div class="info-row">
            <span class="info-label">Customer Name:</span>
            <span class="info-value" style="font-size: 13px;">${customer.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact Phone:</span>
            <span class="info-value font-mono">${customer.phone || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer Type:</span>
            <span class="info-value">${customer.type || 'Regular Customer'}</span>
          </div>
          ${customer.points ? `
          <div class="info-row">
            <span class="info-label">Loyalty Points:</span>
            <span class="info-value font-mono" style="color: #d97706;">${customer.points} pts</span>
          </div>` : ''}
        </div>
        <div class="due-badge">
          <div class="due-label">Current Outstanding Due</div>
          <div class="due-amount">৳ ${Number(dueBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Status: <strong>${Number(dueBalance) > 0 ? 'PAYABLE DUE' : 'CLEAR / BALANCED'}</strong></div>
        </div>
      </div>

      <div class="section-title">
        <span>Ledger Transaction History</span>
        <span>${entries.length} Transaction(s) Listed</span>
      </div>

      <table class="data-table">
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

      <div class="summary-container">
        <div class="summary-card">
          <div class="summary-row">
            <span>Total Sales / Debit:</span>
            <span class="font-mono">৳ ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span>Total Payments / Credit:</span>
            <span class="font-mono text-emerald">৳ ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span>Net Outstanding Due:</span>
            <span class="font-mono text-rose">৳ ${Number(dueBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="signature-section">
        <div class="sig-box">Pharmacist / Prepared By</div>
        <div class="sig-box">Customer Signature</div>
        <div class="sig-box">Authorized Signatory</div>
      </div>

      <div class="footer-note">
        This is a computer-generated statement from Aidly Pharmacy Management System. Printed on ${today} ${printTime}.
      </div>
    `;

    this.printHtml(statementHtml, `Customer Statement - ${customer.name}`);
  }

  /**
   * Generates and prints a standard, official Supplier Statement of Account (Ledger).
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
              <td class="text-right font-mono">${debit > 0 ? '৳ ' + debit.toFixed(2) : '—'}</td>
              <td class="text-right font-mono text-emerald">${credit > 0 ? '৳ ' + credit.toFixed(2) : '—'}</td>
              <td class="text-right font-mono font-bold ${balance > 0 ? 'text-rose' : 'text-emerald'}">৳ ${balance.toFixed(2)}</td>
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
      <div class="doc-header">
        <div>
          <div class="company-name">Aidly Model Pharmacy</div>
          <div class="company-tagline">Procurement & Supply Chain Management</div>
          <div class="company-contact">Dhaka, Bangladesh · Phone: +880 1700-000000 · Email: supply@aidly.com</div>
        </div>
        <div class="doc-badge-box">
          <div class="doc-badge">Supplier Statement of Account</div>
          <div class="doc-meta">Statement Date: <strong>${today}</strong></div>
          <div class="doc-meta">Printed at: ${printTime}</div>
        </div>
      </div>

      <div class="info-card">
        <div>
          <div class="info-row">
            <span class="info-label">Supplier / Vendor:</span>
            <span class="info-value" style="font-size: 13px;">${supplier.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact Phone:</span>
            <span class="info-value font-mono">${supplier.phone || 'N/A'}</span>
          </div>
          ${supplier.note ? `
          <div class="info-row">
            <span class="info-label">Vendor Note:</span>
            <span class="info-value">${supplier.note}</span>
          </div>` : ''}
        </div>
        <div class="due-badge">
          <div class="due-label">Outstanding Payable Balance</div>
          <div class="due-amount">৳ ${Number(dueBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Status: <strong>${Number(dueBalance) > 0 ? 'PAYABLE' : 'CLEARED'}</strong></div>
        </div>
      </div>

      <div class="section-title">
        <span>Vendor Transaction History</span>
        <span>${entries.length} Transaction(s) Listed</span>
      </div>

      <table class="data-table">
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

      <div class="summary-container">
        <div class="summary-card">
          <div class="summary-row">
            <span>Total Invoiced / Purchase:</span>
            <span class="font-mono">৳ ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span>Total Payments Made:</span>
            <span class="font-mono text-emerald">৳ ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span>Net Payable Balance:</span>
            <span class="font-mono text-rose">৳ ${Number(dueBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="signature-section">
        <div class="sig-box">Procurement Officer</div>
        <div class="sig-box">Vendor / Representative</div>
        <div class="sig-box">Accounts Department</div>
      </div>

      <div class="footer-note">
        This is an official vendor statement from Aidly Pharmacy Management System. Printed on ${today} ${printTime}.
      </div>
    `;

    this.printHtml(statementHtml, `Supplier Statement - ${supplier.name}`);
  }
}

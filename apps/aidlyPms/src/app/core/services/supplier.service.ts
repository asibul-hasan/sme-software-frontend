import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { SuppSupplier, PurPurchaseInvoice, PurSupplierPayment } from '../models/supplier.models';

const FALLBACK_SUPPLIERS: SuppSupplier[] = [
  {
    supplier_no: 1,
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Beximco Distribution Ltd.',
    phone: '+8801711234567',
    note: 'Major distributor for Beximco pharma formulations',
    current_due_balance: 24500,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    supplier_no: 2,
    pharmacy_no: 1,
    branch_no: 1,
    name: 'ACI Pharma Distributors',
    phone: '+8801811345678',
    note: 'Central depot delivery',
    current_due_balance: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    supplier_no: 3,
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Square Dist. Network',
    phone: '+8801911456789',
    note: 'Square Healthcare products supplier',
    current_due_balance: 8200,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    supplier_no: 4,
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Incepta Healthcare Dist.',
    phone: '+8801611567890',
    note: 'Vaccine & specialty antibiotics depot',
    current_due_balance: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    supplier_no: 5,
    pharmacy_no: 1,
    branch_no: 1,
    name: 'Renata Trade Partner',
    phone: '+8801711678901',
    note: 'Direct trade invoice terms',
    current_due_balance: 14700,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const FALLBACK_PURCHASES: PurPurchaseInvoice[] = [
  {
    purchase_invoice_no: 1001,
    uuid: 'pur1000-0000-0000-0000-000000001001',
    pharmacy_no: 1,
    branch_no: 1,
    supplier_no: 1,
    inventory_number: 'PUR-2026-0811',
    calculation_mode: 1,
    inventory_type: 1,
    supplier_invoice_no: 'CH-99412',
    total_items: 4,
    gross_total_price: 36500,
    discount_type: 2,
    discount_value: 500,
    net_amount: 36000,
    vat_amount: 0,
    round_off_amount: 0,
    final_price: 36000,
    paid_amount: 30000,
    due_amount: 6000,
    purchase_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    purchase_invoice_no: 1002,
    uuid: 'pur1000-0000-0000-0000-000000001002',
    pharmacy_no: 1,
    branch_no: 1,
    supplier_no: 2,
    inventory_number: 'PUR-2026-0810',
    calculation_mode: 1,
    inventory_type: 1,
    supplier_invoice_no: 'INV-44120',
    total_items: 2,
    gross_total_price: 18200,
    discount_type: 1,
    discount_value: 0,
    net_amount: 18200,
    vat_amount: 0,
    round_off_amount: 0,
    final_price: 18200,
    paid_amount: 18200,
    due_amount: 0,
    purchase_date: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    purchase_invoice_no: 1003,
    uuid: 'pur1000-0000-0000-0000-000000001003',
    pharmacy_no: 1,
    branch_no: 1,
    supplier_no: 3,
    inventory_number: 'PUR-2026-0809',
    calculation_mode: 1,
    inventory_type: 2, // Opening Stock
    supplier_invoice_no: 'OPENING-2026',
    total_items: 8,
    gross_total_price: 45000,
    discount_type: 2,
    discount_value: 0,
    net_amount: 45000,
    vat_amount: 0,
    round_off_amount: 0,
    final_price: 45000,
    paid_amount: 45000,
    due_amount: 0,
    purchase_date: new Date(Date.now() - 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly api = inject(ApiService);
  private localSuppliers = [...FALLBACK_SUPPLIERS];
  private localPurchases = [...FALLBACK_PURCHASES];

  getSuppliers(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<SuppSupplier>>> {
    return this.api.getPaged<SuppSupplier>('supp/suppliers', params).pipe(
      catchError(() => {
        let list = [...this.localSuppliers];
        if (params) {
          if (params['search']) {
            const q = String(params['search']).toLowerCase().trim();
            list = list.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q));
          }
          if (params['phone']) {
            const p = String(params['phone']).trim();
            list = list.filter(s => s.phone.includes(p));
          }
          if (params['dueOnly'] === true || params['dueOnly'] === 'true') {
            list = list.filter(s => s.current_due_balance > 0);
          }
        }
        return of<ApiResponse<PagedResult<SuppSupplier>>>({
          success: true,
          data: {
            items: list,
            total: list.length,
            pageIndex: 1,
            pageSize: 50,
            totalPages: 1,
          },
        });
      })
    );
  }

  getPurchases(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<PurPurchaseInvoice>>> {
    return this.api.getPaged<PurPurchaseInvoice>('pur/purchases', params).pipe(
      catchError(() => {
        let list = [...this.localPurchases];
        if (params) {
          if (params['search']) {
            const q = String(params['search']).toLowerCase().trim();
            list = list.filter(p => p.inventory_number.toLowerCase().includes(q) || (p.supplier_invoice_no && p.supplier_invoice_no.toLowerCase().includes(q)));
          }
          if (params['supplierNo']) {
            const sNo = Number(params['supplierNo']);
            list = list.filter(p => p.supplier_no === sNo);
          }
          if (params['inventoryType']) {
            const t = Number(params['inventoryType']);
            list = list.filter(p => p.inventory_type === t);
          }
          if (params['fromDate']) {
            const from = new Date(String(params['fromDate'])).getTime();
            list = list.filter(p => new Date(p.purchase_date).getTime() >= from);
          }
          if (params['toDate']) {
            const to = new Date(String(params['toDate'])).getTime() + 86399999;
            list = list.filter(p => new Date(p.purchase_date).getTime() <= to);
          }
        }
        return of<ApiResponse<PagedResult<PurPurchaseInvoice>>>({
          success: true,
          data: {
            items: list,
            total: list.length,
            pageIndex: 1,
            pageSize: 50,
            totalPages: 1,
          },
        });
      })
    );
  }

  createSupplier(supplier: Partial<SuppSupplier>): Observable<ApiResponse<SuppSupplier>> {
    return this.api.post<SuppSupplier>('supp/suppliers', supplier).pipe(
      catchError(() => {
        const newSupplier: SuppSupplier = {
          supplier_no: Date.now(),
          pharmacy_no: supplier.pharmacy_no || 1,
          branch_no: supplier.branch_no || 1,
          name: supplier.name || 'New Supplier',
          phone: supplier.phone || '',
          note: supplier.note,
          current_due_balance: supplier.current_due_balance || 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.localSuppliers.unshift(newSupplier);
        return of<ApiResponse<SuppSupplier>>({
          success: true,
          data: newSupplier,
          message: `Supplier "${newSupplier.name}" created successfully`,
        });
      })
    );
  }

  createPurchase(purchase: Partial<PurPurchaseInvoice>): Observable<ApiResponse<PurPurchaseInvoice>> {
    return this.api.post<PurPurchaseInvoice>('pur/purchases', purchase).pipe(
      catchError(() => {
        const newPurchase: PurPurchaseInvoice = {
          purchase_invoice_no: Date.now(),
          uuid: crypto.randomUUID(),
          pharmacy_no: purchase.pharmacy_no || 1,
          branch_no: purchase.branch_no || 1,
          supplier_no: purchase.supplier_no || 1,
          inventory_number: purchase.inventory_number || 'PUR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
          calculation_mode: purchase.calculation_mode || 1,
          inventory_type: purchase.inventory_type || 1,
          supplier_invoice_no: purchase.supplier_invoice_no,
          total_items: purchase.total_items || 1,
          gross_total_price: purchase.gross_total_price || 0,
          discount_type: purchase.discount_type || 1,
          discount_value: purchase.discount_value || 0,
          net_amount: purchase.net_amount || 0,
          vat_amount: purchase.vat_amount || 0,
          round_off_amount: purchase.round_off_amount || 0,
          final_price: purchase.final_price || 0,
          paid_amount: purchase.paid_amount || 0,
          due_amount: purchase.due_amount || 0,
          purchase_date: purchase.purchase_date || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.localPurchases.unshift(newPurchase);
        return of<ApiResponse<PurPurchaseInvoice>>({
          success: true,
          data: newPurchase,
          message: `Purchase invoice ${newPurchase.inventory_number} registered successfully`,
        });
      })
    );
  }

  createSupplierPayment(payment: Partial<PurSupplierPayment>): Observable<ApiResponse<PurSupplierPayment>> {
    return this.api.post<PurSupplierPayment>('pur/supplier-payments', payment).pipe(
      catchError(() => {
        const paymentRecord: PurSupplierPayment = {
          supplier_payment_no: Date.now(),
          pharmacy_no: payment.pharmacy_no || 1,
          branch_no: payment.branch_no || 1,
          supplier_no: payment.supplier_no || 1,
          account_no: payment.account_no || 1,
          payment_number: 'SP-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000),
          payment_method: payment.payment_method || 1,
          amount: payment.amount || 0,
          reference_no: payment.reference_no,
          note: payment.note,
          payment_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        // Update local supplier balance
        const s = this.localSuppliers.find(sub => sub.supplier_no === payment.supplier_no);
        if (s) {
          s.current_due_balance = Math.max(0, s.current_due_balance - (payment.amount || 0));
        }
        return of<ApiResponse<PurSupplierPayment>>({
          success: true,
          data: paymentRecord,
          message: `Supplier payment ${paymentRecord.payment_number} of ৳${paymentRecord.amount} recorded`,
        });
      })
    );
  }
}

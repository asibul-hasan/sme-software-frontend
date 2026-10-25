import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ApiResponse, PagedResult } from '../models/common.models';
import { ProdProduct, ProdProductBatch } from '../models/product.models';
import { CustCustomer, SaleInvoice } from '../models/customer.models';
import { CreateSalePayload, PosSaleService } from './pos-sale.service';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { OfflineStoreService } from './offline-store.service';
import { ConnectivityService } from './connectivity.service';
import { SyncService } from './sync.service';
import { QueuedSale } from '../models/offline.models';

@Injectable({
  providedIn: 'root',
})
export class PosGatewayService {
  private readonly posSaleService = inject(PosSaleService);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly offlineStore = inject(OfflineStoreService);
  private readonly connectivity = inject(ConnectivityService);
  private readonly syncService = inject(SyncService);

  // --- Product Lookups ---

  getProducts(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<ProdProduct>>> {
    if (this.connectivity.isOnline()) {
      return this.productService.getProducts(params).pipe(
        catchError(err => {
          console.warn('[PosGateway] Failed to fetch online products, falling back to offline cache:', err);
          return this.getOfflineProductsFallback();
        })
      );
    }
    return this.getOfflineProductsFallback();
  }

  private getOfflineProductsFallback(): Observable<ApiResponse<PagedResult<ProdProduct>>> {
    return from(this.offlineStore.searchProducts('', 200)).pipe(
      switchMap(snapshots => {
        const items: ProdProduct[] = snapshots.map(s => ({
          product_no: s.product_no,
          uuid: String(s.product_no),
          pharmacy_no: 1,
          branch_no: 1,
          company_no: 1,
          product_name: s.product_name,
          brand_name: s.product_name,
          generic_name: s.generic_name || 'General',
          company_name: s.company_name || 'Local Pharma',
          strength: s.strength || '',
          volume: null,
          medicine_type: 1,
          unit_type: 1,
          quantity_per_box: s.box_size || 10,
          cost_per_box: (s.purchase_price || 0) * (s.box_size || 10),
          sale_price_per_box: (s.unit_price || 0) * (s.box_size || 10),
          avg_purchase_price_per_piece: s.purchase_price || 0,
          purchase_price_per_piece: s.purchase_price || 0,
          sale_price_per_piece: s.unit_price || 0,
          wholesale_price_per_box: (s.unit_price || 0) * (s.box_size || 10) * 0.9,
          wholesale_price_per_piece: (s.unit_price || 0) * 0.9,
          barcode_value: s.barcode_value || null,
          is_medicine: true,
          is_prescription_required: s.is_prescription_required,
          is_narcotic: s.is_narcotic,
          min_stock_qty_pcs: 10,
          stock_qty: 100, // Available from cached batches
          is_active: s.is_active,
          created_at: s.updated_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString(),
        }));

        const result: ApiResponse<PagedResult<ProdProduct>> = {
          success: true,
          message: 'Loaded from offline storage',
          data: {
            items,
            total: items.length,
            pageIndex: 1,
            pageSize: items.length,
            totalPages: 1,
          },
        };
        return of(result);
      })
    );
  }

  getBatches(): Observable<ApiResponse<ProdProductBatch[]>> {
    if (this.connectivity.isOnline()) {
      return this.productService.getBatches().pipe(
        catchError(err => {
          console.warn('[PosGateway] Failed to fetch online batches, falling back to offline cache:', err);
          return this.getOfflineBatchesFallback();
        })
      );
    }
    return this.getOfflineBatchesFallback();
  }

  private getOfflineBatchesFallback(): Observable<ApiResponse<ProdProductBatch[]>> {
    return from(this.offlineStore.searchProducts('', 200)).pipe(
      switchMap(async prods => {
        const allBatches: ProdProductBatch[] = [];
        for (const p of prods) {
          const bList = await this.offlineStore.getBatchesForProduct(p.product_no);
          for (const b of bList) {
            allBatches.push(this.mapBatchDtoToProdBatch(b));
          }
        }
        return {
          success: true,
          message: 'Loaded from offline storage',
          data: allBatches,
        };
      })
    );
  }

  getProductBatches(productNo: number): Observable<ApiResponse<ProdProductBatch[]>> {
    if (this.connectivity.isOnline()) {
      return this.productService.getProductBatches(productNo).pipe(
        catchError(err => {
          console.warn(`[PosGateway] Failed to fetch batches for product ${productNo}, falling back:`, err);
          return this.getOfflineProductBatchesFallback(productNo);
        })
      );
    }
    return this.getOfflineProductBatchesFallback(productNo);
  }

  private getOfflineProductBatchesFallback(productNo: number): Observable<ApiResponse<ProdProductBatch[]>> {
    return from(this.offlineStore.getBatchesForProduct(productNo)).pipe(
      switchMap(batches => {
        const mapped = batches.map(b => this.mapBatchDtoToProdBatch(b));
        return of({
          success: true,
          message: 'Loaded from offline storage',
          data: mapped,
        });
      })
    );
  }

  private mapBatchDtoToProdBatch(b: any): ProdProductBatch {
    return {
      batch_no: b.batch_no,
      pharmacy_no: 1,
      branch_no: 1,
      product_no: b.product_no,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      box_quantity: b.box_qty || 0,
      quantity_in_box: 10,
      total_quantity_pcs: b.available_qty,
      cost_per_box: (b.cost_price || 0) * (b.box_qty || 10),
      sale_price_per_box: (b.sale_price || 0) * (b.box_qty || 10),
      vat_percent: 0,
      is_expired: false,
      is_placeholder: false,
      created_at: b.updated_at || new Date().toISOString(),
      updated_at: b.updated_at || new Date().toISOString(),
    };
  }

  // --- Customer Lookups ---

  getCustomers(params?: Record<string, unknown>): Observable<ApiResponse<PagedResult<CustCustomer>>> {
    if (this.connectivity.isOnline()) {
      return this.customerService.getCustomers(params).pipe(
        catchError(err => {
          console.warn('[PosGateway] Failed to fetch online customers, falling back:', err);
          return this.getOfflineCustomersFallback();
        })
      );
    }
    return this.getOfflineCustomersFallback();
  }

  private getOfflineCustomersFallback(): Observable<ApiResponse<PagedResult<CustCustomer>>> {
    return from(this.offlineStore.searchCustomers('', 100)).pipe(
      switchMap(snapshots => {
        const items: CustCustomer[] = snapshots.map(c => ({
          customer_no: c.customer_no,
          uuid: String(c.customer_no),
          pharmacy_no: 1,
          branch_no: 1,
          name: c.customer_name,
          phone: c.phone || '',
          gender: 1,
          customer_type: 1,
          discount_percent: 0,
          address: c.address || '',
          has_due: c.current_due > 0,
          current_due: c.current_due || 0,
          is_loyalty_member: c.loyalty_points > 0,
          loyalty_points: c.loyalty_points || 0,
          is_active: true,
          created_at: c.updated_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
        }));

        return of({
          success: true,
          message: 'Loaded from offline storage',
          data: {
            items,
            total: items.length,
            pageIndex: 1,
            pageSize: items.length,
            totalPages: 1,
          },
        });
      })
    );
  }

  // --- Sale Creation (Online with Automatic Offline Fallback) ---

  createSale(payload: CreateSalePayload): Observable<ApiResponse<SaleInvoice>> {
    if (this.connectivity.isOnline()) {
      return this.posSaleService.createSale(payload).pipe(
        catchError((err: any) => {
          // If error is network offline or gateway timeout (502, 503, 504, 0)
          const status = err?.status;
          const isNetworkError = !status || status === 0 || status === 502 || status === 503 || status === 504;

          if (isNetworkError) {
            console.warn('[PosGateway] Online sale failed due to network/server timeout. Falling back to offline queue:', err);
            return from(this.processOfflineSale(payload));
          }

          // Do NOT queue on 4xx (400 validation error, 401 auth, 409 conflict, etc.)!
          return throwError(() => err);
        })
      );
    }

    return from(this.processOfflineSale(payload));
  }

  private async processOfflineSale(payload: CreateSalePayload): Promise<ApiResponse<SaleInvoice>> {
    // 1. Verify offline sales are enabled in config
    const config = await this.offlineStore.getSaleConfig();
    if (config && config.offline_pos_enabled === false) {
      throw new Error('Offline sales are disabled by pharmacy configuration.');
    }

    // 2. Validate items: Reject narcotic or prescription medicines
    if (payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        if (!item.product_no) continue;
        const prod = await this.offlineStore.getProduct(item.product_no);
        if (prod) {
          if (prod.is_narcotic || prod.is_prescription_required) {
            throw new Error(`Offline sale of narcotic or prescription medicine (${prod.product_name}) is prohibited. Needs internet.`);
          }
        }

        // Validate stock if out_of_stock_sale is disabled
        if (config && config.out_of_stock_sale === false) {
          const batches = await this.offlineStore.getBatchesForProduct(item.product_no);
          const totalAvailable = batches.reduce((sum, b) => sum + (b.available_qty || 0), 0);
          const reqQty = item.sale_qty || 0;
          if (totalAvailable < reqQty) {
            throw new Error(`Insufficient offline stock for ${item.product_name || 'selected item'}.`);
          }
        }
      }
    }

    // 3. Generate idempotency key & sequential offline receipt number
    const idempotencyKey = crypto.randomUUID();
    const offlineReceiptNo = await this.offlineStore.getNextOfflineReceiptNo('POS-1');
    const clientCreatedAt = new Date().toISOString();
    const offlineClientTotal = payload.invoice?.final_price ?? 0;

    // 4. Enqueue sale
    const queuedSale: QueuedSale = {
      idempotency_key: idempotencyKey,
      offline_receipt_no: offlineReceiptNo,
      created_at: clientCreatedAt,
      client_created_at: clientCreatedAt,
      offline_client_total: offlineClientTotal,
      status: 'Pending',
      retry_count: 0,
      payload: {
        ...payload,
        invoice: {
          ...payload.invoice,
          idempotency_key: idempotencyKey,
          is_offline: true,
          client_created_at: clientCreatedAt,
          offline_receipt_no: offlineReceiptNo,
          offline_client_total: offlineClientTotal,
        },
      },
    };

    await this.offlineStore.enqueueSale(queuedSale);

    // 5. Deduct local batch quantities in IndexedDB
    if (payload.items && payload.items.length > 0) {
      for (const item of payload.items) {
        if (item.batch_no && item.sale_qty) {
          await this.offlineStore.deductBatchQty(item.batch_no, item.sale_qty);
        }
      }
    }

    // 6. Refresh sync counts
    await this.syncService.refreshCounts();

    // 7. Return simulated SaleInvoice response marked offline
    const simulatedInvoice: SaleInvoice = {
      sale_invoice_no: 0,
      uuid: idempotencyKey,
      pharmacy_no: 1,
      branch_no: 1,
      customer_no: payload.invoice?.customer_no || 1,
      sales_number: offlineReceiptNo,
      sale_mode: payload.invoice?.sale_mode || 1,
      total_items: payload.items?.length || 0,
      gross_total_price: payload.invoice?.gross_total_price || 0,
      discount_type: payload.invoice?.discount_type || 1,
      discount_value: payload.invoice?.discount_value || 0,
      card_commission_percent: 0,
      card_commission_amount: 0,
      net_amount: payload.invoice?.net_amount || offlineClientTotal,
      vat_amount: payload.invoice?.vat_amount || 0,
      round_off_amount: payload.invoice?.round_off_amount || 0,
      final_price: offlineClientTotal,
      approximate_profit: 0,
      customer_will_pay: payload.invoice?.customer_will_pay || offlineClientTotal,
      change_amount: payload.invoice?.change_amount || 0,
      due_amount: payload.invoice?.due_amount || 0,
      payment_method: payload.invoice?.payment_method || 1,
      cash_received_status: 1,
      received_by_user_no: 1,
      salesman_user_no: 1,
      is_quick_printed: false,
      sale_timestamp: clientCreatedAt,
      is_offline: true,
      client_created_at: clientCreatedAt,
      offline_receipt_no: offlineReceiptNo,
      offline_client_total: offlineClientTotal,
      late_sync: false,
      idempotency_key: idempotencyKey,
      created_at: clientCreatedAt,
      updated_at: clientCreatedAt,
      items: payload.items as any,
      payments: payload.payments as any,
    };

    return {
      success: true,
      message: 'Offline sale queued for synchronization',
      data: simulatedInvoice,
    };
  }
}

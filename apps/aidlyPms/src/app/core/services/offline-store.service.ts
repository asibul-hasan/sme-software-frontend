import { Injectable } from '@angular/core';
import { CfgSaleConfig } from '../models/config.models';
import {
  PosCatalogSnapshotDto,
  SnapshotProductDto,
  SnapshotBatchDto,
  SnapshotCustomerDto,
  QueuedSale,
  SyncLogEntry,
} from '../models/offline.models';
import { validateDiscardReason } from './offline-queue-manager';

const DB_NAME = 'AidlyPmsOfflineDb';
const DB_VERSION = 1;

export const STORES = {
  PRODUCTS: 'catalog_products',
  BATCHES: 'catalog_batches',
  CUSTOMERS: 'catalog_customers',
  META: 'meta',
  SALE_QUEUE: 'sale_queue',
  SYNC_LOG: 'sync_log',
} as const;

@Injectable({
  providedIn: 'root',
})
export class OfflineStoreService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        // 1. Products store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'product_no' });
          productStore.createIndex('idx_product_name', 'product_name', { unique: false });
          productStore.createIndex('idx_generic_name', 'generic_name', { unique: false });
          productStore.createIndex('idx_strength', 'strength', { unique: false });
          productStore.createIndex('idx_barcode_value', 'barcode_value', { unique: false });
        }

        // 2. Batches store
        if (!db.objectStoreNames.contains(STORES.BATCHES)) {
          const batchStore = db.createObjectStore(STORES.BATCHES, { keyPath: 'batch_no' });
          batchStore.createIndex('idx_product_no', 'product_no', { unique: false });
          batchStore.createIndex('idx_expiry_date', 'expiry_date', { unique: false });
        }

        // 3. Customers store
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'customer_no' });
          customerStore.createIndex('idx_customer_name', 'customer_name', { unique: false });
          customerStore.createIndex('idx_phone', 'phone', { unique: false });
        }

        // 4. Meta store
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }

        // 5. Sale queue store
        if (!db.objectStoreNames.contains(STORES.SALE_QUEUE)) {
          const saleQueueStore = db.createObjectStore(STORES.SALE_QUEUE, { keyPath: 'idempotency_key' });
          saleQueueStore.createIndex('idx_status', 'status', { unique: false });
          saleQueueStore.createIndex('idx_created_at', 'created_at', { unique: false });
        }

        // 6. Sync log store
        if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
          const syncLogStore = db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id', autoIncrement: true });
          syncLogStore.createIndex('idx_timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Snapshot & Catalog Storage ---

  async saveCatalogSnapshot(snapshot: PosCatalogSnapshotDto): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        [STORES.PRODUCTS, STORES.BATCHES, STORES.CUSTOMERS, STORES.META],
        'readwrite'
      );

      const productStore = tx.objectStore(STORES.PRODUCTS);
      for (const p of snapshot.products || []) {
        productStore.put(p);
      }

      const batchStore = tx.objectStore(STORES.BATCHES);
      for (const b of snapshot.batches || []) {
        batchStore.put(b);
      }

      const customerStore = tx.objectStore(STORES.CUSTOMERS);
      for (const c of snapshot.customers || []) {
        customerStore.put(c);
      }

      const metaStore = tx.objectStore(STORES.META);
      metaStore.put({ key: 'last_snapshot_at', value: snapshot.server_time_utc || new Date().toISOString() });
      metaStore.put({ key: 'snapshot_version', value: snapshot.snapshot_version });
      if (snapshot.config) {
        metaStore.put({ key: 'sale_config', value: snapshot.config });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMetaValue<T>(key: string): Promise<T | null> {
    const db = await this.getDb();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const store = tx.objectStore(STORES.META);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? (req.result.value as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async setMetaValue<T>(key: string, value: T): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readwrite');
      const store = tx.objectStore(STORES.META);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getLastSnapshotMeta(): Promise<{ last_snapshot_at?: string; snapshot_version?: string }> {
    const last_snapshot_at = await this.getMetaValue<string>('last_snapshot_at');
    const snapshot_version = await this.getMetaValue<string>('snapshot_version');
    return {
      last_snapshot_at: last_snapshot_at || undefined,
      snapshot_version: snapshot_version || undefined,
    };
  }

  async getSaleConfig(): Promise<CfgSaleConfig | null> {
    return this.getMetaValue<CfgSaleConfig>('sale_config');
  }

  async saveSaleConfig(config: CfgSaleConfig): Promise<void> {
    return this.setMetaValue('sale_config', config);
  }

  // --- Products & Batches Lookup ---

  async searchProducts(query: string, limit = 50): Promise<SnapshotProductDto[]> {
    const db = await this.getDb();
    const term = (query || '').trim().toLowerCase();

    return new Promise<SnapshotProductDto[]>((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as SnapshotProductDto[]) || [];
        if (!term) {
          resolve(all.filter(p => p.is_active).slice(0, limit));
          return;
        }

        const matches: SnapshotProductDto[] = [];
        for (const p of all) {
          if (!p.is_active) continue;

          const barcode = (p.barcode_value || '').toLowerCase();
          const name = (p.product_name || '').toLowerCase();
          const generic = (p.generic_name || '').toLowerCase();
          const company = (p.company_name || '').toLowerCase();
          const strength = (p.strength || '').toLowerCase();

          if (barcode === term) {
            // Priority match on barcode
            matches.unshift(p);
          } else if (
            name.includes(term) ||
            generic.includes(term) ||
            company.includes(term) ||
            strength.includes(term)
          ) {
            matches.push(p);
          }

          if (matches.length >= limit * 2) break;
        }
        resolve(matches.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getProduct(productNo: number): Promise<SnapshotProductDto | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const req = store.get(productNo);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getBatchesForProduct(productNo: number): Promise<SnapshotBatchDto[]> {
    const db = await this.getDb();
    const now = new Date();

    return new Promise<SnapshotBatchDto[]>((resolve, reject) => {
      const tx = db.transaction(STORES.BATCHES, 'readonly');
      const store = tx.objectStore(STORES.BATCHES);
      const index = store.index('idx_product_no');
      const req = index.getAll(IDBKeyRange.only(productNo));

      req.onsuccess = () => {
        const batches = (req.result as SnapshotBatchDto[]) || [];
        // Filter non-expired, available_qty > 0, FEFO sorted
        const valid = batches.filter(b => {
          if (b.available_qty <= 0) return false;
          const exp = new Date(b.expiry_date);
          return exp >= now;
        });

        valid.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
        resolve(valid);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deductBatchQty(batchNo: number, qty: number): Promise<void> {
    if (qty <= 0) return;
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.BATCHES, 'readwrite');
      const store = tx.objectStore(STORES.BATCHES);
      const req = store.get(batchNo);

      req.onsuccess = () => {
        const batch = req.result as SnapshotBatchDto | undefined;
        if (batch) {
          batch.available_qty = Math.max(0, batch.available_qty - qty);
          store.put(batch);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Customers Lookup ---

  async searchCustomers(query: string, limit = 20): Promise<SnapshotCustomerDto[]> {
    const db = await this.getDb();
    const term = (query || '').trim().toLowerCase();

    return new Promise<SnapshotCustomerDto[]>((resolve, reject) => {
      const tx = db.transaction(STORES.CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORES.CUSTOMERS);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as SnapshotCustomerDto[]) || [];
        if (!term) {
          resolve(all.slice(0, limit));
          return;
        }

        const matches = all.filter(c => {
          const name = (c.customer_name || '').toLowerCase();
          const phone = (c.phone || '').toLowerCase();
          return name.includes(term) || phone.includes(term);
        });
        resolve(matches.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getCustomer(customerNo: number): Promise<SnapshotCustomerDto | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CUSTOMERS, 'readonly');
      const store = tx.objectStore(STORES.CUSTOMERS);
      const req = store.get(customerNo);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Sale Queue Management ---

  async enqueueSale(sale: QueuedSale): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      store.put(sale);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getQueueItem(idempotencyKey: string): Promise<QueuedSale | undefined> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      const req = store.get(idempotencyKey);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async updateQueueItem(idempotencyKey: string, updates: Partial<QueuedSale>): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      const req = store.get(idempotencyKey);

      req.onsuccess = () => {
        const item = req.result as QueuedSale | undefined;
        if (item) {
          const merged = { ...item, ...updates };
          store.put(merged);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingQueue(): Promise<QueuedSale[]> {
    const db = await this.getDb();
    return new Promise<QueuedSale[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSale[]) || [];
        const pending = all.filter(s => s.status === 'Pending');
        // Sort FIFO: oldest created_at first
        pending.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        resolve(pending);
      };
      req.onerror = () => reject(tx.error || req.error);
    });
  }

  async getAllQueue(): Promise<QueuedSale[]> {
    const db = await this.getDb();
    return new Promise<QueuedSale[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSale[]) || [];
        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(all);
      };
      req.onerror = () => reject(tx.error || req.error);
    });
  }

  async getQueueCounts(): Promise<{ pending: number; failed: number; synced: number; total: number }> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SALE_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.SALE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const all = (req.result as QueuedSale[]) || [];
        let pending = 0;
        let failed = 0;
        let synced = 0;
        for (const item of all) {
          if (item.status === 'Pending' || item.status === 'Syncing') pending++;
          else if (item.status === 'Failed') failed++;
          else if (item.status === 'Synced') synced++;
        }
        resolve({ pending, failed, synced, total: all.length });
      };
      req.onerror = () => reject(tx.error || req.error);
    });
  }

  async discardSale(idempotencyKey: string, reason: string): Promise<void> {
    const validReason = validateDiscardReason(reason);
    return this.updateQueueItem(idempotencyKey, {
      status: 'Discarded',
      last_error: `Discarded: ${validReason}`,
    });
  }

  // --- Offline Receipt Number Generation ---

  async getNextOfflineReceiptNo(terminalId = 'POS-1'): Promise<string> {
    const dhakaDate = this.getDhakaDateKey();
    const metaKey = `offline_seq_${terminalId}_${dhakaDate}`;
    const currentSeq = (await this.getMetaValue<number>(metaKey)) || 0;
    const nextSeq = currentSeq + 1;
    await this.setMetaValue(metaKey, nextSeq);

    const paddedSeq = nextSeq.toString().padStart(4, '0');
    return `OFF-${terminalId}-${dhakaDate}-${paddedSeq}`;
  }

  private getDhakaDateKey(): string {
    const d = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(d).replace(/-/g, '');
    } catch {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    }
  }

  // --- Sync Audit Log ---

  async logSync(entry: Omit<SyncLogEntry, 'id'>): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(STORES.SYNC_LOG, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_LOG);
      store.add({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    } catch {}
  }
}

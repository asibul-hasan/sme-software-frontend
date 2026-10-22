import { Injectable } from '@angular/core';

export interface PosHeldOrder {
  id: string;
  heldAt: string;
  customerName: string;
  customerId: string;
  mode: number;
  items: unknown[];
  total: number;
}

const DB_NAME = 'AidlyPmsPosDb';
const DB_VERSION = 1;
const STORE_NAME = 'held_orders';

@Injectable({
  providedIn: 'root',
})
export class PosStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAllHeldOrders<T extends { id: string }>(): Promise<T[]> {
    try {
      const db = await this.getDb();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const raw = localStorage.getItem('aidly_pms_pos_held_orders');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  }

  async saveAllHeldOrders<T extends { id: string }>(orders: T[]): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          for (const order of orders) {
            store.put(order);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        clearReq.onerror = () => reject(clearReq.error);
      });
    } catch {
      try {
        localStorage.setItem('aidly_pms_pos_held_orders', JSON.stringify(orders));
      } catch {}
    }
  }

  async putHeldOrder<T extends { id: string }>(order: T): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(order);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const current = await this.getAllHeldOrders<T>();
      const filtered = current.filter(o => o.id !== order.id);
      filtered.unshift(order);
      try {
        localStorage.setItem('aidly_pms_pos_held_orders', JSON.stringify(filtered));
      } catch {}
    }
  }

  async deleteHeldOrder(orderId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(orderId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const current = await this.getAllHeldOrders<{ id: string }>();
      const filtered = current.filter(o => o.id !== orderId);
      try {
        localStorage.setItem('aidly_pms_pos_held_orders', JSON.stringify(filtered));
      } catch {}
    }
  }
}

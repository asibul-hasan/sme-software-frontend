import test from 'node:test';
import assert from 'node:assert';
import {
  computeBackoffDelay,
  validateDiscardReason,
  sortQueueFifo,
  filterPendingQueue,
  resetOrphanedSyncing,
  OfflineQueueProcessor,
} from './offline-queue-manager.ts';
import type { QueuedSale } from './offline-queue-manager.ts';

function createDummySale(
  id: string,
  createdAt: string,
  status: QueuedSale['status'] = 'Pending',
  retryCount = 0
): QueuedSale {
  return {
    idempotency_key: `key-${id}`,
    offline_receipt_no: `OFF-POS1-20261026-000${id}`,
    created_at: createdAt,
    client_created_at: createdAt,
    offline_client_total: 150.0,
    status,
    retry_count: retryCount,
    payload: {
      invoice: {
        pharmacy_no: 1,
        branch_no: 1,
        total_amount: 150.0,
        paid_amount: 150.0,
        due_amount: 0,
        customer_no: 1,
        payment_method: 1,
        invoice_date: '2026-10-26',
        items: [
          {
            product_no: 101,
            batch_no: 501,
            quantity: 2,
            sale_price: 75.0,
            total_price: 150.0,
            vat_percent: 0,
            discount_percent: 0,
          },
        ],
      },
    },
  };
}

test('1. FIFO order: Pending sales are sorted and processed oldest created_at first', async () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z');
  const sale2 = createDummySale('2', '2026-10-26T11:00:00Z');
  const sale3 = createDummySale('3', '2026-10-26T12:00:00Z');

  // Insert out of order: sale3, sale1, sale2
  const processor = new OfflineQueueProcessor([sale3, sale1, sale2]);

  const pending = processor.getPendingQueue();
  assert.strictEqual(pending.length, 3);
  assert.strictEqual(pending[0].idempotency_key, 'key-1');
  assert.strictEqual(pending[1].idempotency_key, 'key-2');
  assert.strictEqual(pending[2].idempotency_key, 'key-3');

  // Verify syncAll processes in FIFO order
  const processedKeys: string[] = [];
  const result = await processor.syncAll(async (endpoint, payload) => {
    processedKeys.push(payload.invoice.idempotency_key!);
    return {
      sale_invoice_no: 100,
      sales_number: 'INV-100',
    };
  });

  assert.strictEqual(result.success, 3);
  assert.deepStrictEqual(processedKeys, ['key-1', 'key-2', 'key-3']);
});

test('2. Backoff schedule: Exponential backoff with 1s, 2s, 4s, 8s, 16s, capped at 30s', () => {
  assert.strictEqual(computeBackoffDelay(0), 1000);
  assert.strictEqual(computeBackoffDelay(1), 2000);
  assert.strictEqual(computeBackoffDelay(2), 4000);
  assert.strictEqual(computeBackoffDelay(3), 8000);
  assert.strictEqual(computeBackoffDelay(4), 16000);
  assert.strictEqual(computeBackoffDelay(5), 30000); // capped at 30000 ms
  assert.strictEqual(computeBackoffDelay(6), 30000);
  assert.strictEqual(computeBackoffDelay(10), 30000);

  // Custom base and max
  assert.strictEqual(computeBackoffDelay(2, 500, 10000), 2000);
  assert.strictEqual(computeBackoffDelay(6, 500, 10000), 10000); // capped at 10000
});

test('3. 401 halts sync: Authentication failure stops sync immediately, keeping items Pending', async () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z');
  const sale2 = createDummySale('2', '2026-10-26T11:00:00Z');
  const sale3 = createDummySale('3', '2026-10-26T12:00:00Z');

  const processor = new OfflineQueueProcessor([sale1, sale2, sale3]);

  let callsMade = 0;
  const result = await processor.syncAll(async (endpoint, payload) => {
    callsMade++;
    if (payload.invoice.idempotency_key === 'key-1') {
      const err: any = new Error('Token expired');
      err.status = 401;
      throw err;
    }
    return { sale_invoice_no: 1, sales_number: 'INV-1' };
  });

  assert.strictEqual(callsMade, 1, 'Sync loop must halt immediately on 401');
  assert.strictEqual(result.haltedByAuth, true);
  assert.strictEqual(result.success, 0);

  // Sale 1 reverted to Pending with auth error
  const item1 = processor.getItem('key-1');
  assert.strictEqual(item1?.status, 'Pending');
  assert.match(item1?.last_error || '', /Authentication required/);

  // Sales 2 and 3 remained untouched as Pending
  const item2 = processor.getItem('key-2');
  assert.strictEqual(item2?.status, 'Pending');
  assert.strictEqual(item2?.last_error, undefined);

  const item3 = processor.getItem('key-3');
  assert.strictEqual(item3?.status, 'Pending');
});

test('4. 4xx becomes Failed with no retry: 400/409/422 marks item Failed and excludes from auto-sync', async () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z');
  const sale2 = createDummySale('2', '2026-10-26T11:00:00Z');

  const processor = new OfflineQueueProcessor([sale1, sale2]);

  const result = await processor.syncAll(async (endpoint, payload) => {
    if (payload.invoice.idempotency_key === 'key-1') {
      const err: any = new Error('Item batch is expired on server');
      err.status = 400;
      throw err;
    }
    return { sale_invoice_no: 2, sales_number: 'INV-2' };
  });

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.success, 1);

  const item1 = processor.getItem('key-1');
  assert.strictEqual(item1?.status, 'Failed');
  assert.strictEqual(item1?.retry_count, 1);
  assert.strictEqual(item1?.last_error, 'Item batch is expired on server');

  const item2 = processor.getItem('key-2');
  assert.strictEqual(item2?.status, 'Synced');

  // Verify that the Failed item is NOT in the pending queue for subsequent syncs
  const nextPending = processor.getPendingQueue();
  assert.strictEqual(nextPending.length, 0, 'Failed items must not be included in auto-sync pending queue');
});

test('5. Idempotency key reused on retry: Retrying a failed sale preserves original key and sends it to server', async () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z', 'Failed', 1);
  sale1.last_error = 'Conflict 409';

  const processor = new OfflineQueueProcessor([sale1]);

  // Initially not in pending queue
  assert.strictEqual(processor.getPendingQueue().length, 0);

  // User triggers manual retry
  const retried = await processor.retrySale('key-1');
  assert.strictEqual(retried, true);

  const item1 = processor.getItem('key-1');
  assert.strictEqual(item1?.status, 'Pending');
  assert.strictEqual(item1?.last_error, undefined);

  // Item is now back in pending queue
  assert.strictEqual(processor.getPendingQueue().length, 1);

  // Verify sync receives the EXACT SAME idempotency_key
  let sentKey = '';
  const result = await processor.syncAll(async (endpoint, payload) => {
    sentKey = payload.invoice.idempotency_key!;
    return { sale_invoice_no: 50, sales_number: 'INV-50' };
  });

  assert.strictEqual(result.success, 1);
  assert.strictEqual(sentKey, 'key-1', 'Idempotency key must be reused on retry');
  assert.strictEqual(item1?.status, 'Synced');
  assert.strictEqual(item1?.server_sales_number, 'INV-50');
});

test('6. Discard requires reason: Empty or whitespace reason throws, valid reason marks Discarded', () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z');
  const processor = new OfflineQueueProcessor([sale1]);

  // Empty string throws
  assert.throws(() => {
    processor.discardSale('key-1', '');
  }, /Discard reason is required/);

  // Whitespace-only throws
  assert.throws(() => {
    processor.discardSale('key-1', '    ');
  }, /Discard reason is required/);

  assert.throws(() => {
    validateDiscardReason('');
  }, /Discard reason is required/);

  // Valid reason succeeds
  processor.discardSale('key-1', 'Customer cancelled payment at counter');

  const item = processor.getItem('key-1');
  assert.strictEqual(item?.status, 'Discarded');
  assert.strictEqual(item?.last_error, 'Discarded: Customer cancelled payment at counter');

  // Discarded item is not in pending queue
  assert.strictEqual(processor.getPendingQueue().length, 0);
});

test('7. Orphaned Syncing items recovery: resetOrphanedSyncing reverts stuck items to Pending', () => {
  const sale1 = createDummySale('1', '2026-10-26T10:00:00Z', 'Syncing');
  const sale2 = createDummySale('2', '2026-10-26T11:00:00Z', 'Syncing');
  const sale3 = createDummySale('3', '2026-10-26T12:00:00Z', 'Synced');

  // Direct helper test
  const recovered = resetOrphanedSyncing([sale1, sale2, sale3]);
  assert.strictEqual(recovered[0].status, 'Pending');
  assert.strictEqual(recovered[1].status, 'Pending');
  assert.strictEqual(recovered[2].status, 'Synced');

  // Processor initializes and recovers stuck items so they are eligible for auto-sync
  const processor = new OfflineQueueProcessor([sale1, sale2, sale3]);
  const pending = processor.getPendingQueue();
  assert.strictEqual(pending.length, 2);
  assert.strictEqual(pending[0].idempotency_key, 'key-1');
  assert.strictEqual(pending[1].idempotency_key, 'key-2');
  assert.strictEqual(pending[0].status, 'Pending');
  assert.strictEqual(pending[1].status, 'Pending');
});


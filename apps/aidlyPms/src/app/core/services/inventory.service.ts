import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, RequestOptions } from './api.service';
import { ApiResponse, PagedResult } from '../models/common.models';
import { InvTransfer } from '../models/inventory.models';

export interface CreateStockTransferPayload {
  toBranchNo: number;
  note?: string;
  items: Array<{
    productNo: number;
    batchNo?: number | null;
    batchNumber?: string;
    qtyPcs: number;
    unitCost?: number;
    expiryDate?: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly api = inject(ApiService);

  getTransfers(params?: Record<string, unknown> | RequestOptions): Observable<ApiResponse<PagedResult<InvTransfer>>> {
    return this.api.getPaged<InvTransfer>('inv/transfers', params);
  }

  createTransfer(payload: CreateStockTransferPayload): Observable<ApiResponse<InvTransfer>> {
    return this.api.post<InvTransfer>('inv/transfers', payload);
  }

  receiveTransfer(transferNo: number): Observable<ApiResponse<any>> {
    return this.api.post<any>(`inv/transfers/${transferNo}/receive`, {});
  }
}

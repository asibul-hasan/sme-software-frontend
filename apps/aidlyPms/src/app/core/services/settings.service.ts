import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/common.models';
import {
  CfgSaleConfig,
  CfgInvoiceConfig,
  CfgProductConfig,
  CfgLoyaltyConfig,
  CfgBulkSmsConfig,
} from '../models/config.models';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly api = inject(ApiService);

  getSaleConfig(): Observable<ApiResponse<CfgSaleConfig>> {
    return this.api.get<CfgSaleConfig>('cfg/sale-configs');
  }

  updateSaleConfig(config: Partial<CfgSaleConfig>): Observable<ApiResponse<CfgSaleConfig>> {
    return this.api.put<CfgSaleConfig>('cfg/sale-configs', config);
  }

  getInvoiceConfig(): Observable<ApiResponse<CfgInvoiceConfig>> {
    return this.api.get<CfgInvoiceConfig>('cfg/invoice-configs');
  }

  updateInvoiceConfig(config: Partial<CfgInvoiceConfig>): Observable<ApiResponse<CfgInvoiceConfig>> {
    return this.api.put<CfgInvoiceConfig>('cfg/invoice-configs', config);
  }

  getProductConfig(): Observable<ApiResponse<CfgProductConfig>> {
    return this.api.get<CfgProductConfig>('cfg/product-configs');
  }

  updateProductConfig(config: Partial<CfgProductConfig>): Observable<ApiResponse<CfgProductConfig>> {
    return this.api.put<CfgProductConfig>('cfg/product-configs', config);
  }

  getLoyaltyConfig(): Observable<ApiResponse<CfgLoyaltyConfig>> {
    return this.api.get<CfgLoyaltyConfig>('cfg/loyalty-configs');
  }

  updateLoyaltyConfig(config: Partial<CfgLoyaltyConfig>): Observable<ApiResponse<CfgLoyaltyConfig>> {
    return this.api.put<CfgLoyaltyConfig>('cfg/loyalty-configs', config);
  }

  getSmsConfig(): Observable<ApiResponse<CfgBulkSmsConfig>> {
    return this.api.get<CfgBulkSmsConfig>('cfg/sms-configs');
  }

  updateSmsConfig(config: Partial<CfgBulkSmsConfig>): Observable<ApiResponse<CfgBulkSmsConfig>> {
    return this.api.put<CfgBulkSmsConfig>('cfg/sms-configs', config);
  }
}

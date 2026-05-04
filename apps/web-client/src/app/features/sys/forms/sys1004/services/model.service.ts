import { Injectable, signal, computed } from '@angular/core';

export interface Currency {
  currency_no: number;
  currency_code: string;
  currency_name_en: string;
  currency_name_bn?: string;
  currency_symbol: string;
  fractional_unit_en?: string;
  fractional_unit_bn?: string;
  region: string;
  number_format: string;
  exchange_rate: number;
  decimal_places: number;
  is_base_currency: boolean;
  rate_date: string;
  last_rate_update?: string;
}

export interface RateHistory {
  rate_date: string;
  exchange_rate: number;
  entered_by: string;
  entered_at: string;
}

@Injectable()
export class Sys1004ModelService {
  currencies = signal<Currency[]>([]);
  branches = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  rateHistory = signal<RateHistory[]>([]);
  isHistoryLoading = signal(false);
  searchTerm = signal('');
  selectedCurrencyNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  filteredCurrencies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.currencies().filter(c =>
      c.currency_name_en.toLowerCase().includes(term) || 
      (c.currency_name_bn && c.currency_name_bn.toLowerCase().includes(term)) ||
      c.currency_code.toLowerCase().includes(term)
    );
  });

  constructor() {}
}

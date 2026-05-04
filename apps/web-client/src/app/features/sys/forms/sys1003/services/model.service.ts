import { Injectable, signal, computed } from '@angular/core';

export interface FinancialYearPeriod {
  period_no?: number;
  period_code: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
}

export interface FinancialYear {
  fin_year_no: number;
  fin_year_code: string;
  fin_year_name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | 'Locked';
  is_current: boolean;
  periods: FinancialYearPeriod[];
}

@Injectable()
export class Sys1003ModelService {
  financialYears = signal<FinancialYear[]>([]);
  branches = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedYearNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  filteredYears = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.financialYears().filter((y) =>
      y.fin_year_name.toLowerCase().includes(term) || 
      y.fin_year_code.toLowerCase().includes(term)
    );
  });

  constructor() {}
}

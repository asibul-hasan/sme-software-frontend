import { Injectable, signal, computed } from '@angular/core';

export interface TaxComponent {
  child_tax_no: number;
  child_tax_code: string;
  child_tax_name: string;
  tax_rate: number;
  sequence: number;
}

export interface TaxRule {
  tax_no: number;
  tax_code: string;
  tax_name: string;
  tax_type: string;
  tax_rate: number;
  is_compound: boolean;
  applies_to_sales: boolean;
  applies_to_purchase: boolean;
  is_inclusive: boolean;
  is_default: boolean;
  tax_authority: string;
  reporting_code: string;
  effective_from: string;
  effective_to?: string;
  status: string;
  branch_nos: number[];
  components: TaxComponent[];
}

@Injectable()
export class Sys1005ModelService {
  taxRules = signal<TaxRule[]>([]);
  branches = signal<any[]>([]);
  accounts = signal<any[]>([]); // GL Accounts
  allTaxes = signal<any[]>([]); // For composite child selection
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedTaxNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  filteredTaxRules = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.taxRules().filter(t =>
      t.tax_name.toLowerCase().includes(term) || 
      t.tax_code.toLowerCase().includes(term)
    );
  });

  constructor() {}
}

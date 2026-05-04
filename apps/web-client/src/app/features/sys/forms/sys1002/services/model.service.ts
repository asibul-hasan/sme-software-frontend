import { Injectable, signal, computed } from '@angular/core';

export interface Branch {
  branchNo: number;
  branchCode: string;
  branchName: string;
  branchNameLocal?: string;
  branchType?: string;
  isHeadOffice?: boolean | number;
  addressLine1?: string;
  city?: string;
  phonePrimary?: string;
  email?: string;
  managerUserNo?: string | number;
  costCenterCode?: string;
  openingDate?: string | Date;
  status?: string;
}

@Injectable()
export class Sys1002ModelService {
  branches = signal<Branch[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  searchTerm = signal('');
  selectedBranchNo = signal<number | null>(null);
  lastSelectedBranchIndex = 0;

  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    if (!term) return data;
    return data.filter(
      (b) =>
        (b.branchName || '').toLowerCase().includes(term) ||
        (b.branchCode || '').toLowerCase().includes(term),
    );
  });

  constructor() {}
}

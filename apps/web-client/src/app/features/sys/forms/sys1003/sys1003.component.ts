import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

interface FinancialYear {
  id: string;
  branchIds: string[]; // Changed to array
  yearName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'closed';
  isDefault: boolean;
}

interface Branch {
  id: string;
  name: string;
}

@Component({
  selector: 'app-sys1003',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './sys1003.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Sys1003Component {
  private fb = inject(FormBuilder);

  // Data signals
  branches = signal<Branch[]>([
    { id: 'BR001', name: 'Downtown HQ' },
    { id: 'BR002', name: 'Northside Local' },
    { id: 'BR003', name: 'East Kiosk' },
  ]);

  financialYears = signal<FinancialYear[]>([
    { id: '1', branchIds: ['BR001'], yearName: 'FY 2024-25', startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', isDefault: true },
    { id: '2', branchIds: ['BR001', 'BR002'], yearName: 'FY 2023-24', startDate: '2023-04-01', endDate: '2024-03-31', status: 'closed', isDefault: false },
  ]);

  searchTerm = signal('');
  selectedYearId = signal<string | null>(null);

  // Computed signal for filtered list
  filteredYears = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.financialYears().filter((y) =>
      y.yearName.toLowerCase().includes(term),
    );
  });

  formdata: FormGroup = this.fb.group({
    branchIds: [[], [Validators.required]], // Multi-select array
    yearName: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['active', [Validators.required]],
    isDefault: [false],
  });

  selectYear(year: FinancialYear) {
    this.selectedYearId.set(year.id);
    this.formdata.patchValue(year);
  }

  getBranchName(id: string): string {
    return this.branches().find(b => b.id === id)?.name || id;
  }

  onNew() {
    this.selectedYearId.set(null);
    this.formdata.reset({ status: 'active', isDefault: false });
  }

  onSave() {
    if (this.formdata.valid) {
      console.log('Saving Financial Year:', this.formdata.value);
      // Logic to save
    }
  }

  onReset() {
    if (this.selectedYearId()) {
      const original = this.financialYears().find(
        (y) => y.id === this.selectedYearId(),
      );
      if (original) this.formdata.patchValue(original);
    } else {
      this.onNew();
    }
  }
}

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

interface TaxRule {
  id: string;
  branchIds: string[];
  taxName: string;
  taxPercentage: number;
  taxType: 'vat' | 'sales_tax' | 'gst';
  status: 'active' | 'inactive';
  isDefault: boolean;
}

interface Branch {
  id: string;
  name: string;
}

@Component({
  selector: 'app-sys1005',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './sys1005.component.html',
  styles: [`:host { display: block; height: 100%; }`]
})
export class Sys1005Component {
  private fb = inject(FormBuilder);

  // Data signals
  branches = signal<Branch[]>([
    { id: 'BR001', name: 'Downtown HQ' },
    { id: 'BR002', name: 'Northside Local' },
    { id: 'BR003', name: 'East Kiosk' },
  ]);

  taxRules = signal<TaxRule[]>([
    { id: '1', branchIds: ['BR001'], taxName: 'Standard VAT', taxPercentage: 15, taxType: 'vat', status: 'active', isDefault: true },
    { id: '2', branchIds: ['BR001'], taxName: 'Reduced Rate', taxPercentage: 5, taxType: 'vat', status: 'active', isDefault: false },
    { id: '3', branchIds: ['BR002'], taxName: 'Exports', taxPercentage: 0, taxType: 'vat', status: 'active', isDefault: false },
  ]);

  searchTerm = signal('');
  selectedTaxId = signal<string | null>(null);

  filteredTaxRules = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.taxRules().filter(t =>
      t.taxName.toLowerCase().includes(term)
    );
  });

  formdata: FormGroup = this.fb.group({
    branchIds: [[], [Validators.required]],
    taxName: ['', [Validators.required]],
    taxPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    taxType: ['vat', [Validators.required]],
    status: ['active', [Validators.required]],
    isDefault: [false]
  });

  selectTax(tax: TaxRule) {
    this.selectedTaxId.set(tax.id);
    this.formdata.patchValue(tax);
  }

  getBranchName(id: string): string {
    return this.branches().find(b => b.id === id)?.name || id;
  }

  onNew() {
    this.selectedTaxId.set(null);
    this.formdata.reset({ status: 'active', taxPercentage: 0, taxType: 'vat', isDefault: false });
  }

  onSave() {
    if (this.formdata.valid) {
      console.log('Saving Tax Rule:', this.formdata.value);
    }
  }

  onReset() {
    if (this.selectedTaxId()) {
      const original = this.taxRules().find(t => t.id === this.selectedTaxId());
      if (original) this.formdata.patchValue(original);
    } else {
      this.onNew();
    }
  }
}

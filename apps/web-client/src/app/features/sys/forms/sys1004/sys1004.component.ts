import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';

interface Currency {
  id: string;
  branchIds: string[];
  currencyCode: string;
  currencyName: string;
  symbol: string;
  exchangeRate: number;
  status: 'active' | 'inactive';
  isLocal: boolean;
}

interface Branch {
  id: string;
  name: string;
}

@Component({
  selector: 'app-sys1004',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  templateUrl: './sys1004.component.html',
  styles: [`:host { display: block; height: 100%; }`]
})
export class Sys1004Component {
  private fb = inject(FormBuilder);

  // Data signals
  branches = signal<Branch[]>([
    { id: 'BR001', name: 'Downtown HQ' },
    { id: 'BR002', name: 'Northside Local' },
    { id: 'BR003', name: 'East Kiosk' },
  ]);

  currencies = signal<Currency[]>([
    { id: '1', branchIds: ['BR001'], currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', exchangeRate: 1.0, status: 'active', isLocal: true },
    { id: '2', branchIds: ['BR001', 'BR002'], currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', exchangeRate: 0.92, status: 'active', isLocal: false },
    { id: '3', branchIds: ['BR001'], currencyCode: 'GBP', currencyName: 'British Pound', symbol: '£', exchangeRate: 0.79, status: 'inactive', isLocal: false },
  ]);

  searchTerm = signal('');
  selectedCurrencyId = signal<string | null>(null);

  filteredCurrencies = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.currencies().filter(c =>
      c.currencyName.toLowerCase().includes(term) || c.currencyCode.toLowerCase().includes(term)
    );
  });

  formdata: FormGroup = this.fb.group({
    branchIds: [[], [Validators.required]],
    currencyCode: ['', [Validators.required, Validators.maxLength(3)]],
    currencyName: ['', [Validators.required]],
    symbol: ['', [Validators.required]],
    exchangeRate: [1.0, [Validators.required, Validators.min(0)]],
    status: ['active', [Validators.required]],
    isLocal: [false]
  });

  selectCurrency(currency: Currency) {
    this.selectedCurrencyId.set(currency.id);
    this.formdata.patchValue(currency);
  }

  getBranchName(id: string): string {
    return this.branches().find(b => b.id === id)?.name || id;
  }

  onNew() {
    this.selectedCurrencyId.set(null);
    this.formdata.reset({ status: 'active', exchangeRate: 1.0, isLocal: false });
  }

  onSave() {
    if (this.formdata.valid) {
      console.log('Saving Currency:', this.formdata.value);
    }
  }

  onReset() {
    if (this.selectedCurrencyId()) {
      const original = this.currencies().find(c => c.id === this.selectedCurrencyId());
      if (original) this.formdata.patchValue(original);
    } else {
      this.onNew();
    }
  }
}

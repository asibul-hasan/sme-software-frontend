import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StocktakeService } from '../../core/services/stocktake.service';
import { ProductService } from '../../core/services/product.service';
import { ProdCompany } from '../../core/models/product.models';
import { StocktakeCreateRequest } from '../../core/models/inventory.models';

@Component({
  selector: 'app-stocktake-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzRadioModule,
    NzSpinModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-4 max-w-4xl mx-auto w-full p-4">
      <app-page-header
        title="Initiate Stock-take Audit"
        subtitle="Snapshot system quantities and begin physical inventory count"
        formId="PROD_1612"
        [breadcrumbs]="[
          { label: 'Medicines & Stock', url: '/products/list' },
          { label: 'Stock-take Audits', url: '/products/stocktakes' },
          { label: 'New Audit' }
        ]"
      ></app-page-header>

      <div class="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div class="border-b border-slate-100 pb-4">
          <h2 class="text-base font-semibold text-slate-800 m-0">Audit Scope & Parameters</h2>
          <p class="text-xs text-slate-500 mt-1 m-0">
            Choose whether to audit all items in the pharmacy or target specific racks or pharmaceutical manufacturers.
          </p>
        </div>

        <!-- Scope Selection -->
        <div class="space-y-3">
          <label class="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Select Count Scope</label>
          <nz-radio-group [(ngModel)]="filterType" class="flex flex-col sm:flex-row gap-4">
            <label nz-radio nzValue="ALL" class="text-sm font-medium">
              <span>Full Store Audit (All Stock)</span>
            </label>
            <label nz-radio nzValue="RACK" class="text-sm font-medium">
              <span>By Rack / Shelf Location</span>
            </label>
            <label nz-radio nzValue="COMPANY" class="text-sm font-medium">
              <span>By Manufacturer / Company</span>
            </label>
          </nz-radio-group>
        </div>

        <!-- Dynamic Scope Filter Inputs -->
        @if (filterType === 'RACK') {
          <div class="space-y-1.5 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label for="stocktake-rack-input" class="text-xs font-semibold text-slate-700 block">
              Rack / Shelf Number <span class="text-rose-500">*</span>
            </label>
            <input
              id="stocktake-rack-input"
              nz-input
              [(ngModel)]="rackNumber"
              placeholder="e.g. RACK-A1, RACK-B2"
              class="max-w-md rounded-md"
            />
            <p class="text-[11px] text-slate-500 mt-1 m-0">Only items assigned to this rack location will be included in the snapshot.</p>
          </div>
        }

        @if (filterType === 'COMPANY') {
          <div class="space-y-1.5 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label for="stocktake-company-select" class="text-xs font-semibold text-slate-700 block">
              Pharmaceutical Company <span class="text-rose-500">*</span>
            </label>
            <nz-select
              id="stocktake-company-select"
              [(ngModel)]="selectedCompanyNo"
              nzShowSearch
              nzPlaceHolder="Select manufacturer"
              class="w-full max-w-md"
            >
              @for (c of companies(); track c.company_no) {
                <nz-option [nzValue]="c.company_no" [nzLabel]="c.name"></nz-option>
              }
            </nz-select>
            <p class="text-[11px] text-slate-500 mt-1 m-0">Only batches manufactured by this company will be included in the snapshot.</p>
          </div>
        }

        <!-- Audit Note / Description -->
        <div class="space-y-1.5">
          <label for="stocktake-note-input" class="text-xs font-semibold text-slate-700 block">Audit Note / Purpose</label>
          <textarea
            id="stocktake-note-input"
            nz-input
            rows="3"
            [(ngModel)]="auditNote"
            placeholder="e.g. Month-end inventory verification for Section A"
            class="rounded-md"
          ></textarea>
        </div>

        <!-- Info Notice -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
          <span nz-icon nzType="info-circle" class="text-blue-500 text-base mt-0.5"></span>
          <div>
            <strong class="font-semibold block">Snapshot Behavior Notice:</strong>
            Creating this audit freezes a snapshot of current system quantities (<code class="bg-blue-100 px-1 py-0.5 rounded">system_qty_pcs</code>).
            Sales during the count will be detected when you finalize the audit to ensure ledger integrity.
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            nz-button
            nzType="default"
            class="rounded-md"
            routerLink="/products/stocktakes"
          >
            Cancel
          </button>
          <button
            type="button"
            nz-button
            nzType="primary"
            class="rounded-md inline-flex items-center gap-1.5"
            [nzLoading]="isSubmitting()"
            (click)="onSubmit()"
          >
            <span nz-icon nzType="camera"></span>
            Snapshot & Start Counting
          </button>
        </div>
      </div>
    </div>
  `,
})
export class StocktakeCreateComponent implements OnInit {
  private readonly stocktakeService = inject(StocktakeService);
  private readonly productService = inject(ProductService);
  private readonly messageService = inject(NzMessageService);
  private readonly router = inject(Router);

  filterType: 'ALL' | 'RACK' | 'COMPANY' | 'PRODUCTS' = 'ALL';
  rackNumber = '';
  selectedCompanyNo: number | null = null;
  auditNote = '';

  companies = signal<ProdCompany[]>([]);
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.productService.getCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companies.set(res.data);
        }
      },
    });
  }

  onSubmit(): void {
    if (this.filterType === 'RACK' && !this.rackNumber.trim()) {
      this.messageService.warning('Please enter a rack number.');
      return;
    }
    if (this.filterType === 'COMPANY' && !this.selectedCompanyNo) {
      this.messageService.warning('Please select a company.');
      return;
    }

    const payload: StocktakeCreateRequest = {
      filter_type: this.filterType,
      rack_number: this.filterType === 'RACK' ? this.rackNumber.trim() : null,
      company_no: this.filterType === 'COMPANY' ? this.selectedCompanyNo : null,
      note: this.auditNote.trim() || null,
    };

    this.isSubmitting.set(true);
    this.stocktakeService.createStocktake(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success && res.data) {
          this.messageService.success(`Stock-take #${res.data.stocktake_no} created.`);
          this.router.navigate(['/products/stocktakes', res.data.stocktake_no]);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.error(err.error?.message || 'Failed to initialize stock-take.');
      },
    });
  }
}

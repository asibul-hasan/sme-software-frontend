import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { SupplierService } from '../../core/services/supplier.service';
import { PrintService } from '../../core/services/print.service';

interface SupplierRow {
  supplier_no: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
  note?: string;
}

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzSelectModule,
    NzIconModule,
    NzCheckboxModule,
    NzTooltipModule,
    NzTagModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Suppliers & Vendors"
        subtitle="Manage pharmaceutical suppliers, balances, ledger, and vendor relations"
        formId="PUR_1501"
        [breadcrumbs]="[{ label: 'Purchases', url: '/supplier/purchase' }, { label: 'Suppliers' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-nowrap py-1">
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Supplier Name</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-48 shrink-0 rounded-md">
              <input
                type="text"
                nz-input
                placeholder="Name or company..."
                [(ngModel)]="searchName"
                (ngModelChange)="onSearchChange()"
                class="text-xs"
              />
            </nz-input-group>
            <ng-template #searchIcon>
              <span nz-icon nzType="search" class="text-slate-400"></span>
            </ng-template>
          </div>
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Phone Number</label>
            <input
              type="text"
              nz-input
              placeholder="Phone (+880...)"
              [(ngModel)]="searchPhone"
              (ngModelChange)="onSearchChange()"
              class="w-36 shrink-0 rounded-md text-xs"
            />
          </div>
          <div class="flex items-center h-8 shrink-0 pb-0.5">
            <label nz-checkbox [(ngModel)]="dueOnly" (ngModelChange)="onFilterChange()" class="text-xs text-slate-700">
              Payable Due Only (F9)
            </label>
          </div>
          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportSuppliersCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <a nz-button nzType="default" routerLink="/supplier/add" class="rounded-md">
            <span nz-icon nzType="form"></span> Supplier Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Supplier (F2)
          </button>
        </div>

      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Supplier Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3 text-right">Balance</th>
                <th class="p-3 text-center w-48">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (s of filteredSuppliers(); track s.supplier_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-semibold text-slate-900 text-sm mb-0.5">{{ s.name }}</p>
                    <p class="text-xs text-slate-400 mb-0">
                      <span>{{ s.phone }}</span>
                      @if (s.address) {
                        <span> · {{ s.address }}</span>
                      }
                    </p>
                  </td>
                  <td class="p-3 text-right">
                    <span
                      class="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      [ngClass]="s.balance > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'"
                    >
                      ৳ {{ s.balance.toLocaleString() }}
                    </span>
                  </td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="viewLedger(s)"
                        nz-tooltip
                        nzTooltipTitle="View Vendor Ledger"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      @if (s.balance > 0) {
                        <button
                          type="button"
                          (click)="openPaymentModal(s)"
                          nz-tooltip
                          nzTooltipTitle="Pay Supplier"
                          class="btn-tbl-action btn-tbl-success"
                        >
                          <span nz-icon nzType="dollar"></span>
                        </button>
                      }
                      <button
                        type="button"
                        (click)="openEditModal(s)"
                        nz-tooltip
                        nzTooltipTitle="Edit Supplier"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteSupplier(s)"
                        nz-tooltip
                        nzTooltipTitle="Delete Supplier"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="p-8 text-center text-slate-400 text-xs">
                    No suppliers match your search filter.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Suppliers: <strong class="text-slate-900 font-semibold font-mono">{{ filteredSuppliers().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Payable Balance: <strong class="text-rose-700 font-mono text-sm">৳ {{ totalPayableBalance() | number: '1.2-2' }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Active Vendor Accounts</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Create Supplier (SCR-12)' : ('Modify Supplier: ' + form.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Supplier' : 'Update Supplier'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveSupplier()"
      nzWidth="780px"
      [nzStyle]="{ top: '24px' }"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="Enter supplier / vendor name"
                [(ngModel)]="form.name"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <span class="h-7 px-2.5 flex items-center bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-600 shrink-0">
                  +880
                </span>
                <input
                  type="text"
                  nz-input
                  placeholder="1XXXXXXXXX"
                  [(ngModel)]="form.phoneSuffix"
                  class="rounded-md flex-1"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Address / Hub</label>
              <input
                type="text"
                nz-input
                placeholder="e.g. Dhaka, Cumilla, Chattagram"
                [(ngModel)]="form.address"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Note</label>
              <input
                type="text"
                nz-input
                placeholder="Additional notes about this supplier..."
                [(ngModel)]="form.note"
                class="rounded-md"
              />
            </div>
          </div>

          <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span class="text-xs font-semibold text-slate-700 block">Has Opening Due Balance?</span>
              <span class="text-[11px] text-slate-400">Enable if vendor has previous outstanding balance</span>
            </div>
            <label nz-checkbox [(ngModel)]="form.dueEnabled"></label>
          </div>

          @if (form.dueEnabled) {
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-slate-700 shrink-0">
                Opening Due Amount (৳) <span class="text-rose-500">*</span>:
              </label>
              <input
                type="number"
                nz-input
                placeholder="0.00"
                [(ngModel)]="form.balance"
                class="rounded-md w-36 font-mono"
              />
            </div>
          }
        </div>
      </ng-container>
    </nz-modal>

    <!-- Supplier Quick Pay Modal -->
    <nz-modal
      [(nzVisible)]="isPayModalVisible"
      [nzTitle]="'Pay Supplier: ' + activePaySupplier?.name"
      nzOkText="Confirm Payment"
      [nzStyle]="{ top: '32px' }"
      (nzOnCancel)="isPayModalVisible = false"
      (nzOnOk)="submitPayment()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div class="p-3 bg-amber-50 rounded-md border border-amber-200 text-sm">
            <span class="text-slate-600 block">Current Outstanding Balance:</span>
            <span class="text-lg font-bold text-amber-800 font-mono">
              ৳ {{ activePaySupplier?.balance?.toLocaleString() }}
            </span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (৳) <span class="text-rose-500">*</span>
            </label>
            <input
              type="number"
              nz-input
              placeholder="Enter amount to pay"
              [(ngModel)]="payAmount"
              class="rounded-md"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <div class="flex gap-1.5">
              <nz-select [(ngModel)]="payMethod" class="flex-1">
                @for (m of payMethods; track m) {
                  <nz-option [nzValue]="m" [nzLabel]="m"></nz-option>
                }
              </nz-select>
              <button
                type="button"
                (click)="isAddPayMethodOpen = true"
                nz-tooltip
                nzTooltipTitle="Quick Add Payment Method"
                class="btn-quick-add"
              >
                <span nz-icon nzType="plus"></span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Reference / Note</label>
            <input
              type="text"
              nz-input
              placeholder="Cheque / TRx / Challan ref"
              [(ngModel)]="payNote"
              class="rounded-md"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Payment Method Modal -->
    <nz-modal
      [(nzVisible)]="isAddPayMethodOpen"
      nzTitle="Quick Add Payment Method"
      nzOkText="Add Method"
      [nzStyle]="{ top: '40px' }"
      (nzOnCancel)="isAddPayMethodOpen = false"
      (nzOnOk)="saveNewPayMethod()"
      nzWidth="380px"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Method Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. BRAC Bank, Dutch Bangla"
            [(ngModel)]="newPayMethodName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Vendor Ledger Modal -->
    <nz-modal
      [(nzVisible)]="isLedgerModalVisible"
      [nzTitle]="'Vendor Ledger: ' + (activeLedgerSupplier?.name || '')"
      [nzFooter]="ledgerFooter"
      (nzOnCancel)="isLedgerModalVisible = false"
      nzWidth="780px"
    >
      <ng-container *nzModalContent>
        @if (activeLedgerSupplier) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <span class="text-slate-400 block">Phone:</span>
                <span class="font-bold text-slate-800">{{ activeLedgerSupplier.phone }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Current Outstanding Due:</span>
                <span class="font-bold text-rose-600 font-mono text-sm">৳ {{ (activeLedgerSupplier.balance || 0) | number:'1.2-2' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Vendor Note:</span>
                <span class="text-slate-600 truncate">{{ activeLedgerSupplier.note || 'None' }}</span>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-xs text-slate-700 uppercase tracking-wider">Transaction History</span>
                <span class="text-xs text-slate-400">{{ supplierLedgerEntries.length }} transaction(s)</span>
              </div>
              <div class="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table class="w-full text-xs text-left">
                  <thead class="sticky top-0 bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 shadow-xs">
                    <tr>
                      <th class="p-2">Date</th>
                      <th class="p-2">Doc #</th>
                      <th class="p-2">Type</th>
                      <th class="p-2 text-right">Purchase (৳)</th>
                      <th class="p-2 text-right">Paid (৳)</th>
                      <th class="p-2 text-right">Balance (৳)</th>
                      <th class="p-2">Note</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (entry of supplierLedgerEntries; track (entry.doc_no + entry.doc_date)) {
                      <tr>
                        <td class="p-2 text-slate-600 font-mono">{{ entry.doc_date | date:'dd/MM/yy hh:mm a' }}</td>
                        <td class="p-2 font-mono font-semibold text-slate-800">{{ entry.doc_no }}</td>
                        <td class="p-2">
                          <nz-tag [nzColor]="entry.doc_type === 'Purchase Invoice' ? 'blue' : 'purple'">
                            {{ entry.doc_type }}
                          </nz-tag>
                        </td>
                        <td class="p-2 text-right font-mono">{{ entry.debit > 0 ? (entry.debit | number:'1.2-2') : '—' }}</td>
                        <td class="p-2 text-right font-mono text-emerald-600 font-semibold">{{ entry.credit > 0 ? (entry.credit | number:'1.2-2') : '—' }}</td>
                        <td class="p-2 text-right font-mono font-bold" [ngClass]="entry.balance > 0 ? 'text-rose-600' : 'text-emerald-700'">
                          ৳ {{ entry.balance | number:'1.2-2' }}
                        </td>
                        <td class="p-2 text-slate-500 text-[11px] truncate max-w-[150px]">{{ entry.note || '—' }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="p-6 text-center text-slate-400">
                          {{ isLoadingLedger ? 'Loading ledger transactions...' : 'No ledger transactions recorded for this supplier.' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #ledgerFooter>
        <button nz-button nzType="default" (click)="isLedgerModalVisible = false">Close</button>
        <button nz-button nzType="primary" (click)="printSupplierStatement()">
          <span nz-icon nzType="printer"></span> Print Statement
        </button>
      </ng-template>
    </nz-modal>
  `,

})
export class SupplierListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly supplierService = inject(SupplierService);
  private readonly printService = inject(PrintService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  searchName = '';
  searchPhone = '';
  dueOnly = false;
  isLoading = signal(false);
  payMethods = ['Cash Counter', 'Bank Transfer', 'bKash Merchant', 'Nagad', 'BRAC Bank'];

  isAddPayMethodOpen = false;
  newPayMethodName = '';

  activeLedgerSupplier: SupplierRow | null = null;
  supplierLedgerEntries: any[] = [];
  isLoadingLedger = false;
  isLedgerModalVisible = false;

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadSuppliers();
    });
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  onFilterChange(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 50,
    };
    if (this.searchName.trim()) params['search'] = this.searchName.trim();
    if (this.searchPhone.trim()) params['phone'] = this.searchPhone.trim();
    if (this.dueOnly) params['dueOnly'] = true;

    this.supplierService.getSuppliers(params).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.suppliers.set(items.map(s => ({
          supplier_no: s.supplier_no,
          name: s.name,
          phone: s.phone,
          address: '',
          balance: Number(s.current_due_balance) || 0,
          note: s.note || '',
        })));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  resetFilters(): void {
    this.searchName = '';
    this.searchPhone = '';
    this.dueOnly = false;
    this.loadSuppliers();
  }

  saveNewPayMethod(): void {
    const val = this.newPayMethodName.trim();
    if (!val) {
      this.msg.error('Payment method name is required');
      return;
    }
    if (!this.payMethods.includes(val)) {
      this.payMethods.push(val);
    }
    this.payMethod = val;
    this.isAddPayMethodOpen = false;
    this.msg.success(`Payment method "${val}" added!`);
  }

  suppliers = signal<SupplierRow[]>([]);

  filteredSuppliers = computed(() => {
    const nameQ = this.searchName.trim().toLowerCase();
    const phoneQ = this.searchPhone.trim();
    return this.suppliers().filter(s => {
      const matchName = !nameQ || s.name.toLowerCase().includes(nameQ);
      const matchPhone = !phoneQ || s.phone.includes(phoneQ);
      const matchDue = !this.dueOnly || s.balance > 0;
      return matchName && matchPhone && matchDue;
    });
  });

  totalPayableBalance = computed(() => this.filteredSuppliers().reduce((sum, s) => sum + (s.balance || 0), 0));

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    supplier_no: 0,
    name: '',
    phoneSuffix: '',
    address: '',
    note: '',
    dueEnabled: false,
    balance: 0,
  };

  // Payment Modal State
  isPayModalVisible = false;
  activePaySupplier: SupplierRow | null = null;
  payAmount = 0;
  payMethod = 'Cash';
  payNote = '';

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      supplier_no: 0,
      name: '',
      phoneSuffix: '',
      address: '',
      note: '',
      dueEnabled: false,
      balance: 0,
    };
    this.isModalVisible = true;
  }

  openEditModal(item: SupplierRow): void {
    this.modalMode = 'edit';
    const phoneDigits = item.phone.replace(/^\+880\s*/, '');
    this.form = {
      supplier_no: item.supplier_no,
      name: item.name,
      phoneSuffix: phoneDigits,
      address: item.address,
      note: item.note || '',
      dueEnabled: item.balance > 0,
      balance: item.balance,
    };
    this.isModalVisible = true;
  }

  saveSupplier(): void {
    if (!this.form.name.trim()) {
      this.msg.error('Please enter a supplier name');
      return;
    }
    if (!this.form.phoneSuffix.trim()) {
      this.msg.error('Please enter a phone number');
      return;
    }

    const fullPhone = `+880 ${this.form.phoneSuffix.trim()}`;
    const balance = this.form.dueEnabled ? Number(this.form.balance) || 0 : 0;

    if (this.modalMode === 'create') {
      this.supplierService.createSupplier({
        name: this.form.name.trim(),
        phone: fullPhone,
        current_due_balance: balance,
        note: this.form.note.trim(),
      }).subscribe({
        next: () => {
          this.msg.success(`Supplier "${this.form.name}" created successfully!`);
          this.isModalVisible = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to create supplier');
        },
      });
    } else {
      this.supplierService.updateSupplier(this.form.supplier_no, {
        name: this.form.name.trim(),
        phone: fullPhone,
        note: this.form.note.trim(),
      }).subscribe({
        next: () => {
          this.msg.success(`Supplier "${this.form.name}" updated successfully!`);
          this.isModalVisible = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to update supplier');
        },
      });
    }
  }

  viewLedger(s: SupplierRow): void {
    this.activeLedgerSupplier = s;
    this.isLedgerModalVisible = true;
    this.isLoadingLedger = true;
    this.supplierLedgerEntries = [];
    this.supplierService.getSupplierLedger(s.supplier_no).subscribe({
      next: (res) => {
        this.isLoadingLedger = false;
        if (res.success && res.data?.ledger) {
          this.supplierLedgerEntries = res.data.ledger;
        }
      },
      error: () => {
        this.isLoadingLedger = false;
      }
    });
  }

  printSupplierStatement(): void {
    if (!this.activeLedgerSupplier) {
      this.msg.warning('No supplier selected for statement.');
      return;
    }
    this.printService.printSupplierStatement(
      this.activeLedgerSupplier,
      this.supplierLedgerEntries
    );
  }

  exportSuppliersCsv(): void {
    const list = this.filteredSuppliers();
    if (!list.length) {
      this.msg.warning('No supplier records to export.');
      return;
    }
    const headers = ['Supplier Name', 'Phone', 'Address / Details', 'Outstanding Balance (৳)', 'Note'];
    const rows = list.map(s => [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      (s.balance || 0).toFixed(2),
      `"${(s.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `supplier_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} suppliers to CSV`);
  }

  openPaymentModal(s: SupplierRow): void {
    this.activePaySupplier = s;
    this.payAmount = s.balance;
    this.payMethod = 'Cash';
    this.payNote = '';
    this.isPayModalVisible = true;
  }

  submitPayment(): void {
    if (!this.activePaySupplier || this.payAmount <= 0) {
      this.msg.error('Enter a valid payment amount');
      return;
    }
    const supId = this.activePaySupplier.supplier_no;
    const paid = this.payAmount;
    const supName = this.activePaySupplier.name;

    const methodCode = this.payMethod.toLowerCase().includes('bank') ? 2 : this.payMethod.toLowerCase().includes('bkash') ? 4 : 1;
    this.supplierService
      .createSupplierPayment({
        supplier_no: supId,
        amount: paid,
        payment_method: methodCode,
        note: this.payNote || `Payment to ${supName} (${this.payMethod})`,
      })
      .subscribe({
        next: () => {
          this.msg.success(`Payment of ৳ ${paid.toLocaleString()} recorded for ${supName}!`);
          this.isPayModalVisible = false;
          this.loadSuppliers();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to record supplier payment');
        },
      });
  }

  deleteSupplier(s: SupplierRow): void {
    this.modal.confirmAction(
      'Delete Supplier?',
      `Are you sure you want to delete vendor "${s.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.supplierService.deleteSupplier(s.supplier_no).subscribe({
          next: () => {
            this.msg.success(`Supplier "${s.name}" deleted successfully`);
            this.loadSuppliers();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete supplier');
          },
        });
      }
    });
  }
}

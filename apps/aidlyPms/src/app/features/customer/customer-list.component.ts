import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { CustomerService } from '../../core/services/customer.service';
import { CustCustomer } from '../../core/models';

interface CustomerRow {
  customer_no: number;
  name: string;
  phone: string;
  type: string;
  address: string;
  balance: number;
  points: number;
  dueDate: string;
  gender?: string;
  discountPercent?: number;
  email?: string;
  note?: string;
  isLoyalty?: boolean;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzCheckboxModule,
    NzSelectModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Customer Directory"
        subtitle="Manage customer profiles, credit due balances, and loyalty points"
        formId="SALE_1402"
        [breadcrumbs]="[{ label: 'Sales', url: '/customer/sale' }, { label: 'Customers' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-nowrap py-1">
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Customer Name</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-48 shrink-0 rounded-md">
              <input
                type="text"
                nz-input
                placeholder="Name or keyword..."
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
          <div class="flex flex-col">
            <label class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Customer Type</label>
            <nz-select
              [(ngModel)]="filterType"
              (ngModelChange)="onFilterChange()"
              class="w-36 shrink-0"
              nzPlaceHolder="All Types"
              nzAllowClear
            >
              <nz-option nzValue="" nzLabel="All Types"></nz-option>
              @for (t of customerTypes; track t) {
                <nz-option [nzValue]="t" [nzLabel]="t"></nz-option>
              }
            </nz-select>
          </div>
          <div class="flex items-center h-8 shrink-0 pb-0.5">
            <label nz-checkbox [(ngModel)]="dueOnly" (ngModelChange)="onFilterChange()" class="text-xs text-slate-700">
              Due Only (F9)
            </label>
          </div>
          <button nz-button nzType="default" class="rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportCustomersCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
          <a nz-button nzType="default" routerLink="/customer/add" class="rounded-md">
            <span nz-icon nzType="user-add"></span> Customer Form
          </a>
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Customer (F2)
          </button>
        </div>

      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Area -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3">Details</th>
                <th class="p-3 text-right">Balance</th>
                <th class="p-3 text-right">Points</th>
                <th class="p-3 text-center">Due Date</th>
                <th class="p-3 text-center w-44">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (c of filteredCustomers(); track c.customer_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3">
                    <p class="font-semibold text-slate-900 text-sm mb-0.5">{{ c.name }}</p>
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-xs text-slate-400">{{ c.phone }}</span>
                      <nz-tag class="text-[11px] m-0">{{ c.type }}</nz-tag>
                    </div>
                    @if (c.address) {
                      <p class="text-xs text-slate-400 mb-0">{{ c.address }}</p>
                    }
                  </td>

                  <td class="p-3 text-right font-mono text-xs">
                    <span
                      class="px-2 py-0.5 rounded font-bold"
                      [ngClass]="c.balance > 0 ? 'text-rose-600 bg-rose-50' : 'text-emerald-700 bg-emerald-50'"
                    >
                      ৳ {{ c.balance.toLocaleString() }}
                    </span>
                  </td>

                  <td class="p-3 text-right font-mono text-xs font-semibold theme-total-text">
                    {{ c.points }}
                  </td>

                  <td class="p-3 text-center font-mono text-xs text-slate-600">
                    {{ c.dueDate }}
                  </td>

                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      @if (c.balance > 0) {
                        <button
                          type="button"
                          (click)="openCollectModal(c)"
                          nz-tooltip
                          nzTooltipTitle="Collect Due"
                          class="btn-tbl-action btn-tbl-success"
                        >
                          <span nz-icon nzType="dollar"></span>
                        </button>
                      }
                      <button
                        type="button"
                        (click)="viewLedger(c)"
                        nz-tooltip
                        nzTooltipTitle="View Ledger"
                        class="btn-tbl-action btn-tbl-view"
                      >
                        <span nz-icon nzType="eye"></span>
                      </button>
                      <button
                        type="button"
                        (click)="openEditModal(c)"
                        nz-tooltip
                        nzTooltipTitle="Edit Customer"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteCustomer(c)"
                        nz-tooltip
                        nzTooltipTitle="Delete Customer"
                        class="btn-tbl-action btn-tbl-delete"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-slate-400 text-xs">
                    No customers match your search filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            <span>Customers: <strong class="text-slate-900 font-semibold font-mono">{{ filteredCustomers().length }}</strong></span>
            <span class="text-slate-300">|</span>
            <span class="font-semibold text-slate-700">Total Outstanding Due: <strong class="text-rose-700 font-mono text-sm">৳ {{ totalCustomerDue() | number: '1.2-2' }}</strong></span>
            <span class="text-slate-300">|</span>
            <span>Total Loyalty Points: <strong class="theme-total-text font-mono font-semibold">{{ totalLoyaltyPoints() }}</strong></span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Customer CRM Directory</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add Customer (SCR-20)' : ('Modify Customer: ' + form.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Customer' : 'Update Customer'"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveCustomer()"
      nzWidth="860px"
      [nzStyle]="{ top: '24px' }"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1 text-xs">
          <!-- Row 1: 3 Columns -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">
                Customer Name <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                nz-input
                placeholder="Full name"
                [(ngModel)]="form.name"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">
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
              <label class="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                nz-input
                placeholder="email@example.com"
                [(ngModel)]="form.email"
                class="rounded-md"
              />
            </div>
          </div>

          <!-- Row 2: 3 Columns -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">
                Gender <span class="text-rose-500">*</span>
              </label>
              <nz-select [(ngModel)]="form.gender" class="w-full">
                <nz-option nzValue="Male" nzLabel="Male"></nz-option>
                <nz-option nzValue="Female" nzLabel="Female"></nz-option>
                <nz-option nzValue="Other" nzLabel="Other"></nz-option>
              </nz-select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">
                Customer Type <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-1.5">
                <nz-select [(ngModel)]="form.type" class="flex-1">
                  @for (t of customerTypes; track t) {
                    <nz-option [nzValue]="t" [nzLabel]="t"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="isAddCustomerTypeOpen = true"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Customer Type"
                  class="btn-quick-add"
                >
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">
                Discount % (Default line discount)
              </label>
              <input
                type="number"
                nz-input
                placeholder="0"
                [(ngModel)]="form.discountPercent"
                class="rounded-md"
              />
            </div>
          </div>

          <!-- Opening Due Balance (Horizontal Strip) -->
          <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <label nz-checkbox [(ngModel)]="form.dueEnabled"></label>
                <div>
                  <span class="text-xs font-semibold text-slate-700 block">Has Opening Due Balance?</span>
                  <span class="text-[11px] text-slate-400">Record previous unpaid credit balance</span>
                </div>
              </div>

              @if (form.dueEnabled) {
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1.5">
                    <label class="text-xs font-medium text-slate-600 shrink-0">Due (৳):</label>
                    <input
                      type="number"
                      nz-input
                      placeholder="0.00"
                      [(ngModel)]="form.balance"
                      class="rounded-md w-28"
                    />
                  </div>
                  <div class="flex items-center gap-1.5">
                    <label class="text-xs font-medium text-slate-600 shrink-0">Due Date:</label>
                    <input
                      type="date"
                      nz-input
                      [(ngModel)]="form.dueDate"
                      class="rounded-md w-36"
                    />
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Address & Note: 2-Column Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                nz-input
                placeholder="Street address, area, city..."
                [(ngModel)]="form.address"
                class="rounded-md"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Note</label>
              <input
                type="text"
                nz-input
                placeholder="Additional notes about customer..."
                [(ngModel)]="form.note"
                class="rounded-md"
              />
            </div>
          </div>

          <!-- Loyalty Member Strip -->
          <div class="flex items-center justify-between px-3 py-2 theme-highlight-card rounded-lg">
            <div>
              <span class="text-xs font-bold theme-highlight-title block">Loyalty Member</span>
              <span class="text-[11px] theme-highlight-subtitle">Enroll in customer points & rewards scheme</span>
            </div>
            <label nz-checkbox [(ngModel)]="form.isLoyalty"></label>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Collect Due Modal -->
    <nz-modal
      [(nzVisible)]="isCollectOpen"
      [nzTitle]="'Collect Due: ' + activeCustomer?.name"
      nzOkText="Confirm Collection"
      (nzOnCancel)="isCollectOpen = false"
      (nzOnOk)="submitCollect()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div class="p-3 bg-amber-50 rounded-md border border-amber-200 text-sm">
            <span class="text-slate-600 block">Current Outstanding Due:</span>
            <span class="text-lg font-bold text-amber-800 font-mono">
              ৳ {{ activeCustomer?.balance?.toLocaleString() }}
            </span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Collection Amount (৳) *</label>
            <input
              type="number"
              nz-input
              placeholder="Enter amount collected"
              [(ngModel)]="collectAmount"
              class="rounded-md font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <nz-select [(ngModel)]="collectMethod" class="w-full">
              <nz-option nzValue="Cash" nzLabel="Cash Counter"></nz-option>
              <nz-option nzValue="Bank" nzLabel="Bank Deposit"></nz-option>
              <nz-option nzValue="bKash" nzLabel="bKash"></nz-option>
              <nz-option nzValue="Nagad" nzLabel="Nagad"></nz-option>
            </nz-select>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Customer Type Modal -->
    <nz-modal
      [(nzVisible)]="isAddCustomerTypeOpen"
      nzTitle="Quick Add Customer Type"
      nzOkText="Add Type"
      [nzStyle]="{ top: '40px' }"
      (nzOnCancel)="isAddCustomerTypeOpen = false"
      (nzOnOk)="saveNewCustomerType()"
      nzWidth="380px"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Customer Type Name <span class="text-rose-500">*</span>
          </label>
          <input
            type="text"
            nz-input
            placeholder="e.g. Clinic, Corporate, NGO"
            [(ngModel)]="newCustomerTypeName"
            class="rounded-md"
          />
        </div>
      </ng-container>
    </nz-modal>

    <!-- Customer Ledger Modal -->
    <nz-modal
      [(nzVisible)]="isLedgerModalVisible"
      [nzTitle]="'Customer Ledger: ' + (activeLedgerCustomer?.name || '')"
      [nzFooter]="ledgerFooter"
      (nzOnCancel)="isLedgerModalVisible = false"
      nzWidth="780px"
    >
      <ng-container *nzModalContent>
        @if (activeLedgerCustomer) {
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <span class="text-slate-400 block">Phone:</span>
                <span class="font-bold text-slate-800">{{ activeLedgerCustomer.phone }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Customer Type:</span>
                <nz-tag nzColor="blue">{{ activeLedgerCustomer.type || 'Regular' }}</nz-tag>
              </div>
              <div>
                <span class="text-slate-400 block">Current Due:</span>
                <span class="font-bold text-rose-600 font-mono text-sm">৳ {{ (activeLedgerCustomer.balance || 0) | number:'1.2-2' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block">Loyalty Points:</span>
                <span class="font-bold text-amber-600 font-mono text-sm">{{ activeLedgerCustomer.points || 0 }} pts</span>
              </div>
            </div>

            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-xs text-slate-700 uppercase tracking-wider">Statement of Accounts</span>
                <span class="text-xs text-slate-400">{{ customerLedgerEntries.length }} transaction(s)</span>
              </div>
              <div class="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table class="w-full text-xs text-left">
                  <thead class="sticky top-0 bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 shadow-xs">
                    <tr>
                      <th class="p-2">Date</th>
                      <th class="p-2">Doc #</th>
                      <th class="p-2">Type</th>
                      <th class="p-2 text-right">Debit (৳)</th>
                      <th class="p-2 text-right">Credit (৳)</th>
                      <th class="p-2 text-right">Balance (৳)</th>
                      <th class="p-2">Method / Note</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (entry of customerLedgerEntries; track (entry.doc_no + entry.doc_date)) {
                      <tr>
                        <td class="p-2 text-slate-600 font-mono">{{ entry.doc_date | date:'dd/MM/yy hh:mm a' }}</td>
                        <td class="p-2 font-mono font-semibold text-slate-800">{{ entry.doc_no }}</td>
                        <td class="p-2">
                          <nz-tag [nzColor]="entry.doc_type === 'Sale Invoice' ? 'orange' : 'green'">
                            {{ entry.doc_type }}
                          </nz-tag>
                        </td>
                        <td class="p-2 text-right font-mono">{{ entry.debit > 0 ? (entry.debit | number:'1.2-2') : '—' }}</td>
                        <td class="p-2 text-right font-mono text-emerald-600 font-semibold">{{ entry.credit > 0 ? (entry.credit | number:'1.2-2') : '—' }}</td>
                        <td class="p-2 text-right font-mono font-bold" [ngClass]="entry.balance > 0 ? 'text-rose-600' : 'text-emerald-700'">
                          ৳ {{ entry.balance | number:'1.2-2' }}
                        </td>
                        <td class="p-2 text-slate-500 text-[11px] truncate max-w-[150px]">{{ entry.note || entry.payment_method || '—' }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="p-6 text-center text-slate-400">
                          {{ isLoadingLedger ? 'Loading ledger transactions...' : 'No ledger transactions recorded for this customer.' }}
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
        <button nz-button nzType="primary" (click)="printCustomerStatement()">
          <span nz-icon nzType="printer"></span> Print Statement
        </button>
      </ng-template>
    </nz-modal>
  `,

})
export class CustomerListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly customerService = inject(CustomerService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  searchName = '';
  searchPhone = '';
  filterType = '';
  dueOnly = false;
  customerTypes = ['Regular', 'Wholesale Client', 'VIP', 'Staff', 'Doctor Referral'];

  activeLedgerCustomer: CustomerRow | null = null;
  customerLedgerEntries: any[] = [];
  isLoadingLedger = false;
  isLedgerModalVisible = false;

  isAddCustomerTypeOpen = false;
  newCustomerTypeName = '';

  saveNewCustomerType(): void {
    const val = this.newCustomerTypeName.trim();
    if (!val) {
      this.msg.error('Customer type name is required');
      return;
    }
    if (!this.customerTypes.includes(val)) {
      this.customerTypes.push(val);
    }
    this.form.type = val;
    this.isAddCustomerTypeOpen = false;
    this.msg.success(`Customer type "${val}" added!`);
  }

  customers = signal<CustomerRow[]>([]);

  filteredCustomers = computed(() => {
    const qName = this.searchName.trim().toLowerCase();
    const qPhone = this.searchPhone.trim();
    const qType = this.filterType;

    return this.customers().filter(c => {
      const matchName = !qName || c.name.toLowerCase().includes(qName);
      const matchPhone = !qPhone || c.phone.includes(qPhone);
      const matchType = !qType || c.type === qType;
      const matchDue = !this.dueOnly || c.balance > 0;
      return matchName && matchPhone && matchType && matchDue;
    });
  });

  totalCustomerDue = computed(() => this.filteredCustomers().reduce((sum, c) => sum + (c.balance || 0), 0));
  totalLoyaltyPoints = computed(() => this.filteredCustomers().reduce((sum, c) => sum + (c.points || 0), 0));

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    customer_no: 0,
    name: '',
    phoneSuffix: '',
    gender: 'Male',
    type: 'Regular',
    discountPercent: 0,
    email: '',
    address: '',
    note: '',
    dueEnabled: false,
    balance: 0,
    dueDate: '',
    isLoyalty: false,
  };

  // Collect Due State
  isCollectOpen = false;
  activeCustomer: CustomerRow | null = null;
  collectAmount = 0;
  collectMethod = 'Cash';
  isLoading = signal(false);

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadCustomers();
    });
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  onFilterChange(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading.set(true);
    const params: Record<string, unknown> = { pageSize: 100 };
    if (this.searchName.trim()) params['search'] = this.searchName.trim();
    if (this.searchPhone.trim()) params['phone'] = this.searchPhone.trim();
    if (this.filterType) params['type'] = this.filterType;
    if (this.dueOnly) params['dueOnly'] = true;

    this.customerService.getCustomers(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const mapped: CustomerRow[] = (res.data.items || []).map((c: any) => ({
            customer_no: c.customer_no,
            name: c.name,
            phone: c.phone || '',
            type: c.customer_type ? (c.customer_type === 2 ? 'Doctor Referral' : (c.customer_type === 3 ? 'VIP' : (c.customer_type === 4 ? 'Wholesale Client' : 'Regular'))) : 'Regular',
            address: c.address || 'Local Area',
            balance: c.total_due || 0,
            points: c.loyalty_points || 0,
            dueDate: c.due_date || '—',
            gender: c.gender === 2 ? 'Female' : 'Male',
            discountPercent: c.discount_percent || 0,
            email: c.email || '',
            note: c.notes || '',
            isLoyalty: c.is_loyalty_member || false,
          }));
          this.customers.set(mapped);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  resetFilters(): void {
    this.searchName = '';
    this.searchPhone = '';
    this.filterType = '';
    this.dueOnly = false;
    this.loadCustomers();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.form = {
      customer_no: 0,
      name: '',
      phoneSuffix: '',
      gender: 'Male',
      type: 'Regular',
      discountPercent: 0,
      email: '',
      address: '',
      note: '',
      dueEnabled: false,
      balance: 0,
      dueDate: '',
      isLoyalty: false,
    };
    this.isModalVisible = true;
  }

  openEditModal(item: CustomerRow): void {
    this.modalMode = 'edit';
    const phoneDigits = item.phone.replace(/^\+880\s*/, '');
    this.form = {
      customer_no: item.customer_no,
      name: item.name,
      phoneSuffix: phoneDigits,
      gender: item.gender || 'Male',
      type: item.type,
      discountPercent: item.discountPercent || 0,
      email: item.email || '',
      address: item.address,
      note: item.note || '',
      dueEnabled: item.balance > 0,
      balance: item.balance,
      dueDate: item.dueDate === '—' ? '' : item.dueDate,
      isLoyalty: !!item.isLoyalty,
    };
    this.isModalVisible = true;
  }

  saveCustomer(): void {
    if (!this.form.name.trim()) {
      this.msg.error('Please enter customer name');
      return;
    }
    if (!this.form.phoneSuffix.trim()) {
      this.msg.error('Please enter customer phone');
      return;
    }

    const fullPhone = `+880 ${this.form.phoneSuffix.trim()}`;
    const bal = this.form.dueEnabled ? Number(this.form.balance) || 0 : 0;

    const typeCode = this.form.type === 'Doctor Referral' ? 2 : (this.form.type === 'VIP' ? 3 : (this.form.type === 'Wholesale Client' ? 4 : 1));

    const payload: Partial<CustCustomer> = {
      name: this.form.name.trim(),
      phone: fullPhone,
      customer_type: typeCode,
      address: this.form.address.trim() || 'Local Area',
      total_due: bal,
      gender: this.form.gender === 'Female' ? 2 : 1,
      discount_percent: this.form.discountPercent,
      email: this.form.email,
      notes: this.form.note,
      is_loyalty_member: this.form.isLoyalty,
      is_active: true,
    };

    if (this.modalMode === 'create') {
      this.customerService.createCustomer(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.msg.success(`Customer "${this.form.name}" created!`);
            this.isModalVisible = false;
            this.loadCustomers();
          } else {
            this.msg.error(res.message || 'Failed to create customer');
          }
        },
        error: (err) => this.msg.error(err?.error?.message || 'Failed to create customer'),
      });
    } else {
      this.customerService.updateCustomer(this.form.customer_no, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.msg.success(`Customer "${this.form.name}" updated!`);
            this.isModalVisible = false;
            this.loadCustomers();
          } else {
            this.msg.error(res.message || 'Failed to update customer');
          }
        },
        error: (err) => this.msg.error(err?.error?.message || 'Failed to update customer'),
      });
    }
  }

  viewLedger(c: CustomerRow): void {
    this.activeLedgerCustomer = c;
    this.isLedgerModalVisible = true;
    this.isLoadingLedger = true;
    this.customerLedgerEntries = [];
    this.customerService.getCustomerLedger(c.customer_no).subscribe({
      next: (res) => {
        this.isLoadingLedger = false;
        if (res.success && res.data?.ledger) {
          this.customerLedgerEntries = res.data.ledger;
        }
      },
      error: () => {
        this.isLoadingLedger = false;
      }
    });
  }

  printCustomerStatement(): void {
    window.print();
  }

  exportCustomersCsv(): void {
    const list = this.filteredCustomers();
    if (!list.length) {
      this.msg.warning('No customer records to export.');
      return;
    }
    const headers = ['Customer Name', 'Phone', 'Type', 'Address', 'Current Due (৳)', 'Loyalty Points'];
    const rows = list.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.type || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      (c.balance || 0).toFixed(2),
      c.points || 0
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} customers to CSV`);
  }

  openCollectModal(c: CustomerRow): void {
    this.activeCustomer = c;
    this.collectAmount = c.balance;
    this.collectMethod = 'Cash';
    this.isCollectOpen = true;
  }

  submitCollect(): void {
    if (!this.activeCustomer || this.collectAmount <= 0) {
      this.msg.error('Please enter a valid collection amount');
      return;
    }
    const paid = this.collectAmount;
    const custName = this.activeCustomer.name;
    const custPhone = this.activeCustomer.phone;

    this.customerService
      .collectDue({
        customer: custName,
        phone: custPhone,
        amount: paid,
        method: this.collectMethod,
        note: `Counter collection from ${custName}`,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.msg.success(`Collected ৳ ${paid.toLocaleString()} from ${custName}`);
            this.isCollectOpen = false;
            this.loadCustomers();
          } else {
            this.msg.error(res.message || 'Failed to record collection');
          }
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to record collection');
        },
      });
  }

  deleteCustomer(c: CustomerRow): void {
    this.modal.confirmAction(
      'Delete Customer?',
      `Are you sure you want to delete customer "${c.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.customerService.deleteCustomer(c.customer_no).subscribe({
          next: (res) => {
            if (res.success) {
              this.msg.success(`Customer "${c.name}" deleted successfully`);
              this.loadCustomers();
            } else {
              this.msg.error(res.message || 'Failed to delete customer');
            }
          },
          error: (err) => this.msg.error(err?.error?.message || 'Failed to delete customer'),
        });
      }
    });
  }
}

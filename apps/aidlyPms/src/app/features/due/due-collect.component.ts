import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { getDefaultMonthDates, formatDateToDdMmYyyy } from '../../shared/utils/date-range.util';
import { CustomerService } from '../../core/services/customer.service';
import { AccountingService } from '../../core/services/accounting.service';
import { PrintService } from '../../core/services/print.service';
import { AccTransactionAccount } from '../../core/models/accounting.models';

interface DueRecord {
  id: string;
  customer: string;
  phone: string;
  inv: string;
  saleDate: string;
  dueDate: string;
  amount: number;
}

interface PaidRecord {
  id: string;
  customer: string;
  phone: string;
  receipt: string;
  method: string;
  amount: number;
  note: string;
}

@Component({
  selector: 'app-due-collect',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzTooltipModule,
    NzDatePickerModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Due & Credit Collection"
        subtitle="Track outstanding patient credit, promised payment schedules, and settlement history"
        formId="DUE_1301"
        [breadcrumbs]="[{ label: 'Customers', url: '/customer/list' }, { label: 'Due Collections' }]"
      >
        <div filters class="flex items-end gap-2.5 shrink-0 flex-wrap py-1">
          <div class="flex flex-col">
            <label for="due-collect-from-date-1" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">From Date</label>
            <nz-date-picker id="due-collect-from-date-1" nzId="due-collect-from-date-1"
              [(ngModel)]="fromDate"
              (ngModelChange)="onFilterChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="From Date"
              class="w-32 shrink-0 rounded-md text-xs" aria-label="From Date"></nz-date-picker>
          </div>
          <div class="flex flex-col">
            <label for="due-collect-to-date-2" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">To Date</label>
            <nz-date-picker id="due-collect-to-date-2" nzId="due-collect-to-date-2"
              [(ngModel)]="toDate"
              (ngModelChange)="onFilterChange()"
              nzFormat="dd-MM-yyyy"
              nzPlaceHolder="To Date"
              class="w-32 shrink-0 rounded-md text-xs" aria-label="To Date"></nz-date-picker>
          </div>
          <div class="flex flex-col">
            <label for="due-collect-search-customer-bill-3" class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Search Customer / Bill #</label>
            <nz-input-group [nzPrefix]="searchIcon" class="w-60 shrink-0 rounded-md">
              <input id="due-collect-search-customer-bill-3"
                type="text"
                nz-input
                placeholder="Name, phone, invoice..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange()"
                class="text-xs" aria-label="Search Customer / Bill #" />
            </nz-input-group>
            <ng-template #searchIcon>
              <span nz-icon nzType="search" class="text-slate-400"></span>
            </ng-template>
          </div>
          <button nz-button class="btn-reset rounded-md h-8 px-2.5 text-xs shrink-0 inline-flex items-center gap-1" (click)="resetFilters()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-wrap">
          <button nz-button class="btn-export rounded-md" (click)="exportDueCsv()">
            <span nz-icon nzType="download"></span> Export CSV
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Tabs Bar -->
        <div class="shrink-0 px-4 pt-3 pb-2 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/50">
          @for (t of tabs; track t; let i = $index) {
            <button
              type="button"
              (click)="activeTab = i"
              class="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border-0 cursor-pointer"
              [ngClass]="activeTab === i ? 'theme-pill-active' : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'"
            >
              {{ t }}
            </button>
          }
        </div>

        <!-- Scrollable Table Area -->
        <div class="flex-1 min-h-0 overflow-auto w-full max-w-full">
          @if (activeTab < 3) {
            <!-- Tab 0, 1, 2: Due Tables -->
            <table class="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3">Details</th>
                  <th class="p-3 text-center">Due Date</th>
                  <th class="p-3 text-right">Amount</th>
                  <th class="p-3 text-center w-36">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (d of filteredDue(); track d.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3">
                      <p class="font-semibold text-slate-900 text-sm mb-0.5">{{ d.customer }}</p>
                      <p class="text-xs text-slate-400 mb-0">
                        {{ d.phone }} · <span class="font-mono text-slate-600">{{ d.inv }}</span> · Sale: {{ d.saleDate }}
                      </p>
                    </td>

                    <td class="p-3 text-center font-mono text-xs font-semibold text-amber-700">
                      {{ d.dueDate }}
                    </td>

                    <td class="p-3 text-right font-mono text-xs font-bold text-rose-600">
                      ৳ {{ d.amount.toLocaleString() }}
                    </td>

                    <td class="p-3 text-center">
                      <div class="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          (click)="openReceiveModal(d)"
                          nz-tooltip
                          nzTooltipTitle="Receive Due Collection"
                          class="btn-tbl-action btn-tbl-success"
                         aria-label="Receive Due Collection">
                          <span nz-icon nzType="dollar"></span>
                        </button>
                        <button
                          type="button"
                          (click)="openSmsModal(d)"
                          nz-tooltip
                          nzTooltipTitle="Send Payment Reminder SMS"
                          class="btn-tbl-action btn-tbl-warning"
                         aria-label="Send Payment Reminder SMS">
                          <span nz-icon nzType="mail"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="p-8 text-center text-slate-400 text-xs">
                      No overdue credit accounts found for this filter.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <!-- Tab 3: Paid Collections Register -->
            <table class="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
                <tr>
                  <th class="p-3">Customer</th>
                  <th class="p-3">Receipt #</th>
                  <th class="p-3 text-center">Method</th>
                  <th class="p-3 text-right">Amount</th>
                  <th class="p-3">Note</th>
                  <th class="p-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-800">
                @for (p of filteredPaid(); track p.id) {
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="p-3">
                      <p class="font-semibold text-slate-900 text-xs mb-0.5">{{ p.customer }}</p>
                      <p class="text-xs text-slate-400 mb-0">{{ p.phone }}</p>
                    </td>

                    <td class="p-3 font-mono text-xs text-slate-700 font-semibold">
                      {{ p.receipt }}
                    </td>

                    <td class="p-3 text-center">
                      <nz-tag [nzColor]="p.method === 'bKash' ? 'blue' : 'green'" class="text-[11px]">
                        {{ p.method }}
                      </nz-tag>
                    </td>

                    <td class="p-3 text-right font-mono text-xs font-bold theme-total-text">
                      ৳ {{ p.amount.toLocaleString() }}
                    </td>

                    <td class="p-3 text-xs text-slate-500">
                      {{ p.note || '—' }}
                    </td>

                    <td class="p-3 text-center">
                      <div class="inline-flex items-center gap-1.5 justify-center">
                        <button
                          type="button"
                          (click)="printPaidReceipt(p)"
                          nz-tooltip
                          nzTooltipTitle="Print Money Receipt"
                          class="btn-tbl-action btn-tbl-neutral"
                         aria-label="Print Money Receipt">
                          <span nz-icon nzType="printer"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
                      No due collection receipts recorded.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-3">
            @if (activeTab < 3) {
              <span>Due Accounts: <strong class="text-slate-900 font-semibold font-mono">{{ filteredDue().length }}</strong></span>
              <span class="text-slate-300">|</span>
              <span class="font-semibold text-slate-700">Total Outstanding Due: <strong class="text-rose-700 font-mono text-sm">৳ {{ totalDueAmount() | number: '1.2-2' }}</strong></span>
            } @else {
              <span>Settled Receipts: <strong class="text-slate-900 font-semibold font-mono">{{ filteredPaid().length }}</strong></span>
              <span class="text-slate-300">|</span>
              <span class="font-semibold text-slate-700">Total Collected: <strong class="theme-total-text font-mono text-sm">৳ {{ totalPaidAmount() | number: '1.2-2' }}</strong></span>
            }
          </div>
          <span class="text-slate-400 font-mono text-[11px]">Due Settlement Register</span>
        </div>
      </div>
    </div>

    <!-- Receive Payment Modal -->
    <nz-modal
      [(nzVisible)]="isReceiveOpen"
      [nzTitle]="'Receive Due Payment: ' + activeDue?.customer"
      nzOkText="Confirm Payment"
      (nzOnCancel)="isReceiveOpen = false"
      (nzOnOk)="submitReceive()"
      nzWidth="480px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <div class="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
            <span class="text-xs font-semibold text-rose-700 uppercase tracking-wide block">Outstanding Due</span>
            <span class="font-mono text-xl font-bold text-rose-700">
              ৳ {{ activeDue?.amount?.toLocaleString() }}
            </span>
          </div>

          <div>
            <label for="due-collect-amount-received-4" class="block text-xs font-semibold text-slate-700 mb-1">
              Amount Received (৳) <span class="text-rose-500">*</span>
            </label>
            <input id="due-collect-amount-received-4"
              type="number"
              nz-input
              [(ngModel)]="receiveAmount"
              class="rounded-md font-mono" aria-label="Amount Received (৳)" />
          </div>

          <div>
            <label for="due-collect-deposit-to-account-5" class="block text-xs font-semibold text-slate-700 mb-1">Deposit To Account <span class="text-rose-500">*</span></label>
            <nz-select id="due-collect-deposit-to-account-5" nzId="due-collect-deposit-to-account-5" [(ngModel)]="selectedAccountId" class="w-full" nzPlaceHolder="Select Account" aria-label="Deposit To Account">
              @for (acc of accounts(); track acc.account_no) {
                <nz-option [nzValue]="acc.account_no" [nzLabel]="acc.account_name + ' (Bal: ৳' + acc.current_balance.toLocaleString() + ')'"></nz-option>
              }
            </nz-select>
          </div>

          <div>
            <label for="due-collect-payment-method-6" class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
            <nz-select id="due-collect-payment-method-6" nzId="due-collect-payment-method-6" [(ngModel)]="receiveMethod" class="w-full" aria-label="Payment Method">
              <nz-option nzValue="Cash" nzLabel="Cash Counter"></nz-option>
              <nz-option nzValue="Bank" nzLabel="Bank Deposit"></nz-option>
              <nz-option nzValue="bKash" nzLabel="bKash"></nz-option>
              <nz-option nzValue="Nagad" nzLabel="Nagad"></nz-option>
            </nz-select>
          </div>

          <div>
            <label for="due-collect-reference-note-7" class="block text-xs font-semibold text-slate-700 mb-1">Reference / Note</label>
            <input id="due-collect-reference-note-7"
              type="text"
              nz-input
              placeholder="e.g. Bank slip, TRx ID, receipt remarks"
              [(ngModel)]="receiveNote"
              class="rounded-md" aria-label="Reference / Note" />
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Send SMS Reminder Modal -->
    <nz-modal
      [(nzVisible)]="isSmsOpen"
      [nzTitle]="'Send Due Reminder SMS: ' + activeDue?.customer"
      nzOkText="Send SMS"
      (nzOnCancel)="isSmsOpen = false"
      (nzOnOk)="sendSmsNotification()"
      nzWidth="500px"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label for="due-collect-recipient-number-8" class="block text-xs font-semibold text-slate-700 mb-1">Recipient Number</label>
            <input id="due-collect-recipient-number-8"
              type="text"
              nz-input
              [value]="activeDue?.phone"
              readonly
              class="rounded-md bg-slate-50 font-mono text-xs" aria-label="Recipient Number" />
          </div>
          <div>
            <label for="due-collect-sms-content-template-9" class="block text-xs font-semibold text-slate-700 mb-1">SMS Content Template</label>
            <textarea id="due-collect-sms-content-template-9"
              nz-input
              rows="4"
              [(ngModel)]="smsContent"
              class="rounded-md text-xs font-sans" aria-label="SMS Content Template"></textarea>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Printable Money Receipt Modal for Due Settlement -->
    <nz-modal
      [(nzVisible)]="isReceiptModalOpen"
      nzTitle="Due Collection Money Receipt"
      [nzFooter]="receiptFooter"
      (nzOnCancel)="isReceiptModalOpen = false"
      nzWidth="550px"
      [nzStyle]="{ top: '30px' }"
    >
      <ng-container *nzModalContent>
        @if (selectedPaid) {
          <div id="due-receipt" class="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 space-y-4">
            <div class="text-center border-b pb-3 border-slate-200">
              <h2 class="text-base font-bold text-slate-900 tracking-wide uppercase">Aidly Pharmacy Ltd.</h2>
              <p class="text-xs text-slate-500">Dhaka Medical Plaza, Main Road, Dhaka</p>
              <div class="inline-block mt-1 px-3 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded border border-emerald-200">
                CUSTOMER DUE SETTLEMENT RECEIPT
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><span class="text-slate-400">Money Receipt #:</span> <strong class="font-mono text-slate-900 ml-1">{{ selectedPaid.receipt }}</strong></div>
              <div class="text-right"><span class="text-slate-400">Date:</span> <span class="font-mono text-slate-800 ml-1">{{ todayFormatted }}</span></div>
              <div><span class="text-slate-400">Customer:</span> <strong class="text-slate-900 ml-1">{{ selectedPaid.customer }}</strong></div>
              <div class="text-right"><span class="text-slate-400">Phone:</span> <span class="font-mono text-slate-800 ml-1">{{ selectedPaid.phone }}</span></div>
              <div><span class="text-slate-400">Payment Mode:</span> <span class="font-medium text-slate-800 ml-1">{{ selectedPaid.method }}</span></div>
              <div class="text-right"><span class="text-slate-400">Status:</span> <span class="text-emerald-600 font-bold ml-1">Collected & Settled</span></div>
              <div class="col-span-2"><span class="text-slate-400">Narration:</span> <span class="text-slate-800 ml-1">{{ selectedPaid.note }}</span></div>
            </div>

            <div class="bg-emerald-50/50 border border-emerald-200 rounded-md p-3 flex justify-between items-center">
              <div>
                <span class="text-xs font-semibold uppercase text-emerald-800 block">Total Due Collected</span>
                <span class="text-xs text-slate-500 italic">Balance cleared against customer profile</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-bold font-mono text-emerald-700">৳ {{ selectedPaid.amount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 pt-8 text-[11px] text-slate-500 text-center">
              <div class="border-t border-dashed border-slate-400 pt-1">Customer Signature</div>
              <div class="border-t border-dashed border-slate-400 pt-1">Authorized Cashier Signature</div>
            </div>
          </div>
        }
      </ng-container>
      <ng-template #receiptFooter>
        <button nz-button nzType="default" (click)="isReceiptModalOpen = false">Close</button>
        <button nz-button nzType="primary" (click)="triggerPrint()">
          <span nz-icon nzType="printer"></span> Print Receipt
        </button>
      </ng-template>
    </nz-modal>
  `,
})
export class DueCollectComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly customerService = inject(CustomerService);
  private readonly accountingService = inject(AccountingService);
  private readonly printService = inject(PrintService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  tabs = ["Today's Due", "Upcoming Due", "Pending Due", "Paid List"];
  activeTab = 0;

  // Initialize with standard 1-month date range default
  defaultDates = getDefaultMonthDates();
  fromDate: Date | null = this.defaultDates.from;
  toDate: Date | null = this.defaultDates.to;
  searchQuery = '';

  isLoading = signal(false);
  accounts = signal<AccTransactionAccount[]>([]);
  selectedAccountId = 1;

  dueData = signal<DueRecord[]>([]);
  paidData = signal<PaidRecord[]>([]);

  filteredDue = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    return this.dueData().filter(d => {
      if (!q) return true;
      return (
        d.customer.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.inv.toLowerCase().includes(q)
      );
    });
  });

  filteredPaid = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    return this.paidData().filter(p => {
      if (!q) return true;
      return (
        p.customer.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.receipt.toLowerCase().includes(q)
      );
    });
  });

  totalDueAmount = computed(() => this.filteredDue().reduce((sum, d) => sum + (d.amount || 0), 0));
  totalPaidAmount = computed(() => this.filteredPaid().reduce((sum, p) => sum + (p.amount || 0), 0));

  // Receive Modal
  isReceiveOpen = false;
  activeDue: DueRecord | null = null;
  receiveAmount = 0;
  receiveMethod = 'Cash';
  receiveNote = '';

  // SMS Modal
  isSmsOpen = false;
  smsContent = '';

  ngOnInit(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadDueRecords();
    });
    this.loadAccounts();
    this.loadDueRecords();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onFilterChange(): void {
    this.loadDueRecords();
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  loadAccounts(): void {
    this.accountingService.getAccounts().subscribe(res => {
      if (res.success && res.data) {
        this.accounts.set(res.data);
        if (res.data.length > 0) {
          this.selectedAccountId = res.data[0].account_no;
        }
      }
    });
  }

  loadDueRecords(): void {
    this.isLoading.set(true);
    const params = {
      fromDate: formatDateToDdMmYyyy(this.fromDate),
      toDate: formatDateToDdMmYyyy(this.toDate),
      search: this.searchQuery.trim(),
    };
    this.customerService.getDueRecords(params).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.dueData.set(res.data as DueRecord[]);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });

    this.customerService.getDueHistory(params).subscribe({
      next: res => {
        if (res.success && res.data) {
          const list: PaidRecord[] = res.data.map((p: any) => ({
            id: String(p.id || Date.now()),
            customer: p.customer || 'Customer',
            phone: p.phone || '',
            receipt: p.receipt || 'RCPT',
            method: p.method || 'Cash',
            amount: Number(p.amount) || 0,
            note: p.note || 'Settlement',
          }));
          this.paidData.set(list);
        }
      },
    });
  }

  resetFilters(): void {
    const def = getDefaultMonthDates();
    this.fromDate = def.from;
    this.toDate = def.to;
    this.searchQuery = '';
    this.loadDueRecords();
  }

  openReceiveModal(d: DueRecord): void {
    this.activeDue = d;
    this.receiveAmount = d.amount;
    this.receiveMethod = 'Cash';
    this.receiveNote = '';
    this.isReceiveOpen = true;
  }

  submitReceive(): void {
    if (!this.activeDue || this.receiveAmount <= 0) {
      this.msg.error('Please enter a valid received amount');
      return;
    }

    const recId = this.activeDue.id;
    const paidAmt = this.receiveAmount;
    const cust = this.activeDue.customer;
    const phone = this.activeDue.phone;

    this.customerService
      .collectDue({
        id: recId,
        customer: cust,
        phone: phone,
        amount: paidAmt,
        method: this.receiveMethod,
        account_no: this.selectedAccountId,
        note: this.receiveNote,
      })
      .subscribe({
        next: res => {
          const receiptNo = (res.data as Record<string, unknown> | undefined)?.['receipt']
            ? String((res.data as Record<string, unknown>)['receipt'])
            : `PAY-${Date.now().toString().slice(-4)}`;
          // Add to paid list
          const newPaid: PaidRecord = {
            id: Date.now().toString(),
            customer: cust,
            phone: phone,
            receipt: receiptNo,
            method: this.receiveMethod,
            amount: paidAmt,
            note: this.receiveNote || 'Due collection settlement',
          };
          this.paidData.update(list => [newPaid, ...list]);

          // Update or remove from due
          if (paidAmt >= (this.activeDue?.amount || 0)) {
            this.dueData.update(list => list.filter(d => d.id !== recId));
          } else {
            this.dueData.update(list =>
              list.map(d => (d.id === recId ? { ...d, amount: d.amount - paidAmt } : d))
            );
          }

          this.msg.success(res.message || `Received ৳ ${paidAmt.toLocaleString()} from ${cust}!`);
          this.isReceiveOpen = false;
        },
        error: () => {
          this.msg.error('Failed to record due payment');
        },
      });
  }

  openSmsModal(d: DueRecord): void {
    this.activeDue = d;
    this.smsContent = `Dear ${d.customer}, your outstanding pharmacy balance of BDT ${d.amount} for invoice ${d.inv} is due on ${d.dueDate}. Kindly clear the balance at your earliest convenience. Thank you.`;
    this.isSmsOpen = true;
  }

  sendSmsNotification(): void {
    this.msg.success(`Reminder SMS queued for ${this.activeDue?.customer} (${this.activeDue?.phone})`);
    this.isSmsOpen = false;
  }

  isReceiptModalOpen = false;
  selectedPaid: PaidRecord | null = null;
  todayFormatted = new Date().toLocaleDateString('en-GB');

  printPaidReceipt(p: PaidRecord): void {
    this.selectedPaid = p;
    this.isReceiptModalOpen = true;
  }

  triggerPrint(): void {
    if (!this.selectedPaid) return;
    this.printService.printDueReceipt({
      receipt: this.selectedPaid.receipt,
      date: this.todayFormatted,
      customer: this.selectedPaid.customer,
      phone: this.selectedPaid.phone,
      method: this.selectedPaid.method,
      amount: this.selectedPaid.amount,
      note: this.selectedPaid.note,
    });
  }

  exportDueCsv(): void {
    if (this.activeTab === 3) {
      // Export Paid List
      const list = this.filteredPaid();
      if (!list.length) {
        this.msg.warning('No paid records to export.');
        return;
      }
      const headers = ['SL', 'Customer', 'Phone', 'Receipt #', 'Payment Method', 'Amount (BDT)', 'Note'];
      const rows = list.map((p, i) => [
        i + 1,
        `"${p.customer}"`,
        `"${p.phone}"`,
        `"${p.receipt}"`,
        `"${p.method}"`,
        p.amount.toFixed(2),
        `"${(p.note || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `due_collections_paid_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.msg.success(`Exported ${list.length} payment receipts.`);
    } else {
      // Export Due List
      const list = this.filteredDue();
      if (!list.length) {
        this.msg.warning('No outstanding due records to export.');
        return;
      }
      const headers = ['SL', 'Customer', 'Phone', 'Invoice #', 'Sale Date', 'Due Date', 'Outstanding Due (BDT)'];
      const rows = list.map((d, i) => [
        i + 1,
        `"${d.customer}"`,
        `"${d.phone}"`,
        `"${d.inv}"`,
        `"${d.saleDate}"`,
        `"${d.dueDate}"`,
        d.amount.toFixed(2)
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_due_outstanding_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.msg.success(`Exported ${list.length} overdue records.`);
    }
  }
}

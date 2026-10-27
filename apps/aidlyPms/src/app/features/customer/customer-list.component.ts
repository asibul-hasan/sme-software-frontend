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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';
import { ModalService } from '../../core/services/modal.service';
import { CustomerService } from '../../core/services/customer.service';
import { PrintService } from '../../core/services/print.service';
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
    NzDatePickerModule,
    PageHeaderComponent,
    EmptyStateComponent,
    NzSpinModule,
    MenuActionDirective,
  ],
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly customerService = inject(CustomerService);
  private readonly printService = inject(PrintService);

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
  hasError = signal(false);
  errorMessage = signal('');

  hasActiveFilters = computed(() => {
    return !!(this.searchName.trim() || this.searchPhone.trim() || this.filterType || this.dueOnly);
  });

  resetSearchFilters(): void {
    this.searchName = '';
    this.searchPhone = '';
    this.filterType = '';
    this.dueOnly = false;
    this.loadCustomers();
  }

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadCustomers();
    } else if (this.hasActiveFilters()) {
      this.resetSearchFilters();
    } else {
      this.openAddModal();
    }
  }

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
    this.hasError.set(false);
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
        this.hasError.set(true);
        this.errorMessage.set('Failed to retrieve customer directory.');
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
    if (!this.activeLedgerCustomer) {
      this.msg.warning('No customer selected for statement.');
      return;
    }
    this.printService.printCustomerStatement(
      this.activeLedgerCustomer,
      this.customerLedgerEntries
    );
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

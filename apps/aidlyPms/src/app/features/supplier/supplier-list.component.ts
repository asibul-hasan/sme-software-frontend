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
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
    EmptyStateComponent,
    NzSpinModule,
  ],
  templateUrl: './supplier-list.component.html',
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
  hasError = signal(false);
  errorMessage = signal('');

  hasActiveFilters = computed(() => {
    return !!(this.searchName.trim() || this.searchPhone.trim() || this.dueOnly);
  });

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadSuppliers();
    } else if (this.hasActiveFilters()) {
      this.resetFilters();
    } else {
      this.openAddModal();
    }
  }
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
    this.hasError.set(false);
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
        this.hasError.set(true);
        this.errorMessage.set('Failed to retrieve supplier directory.');
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

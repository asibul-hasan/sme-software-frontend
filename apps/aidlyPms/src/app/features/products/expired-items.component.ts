import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { StocktakeService } from '../../core/services/stocktake.service';
import { UnreceivedSaleItem } from '../../core/models/inventory.models';

interface ExpiredItem {
  id: number;
  name: string;
  form: string;
  strength: string;
  company: string;
  expiry: string;
  qty: number;
  daysLeft: number;
  unitPrice: number;
}

@Component({
  selector: 'app-expired-items',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzTooltipModule,
    NzCheckboxModule,
    PageHeaderComponent,
    EmptyStateComponent,
    NzSpinModule,
  ],
  templateUrl: './expired-items.component.html',
})
export class ExpiredItemsComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly stocktakeService = inject(StocktakeService);

  activeTab = signal<'expired' | 'unreceived'>('expired');
  unreceivedSales = signal<UnreceivedSaleItem[]>([]);

  daysThreshold = 90;
  selectedCompany = '';
  selectedProduct = '';

  activeDays = 90;
  activeCompany = '';
  activeProduct = '';

  items = signal<ExpiredItem[]>([]);
  isLoading = signal(false);
  hasError = signal(false);
  productOptions = signal<string[]>([]);
  companyOptions = signal<string[]>([]);

  totalExpiredQty = computed(() => this.filteredItems().reduce((sum, item) => sum + item.qty, 0));
  totalExpiredValue = computed(() => this.filteredItems().reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0));

  selectedBatchIds = signal<Set<number>>(new Set());

  isAllSelected = computed(() => {
    const list = this.filteredItems();
    if (list.length === 0) return false;
    return list.every(i => this.selectedBatchIds().has(i.id));
  });

  isIndeterminate = computed(() => {
    const list = this.filteredItems();
    const count = list.filter(i => this.selectedBatchIds().has(i.id)).length;
    return count > 0 && count < list.length;
  });

  selectedCount = computed(() => this.selectedBatchIds().size);

  selectedItems = computed(() => {
    const ids = this.selectedBatchIds();
    return this.items().filter(i => ids.has(i.id));
  });

  selectedTotalUnits = computed(() => {
    return this.selectedItems().reduce((sum, i) => sum + i.qty, 0);
  });

  selectedTotalValue = computed(() => {
    return this.selectedItems().reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
  });

  filterCriteria = signal({ days: 90, company: '', product: '' });

  filteredItems = computed(() => {
    const criteria = this.filterCriteria();
    return this.items().filter(item => {
      const matchComp = !criteria.company || item.company === criteria.company;
      const matchProd = !criteria.product || item.name === criteria.product;
      const matchDays = item.daysLeft <= criteria.days;
      return matchComp && matchDays && matchProd;
    });
  });

  ngOnInit(): void {
    this.loadData();
    this.loadCompanies();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.productService.getNearExpiryBatches(Number(this.daysThreshold) || 90).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const mapped: ExpiredItem[] = res.data.map(b => {
            const expDate = b.expiry_date ? new Date(b.expiry_date) : new Date();
            const now = new Date();
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const unitPrice = b.quantity_in_box > 0 && b.cost_per_box > 0
              ? Number((b.cost_per_box / b.quantity_in_box).toFixed(2))
              : 0;

            return {
              id: b.batch_no,
              name: b.product_name || `Batch #${b.batch_number}`,
              form: 'Unit',
              strength: '',
              company: 'Manufacturer',
              expiry: expDate.toISOString().slice(0, 10),
              qty: b.total_quantity_pcs || 0,
              daysLeft: diffDays,
              unitPrice: unitPrice,
            };
          });
          this.items.set(mapped);
          this.selectedBatchIds.update(set => new Set([...set].filter(id => mapped.some(m => m.id === id))));
          const prods = Array.from(new Set(mapped.map(i => i.name).filter(Boolean)));
          this.productOptions.set(prods);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      }
    });
  }

  toggleSelectItem(id: number): void {
    this.selectedBatchIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      const allIds = this.filteredItems().map(i => i.id);
      this.selectedBatchIds.set(new Set(allIds));
    } else {
      this.selectedBatchIds.set(new Set());
    }
  }

  clearSelection(): void {
    this.selectedBatchIds.set(new Set());
  }

  quarantineSelected(): void {
    const selected = this.selectedItems();
    if (selected.length === 0) {
      this.msg.warning('Please select one or more expiring batches to quarantine.');
      return;
    }

    this.modal
      .confirmDelete(
        `${selected.length} Selected Batch(es)`,
        `This will immediately adjust stock to 0 and record inventory quarantine loss for ${this.selectedTotalUnits()} units (valued at ৳ ${this.selectedTotalValue().toFixed(2)}).`
      )
      .subscribe(confirmed => {
        if (confirmed) {
          this.isLoading.set(true);
          const observables = selected.map(item =>
            this.productService.adjustProductStock(item.id, {
              target_stock_pcs: 0,
              reason: 'Physical Stock Audit',
              remarks: `Quarantined near-expiry batch: ${item.name} (${item.qty} pcs)`,
            })
          );

          forkJoin(observables).subscribe({
            next: () => {
              this.msg.success(`Successfully quarantined ${selected.length} batch(es) from active stock.`);
              this.clearSelection();
              this.loadData();
            },
            error: () => {
              this.msg.warning('Quarantine batch updates processed, refreshing inventory state.');
              this.clearSelection();
              this.loadData();
            }
          });
        }
      });
  }

  createSupplierExpiryReturn(): void {
    const selected = this.selectedItems();
    if (selected.length === 0) {
      this.msg.warning('Please select one or more expiring batches to return to vendor.');
      return;
    }

    const batchIds = selected.map(i => i.id).join(',');
    const productNames = encodeURIComponent(selected.map(i => i.name).join(','));

    this.router.navigate(['/supplier/purchase-return'], {
      queryParams: {
        batches: batchIds,
        products: productNames,
      },
    });
  }

  loadCompanies(): void {
    this.productService.getCompanies().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const comps = res.data.map(c => c.name).filter(Boolean);
          this.companyOptions.set(comps);
        }
      },
    });
  }

  onSearch(): void {
    this.filterCriteria.set({
      days: Number(this.daysThreshold) || 90,
      company: this.selectedCompany,
      product: this.selectedProduct,
    });
    this.loadData();
  }

  resetFilters(): void {
    this.daysThreshold = 90;
    this.selectedCompany = '';
    this.selectedProduct = '';
    this.onSearch();
  }

  initiateSupplierReturn(item: ExpiredItem): void {
    this.router.navigate(['/supplier/purchase-return'], {
      queryParams: {
        product: item.name,
        batch: item.id,
      },
    });
  }

  writeOffItem(item: ExpiredItem): void {
    this.modal
      .confirmDelete(item.name, `This will adjust stock to 0 and record expired inventory loss for ${item.qty} units.`)
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.adjustProductStock(item.id, {
            target_stock_pcs: 0,
            reason: 'Physical Stock Audit',
            remarks: `Write-off expired batch (${item.qty} pcs)`,
          }).subscribe({
            next: (res) => {
              if (res.success) {
                this.msg.success(`${item.name} written off from active inventory.`);
                this.loadData();
              } else {
                this.msg.error(res.message || 'Failed to write off item');
              }
            },
            error: (err) => {
              this.msg.error(err?.error?.message || 'Failed to write off item');
            }
          });
        }
      });
  }

  exportReport(): void {
    const list = this.filteredItems();
    if (!list.length) {
      this.msg.warning('No expired or near-expiry items to export.');
      return;
    }
    const headers = ['#', 'Product Name', 'Form', 'Manufacturer', 'Expiry Date', 'Days Left', 'Stock Qty (Pcs)', 'Unit Cost (৳)', 'Valuation (৳)'];
    const rows = list.map((item, i) => [
      i + 1,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.form || ''}"`,
      `"${(item.company || '').replace(/"/g, '""')}"`,
      item.expiry,
      item.daysLeft,
      item.qty,
      item.unitPrice.toFixed(2),
      (item.qty * item.unitPrice).toFixed(2),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expired_items_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Exported ${list.length} near-expiry items to CSV.`);
  }
}

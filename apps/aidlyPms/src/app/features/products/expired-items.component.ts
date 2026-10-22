import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';

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
    PageHeaderComponent,
  ],
  templateUrl: './expired-items.component.html',
})
export class ExpiredItemsComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  daysThreshold = 90;
  selectedCompany = '';
  selectedProduct = '';

  activeDays = 90;
  activeCompany = '';
  activeProduct = '';

  items = signal<ExpiredItem[]>([]);
  productOptions = signal<string[]>([]);
  companyOptions = signal<string[]>([]);

  totalExpiredQty = computed(() => this.filteredItems().reduce((sum, item) => sum + item.qty, 0));
  totalExpiredValue = computed(() => this.filteredItems().reduce((sum, item) => sum + (item.qty * (item.unitPrice || 0)), 0));

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
    this.productService.getNearExpiryBatches(Number(this.daysThreshold) || 90).subscribe({
      next: (res) => {
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
          const prods = Array.from(new Set(mapped.map(i => i.name).filter(Boolean)));
          this.productOptions.set(prods);
        }
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

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    this.modal
      .confirmAction(`Initiate Return for ${item.name}?`, `Create supplier debit note for ${item.qty} units from ${item.company}?`, 'Confirm Return')
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.update(list => list.filter(i => i.id !== item.id));
          this.msg.success(`Return invoice created for ${item.name}.`);
        }
      });
  }

  writeOffItem(item: ExpiredItem): void {
    this.modal
      .confirmDelete(item.name, `This will write off ${item.qty} units as damaged / expired inventory loss.`)
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.update(list => list.filter(i => i.id !== item.id));
          this.msg.success(`${item.name} written off from active inventory.`);
        }
      });
  }

  exportReport(): void {
    this.msg.success('Expiry audit report exported.');
  }
}

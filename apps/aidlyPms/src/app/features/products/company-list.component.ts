import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { ProdCompany } from '../../core/models/product.models';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './company-list.component.html',
})
export class CompanyListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);

  searchQuery = '';
  companies = signal<ProdCompany[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  filteredCompanies = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.companies();
    return this.companies().filter(c => c.name.toLowerCase().includes(q));
  });

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  currentForm: { company_no: number; name: string } = { company_no: 0, name: '' };

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading.set(true);
    this.productService.getCompanies().subscribe({
      next: res => {
        this.companies.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.msg.error('Failed to load companies from server.');
      },
    });
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.currentForm = { company_no: 0, name: '' };
    this.isModalVisible = true;
  }

  openEditModal(item: ProdCompany): void {
    this.modalMode = 'edit';
    this.currentForm = { company_no: item.company_no, name: item.name };
    this.isModalVisible = true;
  }

  saveCompany(): void {
    const name = this.currentForm.name.trim();
    if (!name) {
      this.msg.error('Please provide a valid company name.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode === 'create') {
      this.productService.createCompany({ name }).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.isModalVisible = false;
          this.msg.success(res.message || `Company "${name}" successfully registered!`);
          this.loadCompanies();
        },
        error: () => {
          this.isSaving.set(false);
          this.msg.error('Failed to register company.');
        },
      });
    } else {
      this.productService.updateCompany(this.currentForm.company_no, { name }).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.isModalVisible = false;
          this.msg.success(res.message || `Company "${name}" updated successfully!`);
          this.loadCompanies();
        },
        error: () => {
          this.isSaving.set(false);
          this.msg.error('Failed to update company.');
        },
      });
    }
  }

  deleteCompany(item: ProdCompany): void {
    this.modal
      .confirmDelete(`Company "${item.name}"`, 'This will permanently remove this company from the directory.')
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.deleteCompany(item.company_no).subscribe({
            next: () => {
              this.msg.success(`Company "${item.name}" removed.`);
              this.loadCompanies();
            },
            error: () => {
              this.msg.error('Failed to delete company.');
            },
          });
        }
      });
  }
}

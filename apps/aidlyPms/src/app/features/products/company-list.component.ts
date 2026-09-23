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
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        title="Pharmaceutical Companies"
        subtitle="Manage medicine manufacturers, distributors, and supplier brands"
        formId="PROD_1603"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Companies' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-72 shrink-0 rounded-md">
            <input
              type="text"
              nz-input
              placeholder="Search company name..."
              [(ngModel)]="searchQuery"
            />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>

          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="searchQuery = ''">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>

        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="primary" class="rounded-md" (click)="openAddModal()">
            <span nz-icon nzType="plus"></span> Add Company
          </button>
        </div>
      </app-page-header>

      <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <!-- Table Scroll Container -->
        <div class="flex-1 min-h-0 overflow-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th class="p-3 w-16 text-center">ID</th>
                <th class="p-3">Company Name</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (c of filteredCompanies(); track c.company_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 text-center font-mono text-xs text-slate-400">#{{ c.company_no }}</td>
                  <td class="p-3 font-semibold text-slate-900">{{ c.name }}</td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="openEditModal(c)"
                        nz-tooltip
                        nzTooltipTitle="Edit Company"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteCompany(c)"
                        nz-tooltip
                        nzTooltipTitle="Delete Company"
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
                    {{ isLoading() ? 'Loading companies from database...' : 'No pharmaceutical companies match your search.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span>Total Pharmaceutical Manufacturers: <strong class="text-slate-900 font-semibold font-mono">{{ filteredCompanies().length }}</strong></span>
          </div>
          <span class="text-slate-400">Verified System Master Record</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add New Company' : ('Modify Company: ' + currentForm.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Company' : 'Update Company'"
      [nzOkLoading]="isSaving()"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveCompany()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Company Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Beximco Pharmaceuticals Ltd."
              [(ngModel)]="currentForm.name"
              class="rounded-md"
              (keyup.enter)="saveCompany()"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
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

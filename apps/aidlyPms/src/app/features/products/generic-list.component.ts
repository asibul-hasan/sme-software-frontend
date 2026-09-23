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
import { ProdGeneric } from '../../core/models/product.models';

@Component({
  selector: 'app-generic-list',
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
        title="Generic Names & Compositions"
        subtitle="Manage active pharmaceutical ingredients (INN) and generic medicine groups"
        formId="PROD_1604"
        [breadcrumbs]="[{ label: 'Products', url: '/products/list' }, { label: 'Generics' }]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-72 shrink-0 rounded-md">
            <input
              type="text"
              nz-input
              placeholder="Search generic composition name..."
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
            <span nz-icon nzType="plus"></span> Add Generic
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
                <th class="p-3">Generic Composition / INN</th>
                <th class="p-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-800">
              @for (g of filteredGenerics(); track g.generic_no) {
                <tr class="hover:bg-slate-50/70 transition-colors">
                  <td class="p-3 text-center font-mono text-xs text-slate-400">#{{ g.generic_no }}</td>
                  <td class="p-3 font-semibold text-slate-900">{{ g.name }}</td>
                  <td class="p-3 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        (click)="openEditModal(g)"
                        nz-tooltip
                        nzTooltipTitle="Edit Generic"
                        class="btn-tbl-action btn-tbl-edit"
                      >
                        <span nz-icon nzType="edit"></span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteGeneric(g)"
                        nz-tooltip
                        nzTooltipTitle="Delete Generic"
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
                    {{ isLoading() ? 'Loading generics from database...' : 'No generic compositions match your search.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Sticky Bottom Footer -->
        <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <span>Total Generic Formulations: <strong class="text-slate-900 font-semibold font-mono">{{ filteredGenerics().length }}</strong></span>
          </div>
          <span class="text-slate-400">Active Pharmaceutical Ingredients Directory</span>
        </div>
      </div>
    </div>

    <!-- Unified Dual-Purpose Modal (Add & Modify) -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? 'Add New Generic' : ('Modify Generic: ' + currentForm.name)"
      [nzOkText]="modalMode === 'create' ? 'Save Generic' : 'Update Generic'"
      [nzOkLoading]="isSaving()"
      (nzOnCancel)="isModalVisible = false"
      (nzOnOk)="saveGeneric()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-3 py-1">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">
              Generic Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              nz-input
              placeholder="e.g. Paracetamol"
              [(ngModel)]="currentForm.name"
              class="rounded-md"
              (keyup.enter)="saveGeneric()"
            />
          </div>
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class GenericListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);

  searchQuery = '';
  generics = signal<ProdGeneric[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  filteredGenerics = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.generics();
    return this.generics().filter(g => g.name.toLowerCase().includes(q));
  });

  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  currentForm: { generic_no: number; name: string } = { generic_no: 0, name: '' };

  ngOnInit(): void {
    this.loadGenerics();
  }

  loadGenerics(): void {
    this.isLoading.set(true);
    this.productService.getGenerics().subscribe({
      next: res => {
        this.generics.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.msg.error('Failed to load generics from database.');
      },
    });
  }

  openAddModal(): void {
    this.modalMode = 'create';
    this.currentForm = { generic_no: 0, name: '' };
    this.isModalVisible = true;
  }

  openEditModal(item: ProdGeneric): void {
    this.modalMode = 'edit';
    this.currentForm = { generic_no: item.generic_no, name: item.name };
    this.isModalVisible = true;
  }

  saveGeneric(): void {
    const name = this.currentForm.name.trim();
    if (!name) {
      this.msg.error('Please enter a generic name.');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode === 'create') {
      this.productService.createGeneric({ name }).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.isModalVisible = false;
          this.msg.success(res.message || `Generic "${name}" registered!`);
          this.loadGenerics();
        },
        error: () => {
          this.isSaving.set(false);
          this.msg.error('Failed to register generic.');
        },
      });
    } else {
      this.productService.updateGeneric(this.currentForm.generic_no, { name }).subscribe({
        next: res => {
          this.isSaving.set(false);
          this.isModalVisible = false;
          this.msg.success(res.message || `Generic "${name}" updated!`);
          this.loadGenerics();
        },
        error: () => {
          this.isSaving.set(false);
          this.msg.error('Failed to update generic.');
        },
      });
    }
  }

  deleteGeneric(item: ProdGeneric): void {
    this.modal
      .confirmDelete(`Generic "${item.name}"`, 'This will permanently remove this generic composition from the registry.')
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.deleteGeneric(item.generic_no).subscribe({
            next: () => {
              this.msg.success(`Generic "${item.name}" removed.`);
              this.loadGenerics();
            },
            error: () => {
              this.msg.error('Failed to delete generic.');
            },
          });
        }
      });
  }
}

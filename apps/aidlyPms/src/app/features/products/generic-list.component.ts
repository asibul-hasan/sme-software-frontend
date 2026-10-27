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
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { ProdGeneric } from '../../core/models/product.models';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

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
    EmptyStateComponent,
    NzSpinModule,
    MenuActionDirective,
  ],
  templateUrl: './generic-list.component.html',
})
export class GenericListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);

  searchQuery = '';
  generics = signal<ProdGeneric[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  hasError = signal<boolean>(false);

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadGenerics();
    } else if (this.searchQuery.trim()) {
      this.searchQuery = '';
    } else {
      this.openAddModal();
    }
  }

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
    this.hasError.set(false);
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

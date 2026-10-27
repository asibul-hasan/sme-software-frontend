import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';
import { AuthService } from '../../core/auth/auth.service';
import { SysMenu } from '../../core/models/auth.models';
import { ModalService } from '../../core/services/modal.service';

export interface ScreenRecord {
  id: string;
  reference_no: string;
  name: string;
  category: string;
  amount?: number | null;
  notes?: string;
  is_active: boolean;
  updated_at: string;
}

// In-memory persistent store across route navigations within the session
const SCREEN_RECORDS_STORE: Record<string, ScreenRecord[]> = {};

@Component({
  selector: 'app-module-screen-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzCheckboxModule,
    NzTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    MenuActionDirective,
  ],
  template: `
    <div class="h-[calc(100vh-130px)] flex flex-col space-y-3 w-full">
      <app-page-header
        [title]="currentMenu?.title || 'Screen Module'"
        [subtitle]="currentMenu?.title_bn || 'স্ক্রিন মডিউল'"
        [formId]="currentMenu?.menu_code"
        [breadcrumbs]="[
          { label: 'PMS', url: '/dashboard' },
          { label: currentMenu?.title || 'Module' }
        ]"
      >
        <div filters class="flex items-center gap-2 shrink-0 flex-nowrap">
          <nz-input-group [nzPrefix]="searchIcon" class="w-72 shrink-0 rounded-md">
            <input id="module-screen-view-search-7"
              type="text"
              nz-input
              [placeholder]="'Search ' + (currentMenu?.title || 'records') + '...'"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch($event)" aria-label="Search" />
          </nz-input-group>
          <ng-template #searchIcon>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
          <button nz-button nzType="default" class="rounded-md h-7 px-2.5 text-xs shrink-0" (click)="onResetSearch()">
            <span nz-icon nzType="clear"></span> Reset
          </button>
        </div>
        <div actions class="flex items-center gap-2 shrink-0 flex-nowrap">
          <button nz-button nzType="default" class="rounded-md" (click)="exportRecords()">
            <span nz-icon nzType="download"></span> Export
          </button>
          <button *appMenuAction="currentMenu?.menu_code ? currentMenu!.menu_code + ':create' : null" nz-button nzType="primary" class="rounded-md" (click)="openCreateModal()">
            <span nz-icon nzType="plus"></span> New Record
          </button>
        </div>
      </app-page-header>

      <!-- Records Data Table if items exist -->
      @if (filteredRecords.length > 0) {
        <div class="flex-1 min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs w-full">
          <!-- Table Scroll Area -->
          <div class="flex-1 min-h-0 overflow-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead class="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider shadow-xs">
                <tr>
                  <th class="p-3.5 w-24">Ref #</th>
                  <th class="p-3.5">Record Description / Title</th>
                  <th class="p-3.5 w-36">Category / Type</th>
                  @if (hasAmountColumn) {
                    <th class="p-3.5 text-right w-32">Amount (৳)</th>
                  }
                  <th class="p-3.5 text-center w-28">Status</th>
                  <th class="p-3.5 text-slate-400 w-36">Last Updated</th>
                  <th class="p-3.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of filteredRecords; track item.id) {
                  <tr class="hover:bg-slate-50/75 transition-colors">
                    <td class="p-3.5 font-mono text-xs font-bold text-slate-700">
                      {{ item.reference_no }}
                    </td>
                    <td class="p-3.5">
                      <p class="font-medium text-slate-900 m-0">{{ item.name }}</p>
                      @if (item.notes) {
                        <p class="text-slate-400 m-0 text-xs truncate max-w-md">{{ item.notes }}</p>
                      }
                    </td>
                    <td class="p-3.5 text-xs text-slate-600">
                      <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {{ item.category }}
                      </span>
                    </td>
                    @if (hasAmountColumn) {
                      <td class="p-3.5 text-right font-mono font-semibold text-slate-900">
                        {{ (item.amount || 0) | number: '1.2-2' }}
                      </td>
                    }
                    <td class="p-3.5 text-center">
                      <app-status-badge
                        [text]="item.is_active ? 'Active' : 'Inactive'"
                        [type]="item.is_active ? 'active' : 'inactive'"
                      ></app-status-badge>
                    </td>
                    <td class="p-3.5 text-xs text-slate-500">
                      {{ item.updated_at | date: 'shortDate' }}
                    </td>
                    <td class="p-3.5 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button
                          *appMenuAction="currentMenu?.menu_code ? currentMenu!.menu_code + ':edit' : null"
                          type="button"
                          (click)="openEditModal(item)"
                          nz-tooltip
                          nzTooltipTitle="Edit / Modify Record"
                          class="btn-tbl-action btn-tbl-edit"
                         aria-label="Edit / Modify Record">
                          <span nz-icon nzType="edit"></span>
                        </button>
                        <button
                          *appMenuAction="currentMenu?.menu_code ? currentMenu!.menu_code + ':delete' : null"
                          type="button"
                          (click)="deleteRecord(item)"
                          nz-tooltip
                          nzTooltipTitle="Delete Record"
                          class="btn-tbl-action btn-tbl-delete"
                         aria-label="Delete Record">
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Sticky Bottom Footer -->
          <div class="table-sticky-footer shrink-0 bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
            <div class="flex items-center gap-3">
              <span>Total Records: <strong class="text-slate-900 font-semibold font-mono">{{ filteredRecords.length }}</strong></span>
              @if (hasAmountColumn) {
                <span class="text-slate-300">|</span>
                <span class="font-semibold text-slate-700">Total Valuation: <strong class="theme-total-text font-mono text-sm">৳ {{ totalRecordsAmount | number: '1.2-2' }}</strong></span>
              }
            </div>
            <span class="text-slate-400 font-mono text-[11px]">{{ currentMenu?.menu_code || 'System Entity Register' }}</span>
          </div>
        </div>
      } @else {
        <!-- Empty State with Working Action -->
        <div class="flex-1 min-h-0 flex flex-col justify-center bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <app-empty-state
            [description]="'No records found for ' + (currentMenu?.title || 'this screen') + ' (' + (currentMenu?.menu_code || '') + ')'"
          >
            <div actions class="mt-3">
              <button *appMenuAction="currentMenu?.menu_code ? currentMenu!.menu_code + ':create' : null" nz-button nzType="primary" class="rounded-md" (click)="openCreateModal()">
                <span nz-icon nzType="plus"></span> Create First Entry
              </button>
            </div>
          </app-empty-state>
        </div>
      }
    </div>

    <!-- Unified Dual-Purpose Modal for ADD and MODIFY -->
    <nz-modal
      [(nzVisible)]="isModalVisible"
      [nzTitle]="modalMode === 'create' ? ('New Entry: ' + (currentMenu?.title || 'Record')) : ('Modify Entry: ' + formModel.name)"
      [nzWidth]="640"
      [nzOkText]="modalMode === 'create' ? 'Save Entry' : 'Update Changes'"
      [nzOkLoading]="isSaving"
      (nzOnCancel)="closeModal()"
      (nzOnOk)="saveRecord()"
    >
      <ng-container *nzModalContent>
        <div class="space-y-4 py-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Record Title / Name -->
            <div class="md:col-span-2">
              <label for="module-screen-view-record-name-title-1" class="block text-xs font-semibold text-slate-700 mb-1">
                Record Name / Title <span class="text-rose-500">*</span>
              </label>
              <input id="module-screen-view-record-name-title-1"
                type="text"
                nz-input
                [placeholder]="'e.g. ' + (currentMenu?.title || 'Record') + ' Description'"
                [(ngModel)]="formModel.name"
                class="rounded-md" aria-label="Record Name / Title" />
            </div>

            <!-- Reference / Code -->
            <div>
              <label for="module-screen-view-reference-code-2" class="block text-xs font-semibold text-slate-700 mb-1">
                Reference / Code <span class="text-rose-500">*</span>
              </label>
              <input id="module-screen-view-reference-code-2"
                type="text"
                nz-input
                placeholder="e.g. REF-1001"
                [(ngModel)]="formModel.reference_no"
                class="rounded-md" aria-label="Reference / Code" />
            </div>

            <!-- Category / Classification -->
            <div>
              <label for="module-screen-view-category-classification-3" class="block text-xs font-semibold text-slate-700 mb-1">
                Category / Classification
              </label>
              <div class="flex gap-1.5">
                <nz-select id="module-screen-view-category-classification-3" nzId="module-screen-view-category-classification-3" class="flex-1" [(ngModel)]="formModel.category" aria-label="Category / Classification">
                  @for (c of categoryOptions; track c) {
                    <nz-option [nzValue]="c" [nzLabel]="c"></nz-option>
                  }
                </nz-select>
                <button
                  type="button"
                  (click)="openAddCategoryModal()"
                  nz-tooltip
                  nzTooltipTitle="Quick Add Category"
                  class="btn-quick-add"
                 aria-label="Quick Add Category">
                  <span nz-icon nzType="plus"></span>
                </button>
              </div>
            </div>

            <!-- Amount / Value (shown for financial/accounting/due screens) -->
            @if (hasAmountColumn) {
              <div class="md:col-span-2">
                <label for="module-screen-view-amount-valuation-4" class="block text-xs font-semibold text-slate-700 mb-1">
                  Amount / Valuation (৳)
                </label>
                <nz-input-number id="module-screen-view-amount-valuation-4" nzId="module-screen-view-amount-valuation-4"
                  class="w-full"
                  [nzMin]="0"
                  [nzStep]="10"
                  [(ngModel)]="formModel.amount" aria-label="Amount / Valuation (৳)"></nz-input-number>
              </div>
            }

            <!-- Notes / Remarks -->
            <div class="md:col-span-2">
              <label for="module-screen-view-remarks-notes-5" class="block text-xs font-semibold text-slate-700 mb-1">Remarks / Notes</label>
              <textarea id="module-screen-view-remarks-notes-5"
                nz-input
                rows="3"
                placeholder="Optional notes or administrative details..."
                [(ngModel)]="formModel.notes"
                class="rounded-md" aria-label="Remarks / Notes"></textarea>
            </div>
          </div>

          <!-- Status Checkbox -->
          <div class="flex items-center gap-3 pt-2">
            <label nz-checkbox [(ngModel)]="formModel.is_active" class="text-xs font-medium text-slate-700">
              Status Active
            </label>
          </div>
        </div>
      </ng-container>
    </nz-modal>

    <!-- Quick Add Category Modal -->
    <nz-modal
      [(nzVisible)]="isAddCategoryOpen"
      nzTitle="Quick Add Category / Classification"
      nzOkText="Add Category"
      [nzStyle]="{ top: '40px' }"
      (nzOnCancel)="isAddCategoryOpen = false"
      (nzOnOk)="saveNewCategory()"
      nzWidth="380px"
    >
      <ng-container *nzModalContent>
        <div class="py-1">
          <label for="module-screen-view-category-name-6" class="block text-xs font-semibold text-slate-700 mb-1">
            Category Name <span class="text-rose-500">*</span>
          </label>
          <input id="module-screen-view-category-name-6"
            type="text"
            nz-input
            placeholder="e.g. Special Inventory, Priority"
            [(ngModel)]="newCategoryName"
            class="rounded-md" aria-label="Category Name" />
        </div>
      </ng-container>
    </nz-modal>
  `,
})
export class ModuleScreenViewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);

  private readonly authService = inject(AuthService);

  currentMenu?: SysMenu | null;
  records: ScreenRecord[] = [];
  filteredRecords: ScreenRecord[] = [];

  // Modal State for Add & Modify
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  isSaving = false;

  formModel: ScreenRecord = {
    id: '',
    reference_no: '',
    name: '',
    category: 'General',
    amount: 0,
    notes: '',
    is_active: true,
    updated_at: '',
  };

  categoryOptions = [
    'General',
    'Standard Mode',
    'Operational',
    'Administrative',
    'Clinical Reference',
    'Urgent',
  ];

  isAddCategoryOpen = false;
  newCategoryName = '';

  openAddCategoryModal(): void {
    this.newCategoryName = '';
    this.isAddCategoryOpen = true;
  }

  saveNewCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.msg.error('Please enter category name');
      return;
    }
    if (!this.categoryOptions.includes(name)) {
      this.categoryOptions.push(name);
    }
    this.formModel.category = name;
    this.isAddCategoryOpen = false;
    this.msg.success(`Category "${name}" added!`);
  }

  get hasAmountColumn(): boolean {
    const formId = this.currentMenu?.menu_code || '';
    const code = formId.split('_')[0] || '';
    return ['ACC', 'CASH', 'DUE', 'SALE', 'PUR', 'SUB'].includes(code);
  }

  get totalRecordsAmount(): number {
    return this.filteredRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  }

  constructor() {
    this.currentMenu = this.authService.findMenuByRoute(this.router.url);
  }

  ngOnInit(): void {
    const key = this.currentMenu?.menu_code || this.router.url;
    if (!SCREEN_RECORDS_STORE[key]) {
      SCREEN_RECORDS_STORE[key] = [];
    }
    this.records = SCREEN_RECORDS_STORE[key];
    this.filteredRecords = [...this.records];
  }

  onSearch(query: string): void {
    if (!query) {
      this.filteredRecords = [...this.records];
      return;
    }
    const q = query.toLowerCase();
    this.filteredRecords = this.records.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.reference_no.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }

  searchQuery = '';

  onResetSearch(): void {
    this.searchQuery = '';
    this.filteredRecords = [...this.records];
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    const nextIdx = this.records.length + 1;
    this.formModel = {
      id: crypto.randomUUID(),
      reference_no: `${this.currentMenu?.menu_code || 'REC'}-${String(nextIdx).padStart(3, '0')}`,
      name: '',
      category: 'Standard Mode',
      amount: this.hasAmountColumn ? 0 : undefined,
      notes: '',
      is_active: true,
      updated_at: new Date().toISOString(),
    };
    this.isModalVisible = true;
  }

  openEditModal(record: ScreenRecord): void {
    this.modalMode = 'edit';
    this.formModel = { ...record };
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  saveRecord(): void {
    if (!this.formModel.name.trim()) {
      this.msg.error('Please enter a record name or title.');
      return;
    }

    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      const key = this.currentMenu?.menu_code || this.router.url;

      if (this.modalMode === 'create') {
        const newRecord: ScreenRecord = {
          ...this.formModel,
          id: crypto.randomUUID(),
          updated_at: new Date().toISOString(),
        };
        this.records = [newRecord, ...this.records];
        this.msg.success(`New entry "${newRecord.name}" created successfully!`);
      } else {
        // Modify existing record in-place
        const index = this.records.findIndex(r => r.id === this.formModel.id);
        if (index > -1) {
          this.records[index] = {
            ...this.formModel,
            updated_at: new Date().toISOString(),
          };
          this.msg.success(`Entry "${this.formModel.name}" updated successfully!`);
        }
      }

      SCREEN_RECORDS_STORE[key] = this.records;
      this.filteredRecords = [...this.records];
      this.isModalVisible = false;
    }, 300);
  }

  deleteRecord(record: ScreenRecord): void {
    this.modal
      .confirmDelete(record.name, `Are you sure you want to remove "${record.reference_no}"?`)
      .subscribe(confirmed => {
        if (confirmed) {
          const key = this.currentMenu?.menu_code || this.router.url;
          this.records = this.records.filter(r => r.id !== record.id);
          SCREEN_RECORDS_STORE[key] = this.records;
          this.filteredRecords = [...this.records];
          this.msg.success(`Record "${record.reference_no}" deleted.`);
        }
      });
  }

  exportRecords(): void {
    this.msg.info(`Exporting ${this.filteredRecords.length} records for ${this.currentMenu?.menu_code}...`);
  }
}

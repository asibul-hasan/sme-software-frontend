import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ProdCompany, ProdProduct, LowStockProduct } from '../../core/models/product.models';
import { SuppSupplier } from '../../core/models/supplier.models';

export interface RequisitionItemRow {
  product_no: number;
  product_name: string;
  generic_name: string;
  company_name: string;
  company_no?: number | null;
  current_stock_pcs: number;
  min_stock_qty_pcs: number;
  shortfall_pcs: number;
  quantity_in_box: number;
  box_qty: number;
  unit_cost: number;
  vat_percent: number;
  sale_qty_6mth_pcs: number;
  is_from_low_stock?: boolean;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzModalModule,
    NzInputNumberModule,
    NzIconModule,
    NzTooltipModule,
    NzBadgeModule,
    NzTagModule,
    NzCheckboxModule,
    NzSpinModule,
    PageHeaderComponent,
  ],
  templateUrl: './requisition-list.component.html',
})
export class RequisitionListComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInputEl?: ElementRef<HTMLInputElement>;
  private readonly searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Master State
  loadedRequisitionNo = signal<number | null>(null);
  loadedRequisitionStatus = signal<string>('Draft');
  isApproving = signal<boolean>(false);
  savedRequisitionCode = signal<string | null>(null);
  lastSavedCost = signal<number>(0);
  requisitionDate: Date = new Date();
  selectedSupplierNo: number | null = null;
  selectedCompanyNo: number | null = null;
  remarks = '';

  isApproved = computed(() => (this.loadedRequisitionStatus() || '').trim().toLowerCase() === 'approved');
  isFulfilled = computed(() => (this.loadedRequisitionStatus() || '').trim().toLowerCase() === 'fulfilled');
  isLocked = computed(() => this.isApproved() || this.isFulfilled());

  // Data lookups
  suppliers = signal<SuppSupplier[]>([]);
  companies = signal<ProdCompany[]>([]);

  // Detail Items State
  items = signal<RequisitionItemRow[]>([]);
  tableFilter = '';

  // Loading States
  isLoadingLowStock = signal(false);
  isSaving = signal(false);

  // Product Selector Modal State (Multi-Choice & Live Search)
  isProductSelectorVisible = false;
  productSearchQuery = '';
  catalogProducts = signal<ProdProduct[]>([]);
  allProducts: ProdProduct[] = [];
  isSearchingCatalog = signal(false);
  selectedProductNos = signal<Set<number>>(new Set());
  selectedProductsMap = new Map<number, ProdProduct>();

  // Success Modal
  isSuccessModalVisible = false;

  // Filtered Detail Items
  displayedItems = computed(() => {
    const q = this.tableFilter.trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter(
      i =>
        i.product_name.toLowerCase().includes(q) ||
        i.generic_name.toLowerCase().includes(q) ||
        i.company_name.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  totalBoxes = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.box_qty || 0), 0);
  });

  totalPieces = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.box_qty || 0) * (item.quantity_in_box || 1), 0);
  });

  grandTotal = computed(() => {
    return this.items().reduce((sum, item) => sum + this.calculateLineTotal(item), 0);
  });

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadCompanies();
    this.loadCatalogProducts();

    this.searchSub = this.searchSubject
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(query => {
        this.executeCatalogSearch(query);
      });

    this.route.queryParams.subscribe(params => {
      const reqNo = params['requisitionNo'];
      if (reqNo) {
        this.loadRequisitionForEdit(Number(reqNo));
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onLineItemChange(): void {
    if (this.isLocked()) return;
    this.items.update(list => [...list]);
  }

  // Keyboard Shortcuts (F2: Add Item, F8: Save Requisition)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      if (!this.isLocked()) {
        this.openProductSelector();
      }
    } else if (event.key === 'F8') {
      event.preventDefault();
      if (!this.isLocked() && !this.isSaving() && this.items().length > 0) {
        this.saveRequisition();
      }
    }
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers({ pageSize: 100 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.suppliers.set([...(res.data.items || [])]);
        }
      },
    });
  }

  loadCompanies(): void {
    this.productService.getCompanies().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.companies.set(res.data || []);
        }
      },
    });
  }

  loadCatalogProducts(): void {
    this.productService.getProducts({ pageSize: 100 }).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.allProducts = [...(res.data.items || [])];
          this.catalogProducts.set(this.allProducts);
          // If items already loaded from requisition, enrich any missing details
          if (this.items().length > 0) {
            this.items.update(list =>
              list.map(item => {
                const prod = this.allProducts.find(p => p.product_no === item.product_no);
                if (!prod) return item;
                return {
                  ...item,
                  product_name: item.product_name && !item.product_name.startsWith('Product #') ? item.product_name : prod.product_name,
                  generic_name: item.generic_name !== 'General' ? item.generic_name : (prod.generic_name || 'General'),
                  company_name: item.company_name !== 'Pharmaceuticals Ltd.' ? item.company_name : (prod.company_name || 'Pharmaceuticals Ltd.'),
                  current_stock_pcs: prod.stock_qty ?? item.current_stock_pcs,
                  min_stock_qty_pcs: prod.min_stock_qty_pcs ?? item.min_stock_qty_pcs,
                  shortfall_pcs: Math.max(0, (prod.min_stock_qty_pcs ?? item.min_stock_qty_pcs) - (prod.stock_qty ?? 0)),
                };
              })
            );
          }
        }
      },
    });
  }

  onCompanyFilterChange(): void {
    if (this.isProductSelectorVisible) {
      this.executeCatalogSearch(this.productSearchQuery);
    } else if (this.selectedCompanyNo) {
      const filtered = this.allProducts.filter(p => p.company_no === this.selectedCompanyNo);
      this.catalogProducts.set(filtered);
    } else {
      this.catalogProducts.set(this.allProducts);
    }
  }

  // Master Action: Populate Low Stock Items
  populateLowStock(): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is ${this.loadedRequisitionStatus().toLowerCase()} and locked. Low-stock items cannot be added.`);
      return;
    }
    this.isLoadingLowStock.set(true);
    const companyFilter = this.selectedCompanyNo || undefined;

    this.productService.getLowStockProducts(companyFilter, true).subscribe({
      next: res => {
        this.isLoadingLowStock.set(false);
        if (res.success && res.data && res.data.length > 0) {
          const incoming: LowStockProduct[] = res.data;
          let addedCount = 0;
          let updatedCount = 0;

          this.items.update(current => {
            const list = [...current];
            for (const p of incoming) {
              const existingIdx = list.findIndex(i => i.product_no === p.product_no);
              const boxQty = p.suggested_box_qty > 0 ? p.suggested_box_qty : 1;
              const unitCost = p.purchase_price_per_piece > 0 ? p.purchase_price_per_piece : (p.cost_per_box / (p.quantity_per_box || 1));

              if (existingIdx >= 0) {
                // Keep the max box qty
                list[existingIdx].box_qty = Math.max(list[existingIdx].box_qty, boxQty);
                list[existingIdx].current_stock_pcs = p.current_stock_pcs;
                list[existingIdx].min_stock_qty_pcs = p.min_stock_qty_pcs;
                list[existingIdx].shortfall_pcs = p.shortfall_pcs;
                list[existingIdx].is_from_low_stock = true;
                updatedCount++;
              } else {
                list.push({
                  product_no: p.product_no,
                  product_name: p.product_name,
                  generic_name: p.generic_name,
                  company_name: p.company_name,
                  company_no: p.company_no || undefined,
                  current_stock_pcs: p.current_stock_pcs,
                  min_stock_qty_pcs: p.min_stock_qty_pcs,
                  shortfall_pcs: p.shortfall_pcs,
                  quantity_in_box: p.quantity_per_box || 1,
                  box_qty: boxQty,
                  unit_cost: unitCost,
                  vat_percent: p.vat_percent || 0,
                  sale_qty_6mth_pcs: p.sale_qty_6mth_pcs || 0,
                  is_from_low_stock: true,
                });
                addedCount++;
              }
            }
            return list;
          });

          this.msg.success(
            `Populated ${addedCount} items into requisition plan (${updatedCount} updated).`
          );
        } else {
          this.msg.info('No low-stock products found for the selected criteria.');
        }
      },
      error: err => {
        this.isLoadingLowStock.set(false);
        this.msg.error(err?.error?.message || 'Failed to fetch low stock items');
      },
    });
  }

  // Detail Item Management & Product Catalog Selector (F2)
  openProductSelector(): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is ${this.loadedRequisitionStatus().toLowerCase()} and locked. Items cannot be added.`);
      return;
    }
    this.productSearchQuery = '';
    this.clearSelection();
    this.isProductSelectorVisible = true;
    this.executeCatalogSearch('');

    // Auto-focus search bar when popup opens
    setTimeout(() => {
      this.searchInputEl?.nativeElement?.focus();
      this.searchInputEl?.nativeElement?.select();
    }, 80);
  }

  onSearchInputChange(val: string): void {
    this.searchSubject.next(val);
  }

  executeCatalogSearch(query: string): void {
    this.isSearchingCatalog.set(true);
    const params: Record<string, unknown> = {
      pageSize: 50,
    };
    const trimmed = query.trim();
    if (trimmed) {
      params['search'] = trimmed;
    }
    if (this.selectedCompanyNo) {
      params['companyNo'] = this.selectedCompanyNo;
    }

    this.productService.getProducts(params).subscribe({
      next: res => {
        this.isSearchingCatalog.set(false);
        if (res.success && res.data) {
          const prods: ProdProduct[] = Array.isArray(res.data) ? [...res.data] : [...(res.data.items || [])];
          this.catalogProducts.set(prods);
        } else {
          this.catalogProducts.set([]);
        }
      },
      error: () => {
        this.isSearchingCatalog.set(false);
        this.catalogProducts.set([]);
      },
    });
  }

  // Multi-choice state helpers
  isProductSelected(productNo: number): boolean {
    return this.selectedProductNos().has(productNo);
  }

  toggleProductSelection(p: ProdProduct): void {
    const nextSet = new Set(this.selectedProductNos());
    if (nextSet.has(p.product_no)) {
      nextSet.delete(p.product_no);
      this.selectedProductsMap.delete(p.product_no);
    } else {
      nextSet.add(p.product_no);
      this.selectedProductsMap.set(p.product_no, p);
    }
    this.selectedProductNos.set(nextSet);
  }

  isAllFilteredSelected(): boolean {
    const prods = this.catalogProducts();
    if (prods.length === 0) return false;
    const set = this.selectedProductNos();
    return prods.every(p => set.has(p.product_no));
  }

  toggleSelectAllFiltered(): void {
    const prods = this.catalogProducts();
    const nextSet = new Set(this.selectedProductNos());
    if (this.isAllFilteredSelected()) {
      for (const p of prods) {
        nextSet.delete(p.product_no);
        this.selectedProductsMap.delete(p.product_no);
      }
    } else {
      for (const p of prods) {
        nextSet.add(p.product_no);
        this.selectedProductsMap.set(p.product_no, p);
      }
    }
    this.selectedProductNos.set(nextSet);
  }

  clearSelection(): void {
    this.selectedProductNos.set(new Set());
    this.selectedProductsMap.clear();
  }

  populateSelectedProducts(): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is ${this.loadedRequisitionStatus().toLowerCase()} and locked. Items cannot be added.`);
      return;
    }
    const selected = Array.from(this.selectedProductsMap.values());
    if (selected.length === 0) {
      this.msg.warning('Please select at least one medicine to populate.');
      return;
    }

    let addedCount = 0;
    let incrementedCount = 0;

    this.items.update(current => {
      const list = [...current];
      for (const p of selected) {
        const existingIdx = list.findIndex(i => i.product_no === p.product_no);
        const qtyInBox = p.quantity_per_box || 1;
        const unitCost = p.purchase_price_per_piece || (p.cost_per_box ? p.cost_per_box / qtyInBox : 0);
        const minQty = p.min_stock_qty_pcs || 10;
        const curStock = p.stock_qty || 0;
        const shortfall = Math.max(0, minQty - curStock);

        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            box_qty: list[existingIdx].box_qty + 1,
          };
          incrementedCount++;
        } else {
          list.unshift({
            product_no: p.product_no,
            product_name: p.product_name,
            generic_name: p.generic_name || 'General',
            company_name: p.company_name || 'Pharmaceuticals Ltd.',
            company_no: p.company_no,
            current_stock_pcs: curStock,
            min_stock_qty_pcs: minQty,
            shortfall_pcs: shortfall,
            quantity_in_box: qtyInBox,
            box_qty: 1,
            unit_cost: unitCost,
            vat_percent: 0,
            sale_qty_6mth_pcs: 0,
            is_from_low_stock: false,
          });
          addedCount++;
        }
      }
      return list;
    });

    this.clearSelection();
    this.isProductSelectorVisible = false;
    this.msg.success(
      `Populated ${addedCount} medicines into requisition plan (${incrementedCount} incremented).`
    );
  }

  getItemBoxQtyInPlan(productNo: number): number {
    const item = this.items().find(i => i.product_no === productNo);
    return item ? item.box_qty : 0;
  }

  addProductToRequisition(p: ProdProduct, event?: MouseEvent): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is ${this.loadedRequisitionStatus().toLowerCase()} and locked. Items cannot be added.`);
      return;
    }
    if (event) {
      event.stopPropagation();
    }
    const existing = this.items().find(i => i.product_no === p.product_no);
    const qtyInBox = p.quantity_per_box || 1;
    const unitCost = p.purchase_price_per_piece || (p.cost_per_box ? p.cost_per_box / qtyInBox : 0);

    if (existing) {
      this.items.update(list =>
        list.map(i => (i.product_no === p.product_no ? { ...i, box_qty: i.box_qty + 1 } : i))
      );
      this.msg.success(`Incremented box quantity for ${p.product_name}`);
    } else {
      const newLine: RequisitionItemRow = {
        product_no: p.product_no,
        product_name: p.product_name,
        generic_name: p.generic_name || 'General',
        company_name: p.company_name || 'Pharmaceuticals Ltd.',
        company_no: p.company_no,
        current_stock_pcs: p.stock_qty || 0,
        min_stock_qty_pcs: p.min_stock_qty_pcs || 10,
        shortfall_pcs: Math.max(0, (p.min_stock_qty_pcs || 10) - (p.stock_qty || 0)),
        quantity_in_box: qtyInBox,
        box_qty: 1,
        unit_cost: unitCost,
        vat_percent: 0,
        sale_qty_6mth_pcs: 0,
        is_from_low_stock: false,
      };
      this.items.update(list => [newLine, ...list]);
      this.msg.success(`Added ${p.product_name} to requisition`);
    }
  }

  removeItem(item: RequisitionItemRow): void {
    if (this.isLocked()) {
      this.msg.warning(`${this.loadedRequisitionStatus()} requisition items cannot be deleted.`);
      return;
    }
    this.items.update(list => list.filter(i => i.product_no !== item.product_no));
    this.msg.info(`Removed ${item.product_name} from plan.`);
  }

  clearAllItems(): void {
    if (this.isLocked()) {
      this.msg.warning(`${this.loadedRequisitionStatus()} requisition items cannot be deleted.`);
      return;
    }
    this.modal
      .confirmDelete('All Requisition Items', 'Are you sure you want to clear all items from the current requisition draft?')
      .subscribe(confirmed => {
        if (confirmed) {
          this.items.set([]);
          this.msg.info('Requisition items cleared.');
        }
      });
  }

  calculateLineTotal(item: RequisitionItemRow): number {
    const totalPcs = (item.box_qty || 0) * (item.quantity_in_box || 1);
    const unitPriceWithVat = (item.unit_cost || 0) * (1 + (item.vat_percent || 0) / 100);
    return Math.round(totalPcs * unitPriceWithVat * 100) / 100;
  }

  // Load Existing Requisition for Edit
  loadRequisitionForEdit(reqNo: number): void {
    this.productService.getRequisitionById(reqNo).subscribe({
      next: res => {
        if (res.success && res.data) {
          const req = res.data;
          this.loadedRequisitionNo.set(req.requisition_no);
          this.savedRequisitionCode.set(req.requisition_code || `REQ-${req.requisition_no}`);
          this.loadedRequisitionStatus.set(req.status || 'Pending');
          this.selectedSupplierNo = req.supplier_no || null;
          this.selectedCompanyNo = req.company_no || null;
          this.requisitionDate = req.created_at ? new Date(req.created_at) : new Date();

          const mappedRows: RequisitionItemRow[] = (req.items || []).map(item => {
            const prod = this.allProducts.find(p => p.product_no === item.product_no);
            const qtyInBox = item.quantity_in_box || prod?.quantity_per_box || 1;
            const boxQty = item.box_qty || 1;
            const minQtyPcs = item.min_qty_pcs ?? prod?.min_stock_qty_pcs ?? 10;
            const currentStock = prod?.stock_qty ?? 0;
            const shortfall = Math.max(0, minQtyPcs - currentStock);
            const unitCost = item.btp || prod?.purchase_price_per_piece || 0;
            const vatPercent = item.vat || 0;

            return {
              product_no: item.product_no,
              product_name: item.product_name || prod?.product_name || `Product #${item.product_no}`,
              generic_name: prod?.generic_name || 'General',
              company_name: prod?.company_name || req.company_name || 'Pharmaceuticals Ltd.',
              company_no: prod?.company_no ?? req.company_no ?? null,
              current_stock_pcs: currentStock,
              min_stock_qty_pcs: minQtyPcs,
              shortfall_pcs: shortfall,
              quantity_in_box: qtyInBox,
              box_qty: boxQty,
              unit_cost: unitCost,
              vat_percent: vatPercent,
              sale_qty_6mth_pcs: item.sale_qty_6mth_pcs || 0,
              is_from_low_stock: false,
            };
          });

          this.items.set(mappedRows);
          this.msg.info(`Loaded requisition ${this.savedRequisitionCode()}${this.isLocked() ? ' (view only).' : ' for editing.'}`);
        } else {
          this.msg.error(res.message || 'Failed to load requisition');
        }
      },
      error: err => {
        this.msg.error(err?.error?.message || 'Failed to load requisition');
      },
    });
  }

  // Master Action: Approve Current Requisition
  approveCurrentRequisition(): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is already ${this.loadedRequisitionStatus().toLowerCase()}.`);
      return;
    }
    const reqNo = this.loadedRequisitionNo();
    const reqCode = this.savedRequisitionCode() || `REQ-${reqNo}`;
    if (!reqNo) return;

    this.modal
      .confirmAction(
        `Approve Requisition ${reqCode}?`,
        'Approving this requisition confirms procurement of these inventory items.',
        'Approve Requisition',
        false
      )
      .subscribe(confirmed => {
        if (confirmed) {
          this.isApproving.set(true);
          this.productService.updateRequisitionStatus(reqNo, 'Approved').subscribe({
            next: res => {
              this.isApproving.set(false);
              if (res.success) {
                this.loadedRequisitionStatus.set('Approved');
                this.msg.success(`Requisition ${reqCode} has been approved successfully!`);
              } else {
                this.msg.error(res.message || 'Failed to approve requisition.');
              }
            },
            error: err => {
              this.isApproving.set(false);
              this.msg.error(err?.error?.message || 'Failed to approve requisition.');
            },
          });
        }
      });
  }

  // Final Save to Backend (Create or Update)
  saveRequisition(): void {
    if (this.isLocked()) {
      this.msg.warning(`This requisition is ${this.loadedRequisitionStatus().toLowerCase()} and locked from editing.`);
      return;
    }

    if (this.items().length === 0) {
      this.msg.warning('Please add at least one product item to create a requisition.');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      company_no: this.selectedCompanyNo,
      supplier_no: this.selectedSupplierNo,
      status: this.loadedRequisitionNo() ? this.loadedRequisitionStatus() : 'Pending',
      remarks: this.remarks.trim() || undefined,
      items: this.items().map(i => {
        const boxQty = i.box_qty || 1;
        const qtyInBox = i.quantity_in_box || 1;
        const pcs = boxQty * qtyInBox;
        const btp = i.unit_cost || 0;
        const vat = i.vat_percent || 0;
        const btpVat = btp * (1 + vat / 100);
        const totalPrice = Math.round(pcs * btpVat * 100) / 100;

        return {
          product_no: i.product_no,
          box_qty: boxQty,
          requested_box_qty: boxQty,
          quantity_in_box: qtyInBox,
          min_qty_pcs: i.min_stock_qty_pcs,
          requested_pcs_qty: pcs,
          sale_qty_6mth_pcs: i.sale_qty_6mth_pcs || 0,
          btp: btp,
          estimated_unit_cost: btp,
          vat: vat,
          vat_percent: vat,
          btp_vat: btpVat,
          total_price: totalPrice,
          is_selected: true,
          remarks: this.remarks.trim() || `${i.product_name} requisition`,
        };
      }),
    };

    const reqNo = this.loadedRequisitionNo();
    if (reqNo) {
      this.productService.updateRequisition(reqNo, payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.success && res.data) {
            const code = res.data.requisition_code || this.savedRequisitionCode() || `REQ-${reqNo}`;
            this.savedRequisitionCode.set(code);
            this.lastSavedCost.set(this.grandTotal());
            this.isSuccessModalVisible = true;
            this.msg.success(`Requisition ${code} updated successfully!`);
          } else {
            this.msg.error(res.message || 'Failed to update requisition');
          }
        },
        error: err => {
          this.isSaving.set(false);
          this.msg.error(err?.error?.message || 'Failed to update requisition');
        },
      });
    } else {
      this.productService.createRequisition(payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.success && res.data) {
            const reqCode = res.data.requisition_code;
            this.savedRequisitionCode.set(reqCode);
            this.lastSavedCost.set(this.grandTotal());
            this.isSuccessModalVisible = true;
            this.msg.success(`Requisition ${reqCode} generated successfully!`);
          } else {
            this.msg.error(res.message || 'Failed to save requisition');
          }
        },
        error: err => {
          this.isSaving.set(false);
          this.msg.error(err?.error?.message || 'Failed to save requisition');
        },
      });
    }
  }

  startNewRequisition(): void {
    this.isSuccessModalVisible = false;
    this.loadedRequisitionNo.set(null);
    this.savedRequisitionCode.set(null);
    this.loadedRequisitionStatus.set('Draft');
    this.remarks = '';
    this.items.set([]);
    this.selectedSupplierNo = null;
    this.selectedCompanyNo = null;
    this.requisitionDate = new Date();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.msg.info('Ready for new requisition order.');
  }
}

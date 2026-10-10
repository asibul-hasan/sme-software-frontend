import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import {
  MEDICINE_TYPE_OPTIONS,
  UNIT_TYPE_OPTIONS,
  getOptionLabel,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
  DEFAULT_RAKS,
} from '../../shared/constants/label-values.constant';
import { ProdProduct, ProdCompany, ProdGeneric, ProdProductBatch } from '../../core/models';
import { ModalService } from '../../core/services/modal.service';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/auth/auth.service';

export type ProductRow = ProdProduct & {
  generic_name: string;
  company_name: string;
  medicine_type_label?: string;
  unit_type_label?: string;
};

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
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
    DataTableComponent,
  ],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent implements OnInit, OnDestroy {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly productService = inject(ProductService);
  readonly authService = inject(AuthService);

  private searchSubject = new Subject<void>();
  private searchSub?: Subscription;

  @ViewChild('slTpl', { static: true }) slTpl!: TemplateRef<{ $implicit: ProductRow; index: number; sl?: number }>;
  @ViewChild('medNameTpl', { static: true }) medNameTpl!: TemplateRef<{ $implicit: ProductRow }>;
  @ViewChild('actionTpl', { static: true }) actionTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('avgPurchaseTpl', { static: true }) avgPurchaseTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('purchaseTpl', { static: true }) purchaseTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('salePriceTpl', { static: true }) salePriceTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('rakTpl', { static: true }) rakTpl!: TemplateRef<{ $implicit: ProductRow; index: number }>;
  @ViewChild('stockTpl', { static: true }) stockTpl!: TemplateRef<{ $implicit: ProductRow }>;

  medicineTypes = [...MEDICINE_TYPE_OPTIONS];
  unitTypes = [...UNIT_TYPE_OPTIONS];

  isAddGenericModalVisible = false;
  newGenericName = '';

  isAddMedicineTypeModalVisible = false;
  newMedicineTypeName = '';

  isAddUnitTypeModalVisible = false;
  newUnitTypeName = '';

  isAddRakModalVisible = false;
  newRakLocation = '';

  // View Details Modal State
  selectedProductDetails: ProductRow | null = null;
  productBatches: ProdProductBatch[] = [];
  isLoadingBatches = false;
  isViewDetailsModalVisible = false;

  // Stock Adjustment Modal State
  adjustProductItem: ProductRow | null = null;
  adjustTargetStock = 0;
  adjustReason = 'Physical Stock Audit';
  adjustRemarks = '';
  isAdjustStockModalVisible = false;
  isAdjustingStock = false;

  products: ProductRow[] = [];

  filteredProducts: ProductRow[] = [];
  columns: TableColumn<ProductRow>[] = [];

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  isSaving = false;

  companyFilter = 'All';
  searchQuery = '';
  selectedType: number | null = null;
  isAddCompanyModalVisible = false;
  newCompanyName = '';

  companies: string[] = [...DEFAULT_COMPANIES];
  generics: string[] = [...DEFAULT_GENERICS];
  raks: string[] = [...DEFAULT_RAKS];
  companiesList: ProdCompany[] = [];
  genericsList: ProdGeneric[] = [];
  isLoading = false;

  formModel = {
    product_no: 0,
    product_name: '',
    strength: '',
    volume: '',
    generic_name: '',
    company_name: '',
    medicine_type: 1,
    unit_type: 2,
    quantity_per_box: 10,
    cost_per_box: 0,
    sale_price_per_box: 0,
    sale_price_per_piece: 0,
    rak_number: '',
    min_stock_qty_pcs: 50,
    barcode_value: '',
    is_medicine: true,
    stock_qty: 0,
  };

  ngOnInit(): void {
    this.columns = [
      {
        title: 'SL',
        width: '56px',
        align: 'center',
        left: true,
        template: this.slTpl,
      },
      {
        title: 'Medicine Name',
        key: 'product_name',
        width: '230px',
        left: true,
        sortable: true,
        template: this.medNameTpl,
      },
      {
        title: 'Generic Formulation',
        key: 'generic_name',
        width: '180px',
      },
      {
        title: 'Manufacturer',
        key: 'company_name',
        width: '180px',
      },
      {
        title: 'Form',
        key: 'medicine_type_label',
        width: '95px',
      },
      {
        title: 'Unit',
        key: 'unit_type_label',
        width: '85px',
      },
      ...(this.authService.canViewCostPrice()
        ? [
            {
              title: 'Avg. Purchase',
              key: 'avg_purchase_price_per_piece',
              align: 'right' as const,
              width: '120px',
              template: this.avgPurchaseTpl,
            },
            {
              title: 'Purchase',
              key: 'purchase_price_per_piece',
              align: 'right' as const,
              width: '110px',
              template: this.purchaseTpl,
            },
          ]
        : []),
      {
        title: 'Sale Price',
        key: 'sale_price_per_piece',
        align: 'right',
        width: '120px',
        right: true,
        template: this.salePriceTpl,
      },
      {
        title: 'Rak #',
        key: 'rak_number',
        align: 'center',
        width: '90px',
        right: true,
        template: this.rakTpl,
      },
      {
        title: 'In Stock',
        key: 'stock_qty',
        align: 'right',
        width: '125px',
        sortable: true,
        right: true,
        template: this.stockTpl,
      },
      {
        title: 'Actions',
        template: this.actionTpl,
        width: '150px',
        align: 'center',
        right: true,
      },
    ];

    this.searchSub = this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.loadProductsFromService();
    });

    this.loadDropdownData();
    this.loadProductsFromService();
  }

  loadDropdownData(): void {
    this.productService.getCompanies({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = res.data;
          const names = res.data.map(c => c.name).filter(Boolean);
          this.companies = Array.from(new Set([...names, ...DEFAULT_COMPANIES]));
        }
      },
    });

    this.productService.getGenerics({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = res.data;
          const names = res.data.map(g => g.name).filter(Boolean);
          this.generics = Array.from(new Set([...names, ...DEFAULT_GENERICS]));
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  downloadStock(): void {
    if (!this.filteredProducts.length) {
      this.msg.warning('No products available to download.');
      return;
    }
    const canCost = this.authService.canViewCostPrice();
    const headers = canCost
      ? ['Product Name', 'Generic', 'Manufacturer', 'Type', 'Strength', 'Shelf/Rak', 'Stock (pcs)', 'Cost/Box', 'Sale/Box', 'Retail Price/Pc (৳)', 'Stock Value (৳)']
      : ['Product Name', 'Generic', 'Manufacturer', 'Type', 'Strength', 'Shelf/Rak', 'Stock (pcs)', 'Sale/Box', 'Retail Price/Pc (৳)'];

    const rows = this.filteredProducts.map(p => {
      const base = [
        `"${(p.product_name || '').replace(/"/g, '""')}"`,
        `"${(p.generic_name || '').replace(/"/g, '""')}"`,
        `"${(p.company_name || '').replace(/"/g, '""')}"`,
        `"${p.medicine_type_label || ''}"`,
        `"${p.strength || ''}"`,
        `"${p.rak_number || ''}"`,
        p.stock_qty || 0,
      ];
      if (canCost) {
        return [
          ...base,
          p.cost_per_box || 0,
          p.sale_price_per_box || 0,
          p.sale_price_per_piece || 0,
          ((p.stock_qty || 0) * (p.purchase_price_per_piece || 0)).toFixed(2)
        ];
      } else {
        return [
          ...base,
          p.sale_price_per_box || 0,
          p.sale_price_per_piece || 0,
        ];
      }
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmacy_stock_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.msg.success(`Downloaded stock inventory (${this.filteredProducts.length} items)`);
  }

  openAddCompanyModal(): void {
    this.newCompanyName = '';
    this.isAddCompanyModalVisible = true;
  }

  saveNewCompany(): void {
    const val = this.newCompanyName.trim();
    if (!val) {
      this.msg.error('Company Name is required');
      return;
    }
    this.productService.createCompany({ name: val }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = [...this.companiesList, res.data];
          if (!this.companies.includes(val)) {
            this.companies = [...this.companies, val];
          }
          this.formModel.company_name = val;
          this.msg.success(`Company ${val} added successfully`);
          this.isAddCompanyModalVisible = false;
        } else {
          this.msg.error(res.message || 'Failed to add company');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add company'),
    });
  }

  saveNewGeneric(): void {
    const val = this.newGenericName.trim();
    if (!val) {
      this.msg.error('Generic name is required');
      return;
    }
    this.productService.createGeneric({ name: val }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = [...this.genericsList, res.data];
          if (!this.generics.includes(val)) {
            this.generics = [...this.generics, val];
          }
          this.formModel.generic_name = val;
          this.msg.success(`Generic "${val}" set!`);
          this.isAddGenericModalVisible = false;
        } else {
          this.msg.error(res.message || 'Failed to add generic');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add generic'),
    });
  }

  saveNewMedicineType(): void {
    const val = this.newMedicineTypeName.trim();
    if (!val) {
      this.msg.error('Medicine type is required');
      return;
    }
    const nextVal = Math.max(...this.medicineTypes.map(m => m.value), 0) + 1;
    this.medicineTypes.push({ value: nextVal, label: val });
    this.formModel.medicine_type = nextVal;
    this.isAddMedicineTypeModalVisible = false;
    this.msg.success(`Medicine form "${val}" added!`);
  }

  saveNewUnitType(): void {
    const val = this.newUnitTypeName.trim();
    if (!val) {
      this.msg.error('Unit type is required');
      return;
    }
    const nextVal = Math.max(...this.unitTypes.map(u => u.value), 0) + 1;
    this.unitTypes.push({ value: nextVal, label: val });
    this.formModel.unit_type = nextVal;
    this.isAddUnitTypeModalVisible = false;
    this.msg.success(`Unit type "${val}" added!`);
  }

  saveNewRak(): void {
    const val = this.newRakLocation.trim();
    if (!val) {
      this.msg.error('Shelf / Rak is required');
      return;
    }
    if (!this.raks.includes(val)) {
      this.raks = [...this.raks, val];
    }
    this.formModel.rak_number = val;
    this.isAddRakModalVisible = false;
    this.msg.success(`Rak "${val}" set!`);
  }

  viewDetails(item: ProductRow): void {
    this.selectedProductDetails = item;
    this.isViewDetailsModalVisible = true;
    this.isLoadingBatches = true;
    this.productBatches = [];
    this.productService.getProductBatches(item.product_no).subscribe({
      next: (res) => {
        this.isLoadingBatches = false;
        if (res.success && res.data) {
          this.productBatches = res.data;
        }
      },
      error: () => {
        this.isLoadingBatches = false;
      }
    });
  }

  adjustStock(item: ProductRow): void {
    this.adjustProductItem = item;
    this.adjustTargetStock = item.stock_qty || 0;
    this.adjustReason = 'Physical Stock Audit';
    this.adjustRemarks = '';
    this.isAdjustStockModalVisible = true;
  }

  saveStockAdjustment(): void {
    if (!this.adjustProductItem) return;
    if (this.adjustTargetStock < 0) {
      this.msg.error('Target stock cannot be negative');
      return;
    }
    this.isAdjustingStock = true;
    this.productService.adjustProductStock(this.adjustProductItem.product_no, {
      target_stock_pcs: this.adjustTargetStock,
      reason: this.adjustReason,
      remarks: this.adjustRemarks
    }).subscribe({
      next: (res) => {
        this.isAdjustingStock = false;
        if (res.success) {
          this.adjustProductItem!.stock_qty = this.adjustTargetStock;
          this.applyFilters();
          this.msg.success(`Stock for "${this.adjustProductItem!.product_name}" updated to ${this.adjustTargetStock} pcs!`);
          this.isAdjustStockModalVisible = false;
        } else {
          this.msg.error(res.message || 'Failed to adjust stock');
        }
      },
      error: (err) => {
        this.isAdjustingStock = false;
        this.msg.error(err?.error?.message || 'Failed to adjust stock');
      }
    });
  }

  refreshTable(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const company = this.companyFilter;
    const type = this.selectedType;

    this.filteredProducts = this.products
      .filter(p => {
        const matchesQuery =
          !q ||
          p.product_name.toLowerCase().includes(q) ||
          p.generic_name.toLowerCase().includes(q);
        const matchesCompany =
          !company ||
          company === 'All' ||
          p.company_name.toLowerCase().includes(company.toLowerCase());
        const matchesType = type === null || p.medicine_type === type;
        return matchesQuery && matchesCompany && matchesType;
      })
      .map(p => ({
        ...p,
        medicine_type_label: getOptionLabel(MEDICINE_TYPE_OPTIONS, p.medicine_type),
        unit_type_label: getOptionLabel(UNIT_TYPE_OPTIONS, p.unit_type),
      }));
  }

  onSearchChange(): void {
    this.searchSubject.next();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next();
  }

  onCompanyFilter(company: string): void {
    this.companyFilter = company;
    this.applyFilters();
    this.loadProductsFromService();
  }

  onTypeFilter(typeVal: number | null): void {
    this.selectedType = typeVal;
    this.applyFilters();
    this.loadProductsFromService();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.companyFilter = 'All';
    this.selectedType = null;
    this.applyFilters();
    this.loadProductsFromService();
  }

  loadProductsFromService(): void {
    this.isLoading = true;
    const params: Record<string, unknown> = { pageSize: 200 };
    if (this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }
    if (this.companyFilter && this.companyFilter !== 'All') {
      params['company'] = this.companyFilter;
    }
    if (this.selectedType !== null) {
      params['type'] = this.selectedType;
    }
    this.productService.getProducts(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.products = (res.data.items || []).map((p: any) => ({
            ...p,
            generic_name: p.generic_name || 'Generic Formulation',
            company_name: p.company_name || 'Pharmaceuticals Ltd.',
            medicine_type_label: getOptionLabel(MEDICINE_TYPE_OPTIONS, p.medicine_type),
            unit_type_label: getOptionLabel(UNIT_TYPE_OPTIONS, p.unit_type),
          }));
          this.applyFilters();
        }
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get totalStockQty(): number {
    return this.filteredProducts.reduce((sum, p) => sum + (p.stock_qty || 0), 0);
  }

  get totalPurchaseValuation(): number {
    return this.filteredProducts.reduce(
      (sum, p) => sum + (p.stock_qty || 0) * (p.avg_purchase_price_per_piece || p.purchase_price_per_piece || 0),
      0
    );
  }

  get totalSaleValuation(): number {
    return this.filteredProducts.reduce(
      (sum, p) => sum + (p.stock_qty || 0) * (p.sale_price_per_piece || 0),
      0
    );
  }

  openAddMedicineModal(): void {
    this.modalMode = 'create';
    this.formModel = {
      product_no: 0,
      product_name: '',
      strength: '',
      volume: '',
      generic_name: this.generics[0] || 'Paracetamol',
      company_name: this.companies[0] || 'Beximco Pharmaceuticals Ltd.',
      medicine_type: 1, // Tablet
      unit_type: 2,     // STRIP
      quantity_per_box: 10,
      cost_per_box: 0,
      sale_price_per_box: 0,
      sale_price_per_piece: 0,
      rak_number: this.raks[0] || 'A-01',
      min_stock_qty_pcs: 50,
      barcode_value: '',
      is_medicine: true,
      stock_qty: 100,
    };
    this.isModalVisible = true;
  }

  openEditMedicineModal(product: ProductRow): void {
    this.modalMode = 'edit';
    if (product.company_name && !this.companies.includes(product.company_name)) {
      this.companies = [...this.companies, product.company_name];
    }
    if (product.generic_name && !this.generics.includes(product.generic_name)) {
      this.generics = [...this.generics, product.generic_name];
    }
    if (product.rak_number && !this.raks.includes(product.rak_number)) {
      this.raks = [...this.raks, product.rak_number];
    }
    this.formModel = {
      product_no: product.product_no,
      product_name: product.product_name,
      strength: product.strength || '',
      volume: product.volume || '',
      generic_name: product.generic_name || '',
      company_name: product.company_name || '',
      medicine_type: product.medicine_type,
      unit_type: product.unit_type,
      quantity_per_box: product.quantity_per_box,
      cost_per_box: product.cost_per_box,
      sale_price_per_box: product.sale_price_per_box,
      sale_price_per_piece: product.sale_price_per_piece,
      rak_number: product.rak_number || '',
      min_stock_qty_pcs: product.min_stock_qty_pcs,
      barcode_value: product.barcode_value || '',
      is_medicine: product.is_medicine,
      stock_qty: product.stock_qty ?? 0,
    };
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  onBoxPriceOrQtyChange(): void {
    if (this.formModel.sale_price_per_box > 0 && this.formModel.quantity_per_box > 0) {
      this.formModel.sale_price_per_piece = Number(
        (this.formModel.sale_price_per_box / this.formModel.quantity_per_box).toFixed(2)
      );
    }
  }

  saveMedicine(): void {
    if (!this.formModel.product_name.trim()) {
      this.msg.error('Please enter the medicine brand name.');
      return;
    }

    let companyNo = 1;
    const matchedComp = this.companiesList.find(
      c => c.name.toLowerCase() === this.formModel.company_name.toLowerCase()
    );
    if (matchedComp) {
      companyNo = matchedComp.company_no;
    }

    let genericNo = 1;
    const matchedGen = this.genericsList.find(
      g => g.name.toLowerCase() === this.formModel.generic_name.toLowerCase()
    );
    if (matchedGen) {
      genericNo = matchedGen.generic_no;
    }

    const payload: Partial<ProdProduct> = {
      product_name: this.formModel.product_name.trim(),
      company_no: companyNo,
      generic_no: genericNo,
      strength: this.formModel.strength.trim(),
      volume: this.formModel.volume.trim(),
      medicine_type: this.formModel.medicine_type,
      unit_type: this.formModel.unit_type,
      quantity_per_box: this.formModel.quantity_per_box,
      cost_per_box: this.formModel.cost_per_box,
      sale_price_per_box: this.formModel.sale_price_per_box,
      avg_purchase_price_per_piece: this.formModel.cost_per_box / (this.formModel.quantity_per_box || 1),
      purchase_price_per_piece: this.formModel.cost_per_box / (this.formModel.quantity_per_box || 1),
      sale_price_per_piece:
        this.formModel.sale_price_per_piece ||
        this.formModel.sale_price_per_box / (this.formModel.quantity_per_box || 1),
      rak_number: this.formModel.rak_number,
      min_stock_qty_pcs: this.formModel.min_stock_qty_pcs,
      barcode_value: this.formModel.barcode_value,
      is_medicine: this.formModel.is_medicine,
      country_of_origin: 'Bangladesh',
      is_active: true,
      stock_qty: this.formModel.stock_qty || 0,
    };

    this.isSaving = true;

    if (this.modalMode === 'create') {
      this.productService.createProduct(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.msg.success(`Medicine "${this.formModel.product_name}" added successfully!`);
            this.isModalVisible = false;
            this.loadProductsFromService();
          } else {
            this.msg.error(res.message || 'Failed to create product');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.msg.error(err?.error?.message || 'Failed to create product');
        },
      });
    } else {
      this.productService.updateProduct(this.formModel.product_no, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.msg.success(`Medicine "${this.formModel.product_name}" updated successfully!`);
            this.isModalVisible = false;
            this.loadProductsFromService();
          } else {
            this.msg.error(res.message || 'Failed to update product');
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.msg.error(err?.error?.message || 'Failed to update product');
        },
      });
    }
  }

  deleteProduct(product: ProductRow): void {
    this.modal
      .confirmDelete(product.product_name, `Are you sure you want to remove "${product.product_name}" from the catalog?`)
      .subscribe(confirmed => {
        if (confirmed) {
          this.productService.deleteProduct(product.product_no).subscribe({
            next: (res) => {
              if (res.success) {
                this.msg.success(`Medicine "${product.product_name}" deleted.`);
                this.loadProductsFromService();
              } else {
                this.msg.error(res.message || 'Failed to delete product');
              }
            },
            error: (err) => {
              this.msg.error(err?.error?.message || 'Failed to delete product');
            },
          });
        }
      });
  }
}

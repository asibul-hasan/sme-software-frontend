import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  MEDICINE_TYPE_OPTIONS,
  UNIT_TYPE_OPTIONS,
  DEFAULT_COMPANIES,
  DEFAULT_GENERICS,
  DEFAULT_RAKS,
} from '../../shared/constants/label-values.constant';
import { ProductService } from '../../core/services/product.service';
import { ProdCompany, ProdGeneric, ProdProduct } from '../../core/models';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzCheckboxModule,
    NzModalModule,
    PageHeaderComponent,
  ],
  templateUrl: './product-add.component.html',
})
export class ProductAddComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);
  private readonly productService = inject(ProductService);

  medicineTypeOptions: { label: string; value: number }[] = [...MEDICINE_TYPE_OPTIONS];
  unitTypeOptions: { label: string; value: number }[] = [...UNIT_TYPE_OPTIONS];

  raks: string[] = [...DEFAULT_RAKS];
  companies: string[] = [...DEFAULT_COMPANIES];
  generics: string[] = [...DEFAULT_GENERICS];

  companiesList: ProdCompany[] = [];
  genericsList: ProdGeneric[] = [];

  form = {
    name: '',
    strength: '',
    volume: '',
    medicineType: 1, // Tablet
    unitType: 2,     // STRIP
    qtyBox: 10,
    costBox: 0,
    salePriceBox: 0,
    salePricePiece: 0,
    company: 'Beximco Pharmaceuticals Ltd.',
    generic: 'Paracetamol',
    country: 'Bangladesh',
    barcode: '',
    rakNumber: 'A-01 (General OTC)',
    minStock: 50,
    isMedicine: true,
  };

  isSaving = false;

  // Company Modal
  isAddCompanyModalVisible = false;
  newCompanyName = '';

  // Generic Modal
  isAddGenericModalVisible = false;
  newGenericName = '';

  // Medicine Type Modal
  isAddMedicineTypeModalVisible = false;
  newMedicineTypeName = '';

  // Unit Type Modal
  isAddUnitTypeModalVisible = false;
  newUnitTypeName = '';

  // Rak Modal
  isAddRakModalVisible = false;
  newRakName = '';

  ngOnInit(): void {
    this.loadDropdownData();
  }

  loadDropdownData(): void {
    this.productService.getCompanies({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = res.data;
          const names = res.data.map(c => c.name).filter(Boolean);
          this.companies = Array.from(new Set([...names, ...DEFAULT_COMPANIES]));
          if (this.companies.length > 0 && !this.form.company) {
            this.form.company = this.companies[0];
          }
        }
      },
    });

    this.productService.getGenerics({ pageSize: 200 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = res.data;
          const names = res.data.map(g => g.name).filter(Boolean);
          this.generics = Array.from(new Set([...names, ...DEFAULT_GENERICS]));
          if (this.generics.length > 0 && !this.form.generic) {
            this.form.generic = this.generics[0];
          }
        }
      },
    });
  }

  calculatePiecePrice(): void {
    if (this.form.salePriceBox > 0 && this.form.qtyBox > 0) {
      this.form.salePricePiece = Number((this.form.salePriceBox / this.form.qtyBox).toFixed(2));
    }
  }

  saveNewCompany(): void {
    if (!this.newCompanyName.trim()) {
      this.msg.warning('Please enter a company name.');
      return;
    }
    const name = this.newCompanyName.trim();
    this.productService.createCompany({ name }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.companiesList = [...this.companiesList, res.data];
          if (!this.companies.includes(name)) {
            this.companies = [...this.companies, name];
          }
          this.form.company = name;
          this.newCompanyName = '';
          this.isAddCompanyModalVisible = false;
          this.msg.success(`Manufacturer company "${name}" added!`);
        } else {
          this.msg.error(res.message || 'Failed to add company');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add company'),
    });
  }

  saveNewGeneric(): void {
    if (!this.newGenericName.trim()) {
      this.msg.warning('Please enter a generic formulation.');
      return;
    }
    const name = this.newGenericName.trim();
    this.productService.createGeneric({ name }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.genericsList = [...this.genericsList, res.data];
          if (!this.generics.includes(name)) {
            this.generics = [...this.generics, name];
          }
          this.form.generic = name;
          this.newGenericName = '';
          this.isAddGenericModalVisible = false;
          this.msg.success(`Generic formulation "${name}" added!`);
        } else {
          this.msg.error(res.message || 'Failed to add generic');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to add generic'),
    });
  }

  saveNewMedicineType(): void {
    if (!this.newMedicineTypeName.trim()) {
      this.msg.warning('Please enter a medicine type name.');
      return;
    }
    const name = this.newMedicineTypeName.trim();
    const newId = this.medicineTypeOptions.length + 10;
    this.medicineTypeOptions = [...this.medicineTypeOptions, { label: name, value: newId }];
    this.form.medicineType = newId;
    this.newMedicineTypeName = '';
    this.isAddMedicineTypeModalVisible = false;
    this.msg.success(`Medicine type "${name}" added!`);
  }

  saveNewUnitType(): void {
    if (!this.newUnitTypeName.trim()) {
      this.msg.warning('Please enter a unit type name.');
      return;
    }
    const name = this.newUnitTypeName.trim().toUpperCase();
    const newId = this.unitTypeOptions.length + 10;
    this.unitTypeOptions = [...this.unitTypeOptions, { label: name, value: newId }];
    this.form.unitType = newId;
    this.newUnitTypeName = '';
    this.isAddUnitTypeModalVisible = false;
    this.msg.success(`Unit type "${name}" added!`);
  }

  saveNewRak(): void {
    if (!this.newRakName.trim()) {
      this.msg.warning('Please enter a shelf/rack identifier.');
      return;
    }
    const name = this.newRakName.trim();
    this.raks = [...this.raks, name];
    this.form.rakNumber = name;
    this.newRakName = '';
    this.isAddRakModalVisible = false;
    this.msg.success(`Rak/Shelf "${name}" added!`);
  }

  submitForm(): void {
    if (!this.form.name.trim()) {
      this.msg.error('Please enter the medicine name.');
      return;
    }

    let companyNo = 1;
    const matchedComp = this.companiesList.find(
      c => c.name.toLowerCase() === this.form.company.toLowerCase()
    );
    if (matchedComp) {
      companyNo = matchedComp.company_no;
    }

    let genericNo = 1;
    const matchedGen = this.genericsList.find(
      g => g.name.toLowerCase() === this.form.generic.toLowerCase()
    );
    if (matchedGen) {
      genericNo = matchedGen.generic_no;
    }

    const payload: Partial<ProdProduct> = {
      product_name: this.form.name.trim(),
      company_no: companyNo,
      generic_no: genericNo,
      strength: this.form.strength.trim(),
      volume: this.form.volume.trim(),
      medicine_type: this.form.medicineType,
      unit_type: this.form.unitType,
      quantity_per_box: this.form.qtyBox,
      cost_per_box: this.form.costBox,
      sale_price_per_box: this.form.salePriceBox,
      avg_purchase_price_per_piece: this.form.costBox / (this.form.qtyBox || 1),
      purchase_price_per_piece: this.form.costBox / (this.form.qtyBox || 1),
      sale_price_per_piece: this.form.salePricePiece || (this.form.salePriceBox / (this.form.qtyBox || 1)),
      country_of_origin: this.form.country || 'Bangladesh',
      barcode_value: this.form.barcode,
      rak_number: this.form.rakNumber,
      min_stock_qty_pcs: this.form.minStock,
      is_medicine: this.form.isMedicine,
      is_active: true,
      stock_qty: 0,
    };

    this.isSaving = true;
    this.productService.createProduct(payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.msg.success(`Medicine "${this.form.name}" registered successfully!`);
          this.router.navigate(['/products/list']);
        } else {
          this.msg.error(res.message || 'Failed to register medicine');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.msg.error(err?.error?.message || 'Failed to register medicine');
      },
    });
  }
}


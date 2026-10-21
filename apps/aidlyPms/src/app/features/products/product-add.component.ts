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
import { DynamicImportModalComponent } from '../../shared/components/dynamic-import-modal/dynamic-import-modal.component';
import { TemplateColumnDef } from '../../shared/services/excel-template.service';
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
    DynamicImportModalComponent,
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
    darNumber: '',
    drugSchedule: 'OTC' as 'OTC' | 'POM' | 'ANTIBIOTIC' | 'NARCOTIC',
    minStock: 50,
    isMedicine: true,
  };

  readonly drugScheduleOptions: { label: string; value: 'OTC' | 'POM' | 'ANTIBIOTIC' | 'NARCOTIC' }[] = [
    { label: 'OTC (Over-The-Counter)', value: 'OTC' },
    { label: 'POM (Prescription Only Medicine)', value: 'POM' },
    { label: 'Antibiotic (Schedule-G)', value: 'ANTIBIOTIC' },
    { label: 'Narcotic / Controlled (Schedule-II)', value: 'NARCOTIC' },
  ];

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

  // Dynamic Excel Import Modal
  isImportModalVisible = false;

  importColumns: TemplateColumnDef[] = [
    {
      key: 'product_name',
      header: 'Medicine Name',
      required: true,
      width: 26,
      sample: 'Napa Extra',
      description: 'Brand or trade name of the pharmaceutical item (Required)',
    },
    {
      key: 'strength',
      header: 'Strength',
      width: 15,
      sample: '500mg+65mg',
      description: 'Potency / dosage strength (e.g. 500mg, 20mg, 10mg/5ml)',
    },
    {
      key: 'volume',
      header: 'Volume / Pack',
      width: 16,
      sample: "10's Strip",
      description: 'Pack size or liquid volume (e.g. 100ml, 10 strips)',
    },
    {
      key: 'medicine_form',
      header: 'Medicine Form',
      required: true,
      width: 18,
      sample: 'Tablet',
      dropdownOptions: [
        'Tablet',
        'Capsule',
        'Syrup',
        'Suspension',
        'Injection',
        'Drop',
        'Ointment',
        'Cream',
        'Gel',
        'Inhaler',
        'Suppository',
      ],
      description: 'Dosage formulation from dropdown',
    },
    {
      key: 'company_name',
      header: 'Manufacturer Company',
      required: true,
      width: 30,
      sample: 'Beximco Pharmaceuticals Ltd.',
      lookupKey: 'companies',
      description: 'Select existing manufacturer or type new to auto-create',
    },
    {
      key: 'generic_name',
      header: 'Generic Formulation',
      width: 28,
      sample: 'Paracetamol + Caffeine',
      lookupKey: 'generics',
      description: 'Active ingredient or formulation from dropdown or type new',
    },
    {
      key: 'unit_type_name',
      header: 'Unit Type',
      required: true,
      width: 14,
      sample: 'STRIP',
      dropdownOptions: ['STRIP', 'BOX', 'PIECE', 'BOTTLE', 'VIAL', 'AMPULE', 'TUBE', 'SACHET'],
      description: 'Stock keeping dispensing unit',
    },
    {
      key: 'quantity_per_box',
      header: 'Qty Per Box',
      width: 14,
      sample: 10,
      description: 'Number of units inside a master box/pack',
    },
    {
      key: 'cost_per_box',
      header: 'Cost Per Box (৳)',
      width: 18,
      sample: 250.0,
      description: 'Purchase cost per box',
    },
    {
      key: 'sale_price_per_box',
      header: 'MRP Per Box (৳)',
      width: 18,
      sample: 300.0,
      description: 'Maximum retail price per box',
    },
    {
      key: 'purchase_price_per_piece',
      header: 'Purchase Price (Piece)',
      width: 22,
      sample: 25.0,
      description: 'Cost per piece/strip (auto-calculated if blank)',
    },
    {
      key: 'sale_price_per_piece',
      header: 'Sale Price (Piece)',
      width: 20,
      sample: 30.0,
      description: 'Selling price per piece/strip (auto-calculated if blank)',
    },
    {
      key: 'wholesale_price_per_box',
      header: 'Wholesale Price / Box',
      width: 22,
      sample: 240.0,
      description: 'Trade/wholesale price per box',
    },
    {
      key: 'country_of_origin',
      header: 'Country of Origin',
      width: 18,
      sample: 'Bangladesh',
    },
    {
      key: 'barcode_value',
      header: 'Barcode / SKU',
      width: 18,
      sample: '894010001234',
      description: 'Leave blank to auto-generate',
    },
    {
      key: 'rak_number',
      header: 'Rack / Shelf No',
      width: 20,
      sample: 'A-01 (General OTC)',
      dropdownOptions: [...DEFAULT_RAKS],
    },
    {
      key: 'min_stock_qty_pcs',
      header: 'Min Stock Alert (Pcs)',
      width: 20,
      sample: 50,
      description: 'Low stock re-order alert threshold',
    },
    {
      key: 'is_prescription_required',
      header: 'Prescription Req',
      width: 18,
      sample: 'No',
      dropdownOptions: ['Yes', 'No'],
    },
    {
      key: 'is_narcotic',
      header: 'Narcotic Item',
      width: 16,
      sample: 'No',
      dropdownOptions: ['Yes', 'No'],
    },
    {
      key: 'opening_stock_pcs',
      header: 'Opening Stock (Pcs)',
      width: 20,
      sample: 100,
      description: 'Initial stock on hand to create opening batch',
    },
  ];

  importSampleData = [
    {
      product_name: 'Napa Extra',
      strength: '500mg+65mg',
      volume: "10's Strip",
      medicine_form: 'Tablet',
      company_name: 'Beximco Pharmaceuticals Ltd.',
      generic_name: 'Paracetamol + Caffeine',
      unit_type_name: 'STRIP',
      quantity_per_box: 10,
      cost_per_box: 250.0,
      sale_price_per_box: 300.0,
      purchase_price_per_piece: 25.0,
      sale_price_per_piece: 30.0,
      wholesale_price_per_box: 240.0,
      country_of_origin: 'Bangladesh',
      barcode_value: '894010001234',
      rak_number: 'A-01 (General OTC)',
      min_stock_qty_pcs: 50,
      is_prescription_required: 'No',
      is_narcotic: 'No',
      opening_stock_pcs: 100,
    },
    {
      product_name: 'Seclo 20mg',
      strength: '20mg',
      volume: "10's Alu-Alu",
      medicine_form: 'Capsule',
      company_name: 'Square Pharmaceuticals Ltd.',
      generic_name: 'Omeprazole',
      unit_type_name: 'STRIP',
      quantity_per_box: 6,
      cost_per_box: 360.0,
      sale_price_per_box: 420.0,
      purchase_price_per_piece: 60.0,
      sale_price_per_piece: 70.0,
      wholesale_price_per_box: 350.0,
      country_of_origin: 'Bangladesh',
      barcode_value: '894010001235',
      rak_number: 'B-02 (Gastric)',
      min_stock_qty_pcs: 40,
      is_prescription_required: 'No',
      is_narcotic: 'No',
      opening_stock_pcs: 60,
    },
  ];

  get importLookups(): Record<string, string[]> {
    return {
      companies: this.companies && this.companies.length > 0 ? this.companies : [...DEFAULT_COMPANIES],
      generics: this.generics && this.generics.length > 0 ? this.generics : [...DEFAULT_GENERICS],
    };
  }

  importProductsHandler = (rows: any[]) => {
    const payload = rows.map((r) => ({
      product_name: r.product_name,
      strength: r.strength,
      volume: r.volume,
      medicine_form: r.medicine_form,
      company_name: r.company_name,
      generic_name: r.generic_name,
      unit_type_name: r.unit_type_name,
      quantity_per_box: Number(r.quantity_per_box) || 1,
      cost_per_box: Number(r.cost_per_box) || 0,
      sale_price_per_box: Number(r.sale_price_per_box) || 0,
      purchase_price_per_piece: Number(r.purchase_price_per_piece) || 0,
      sale_price_per_piece: Number(r.sale_price_per_piece) || 0,
      wholesale_price_per_box: Number(r.wholesale_price_per_box) || 0,
      country_of_origin: r.country_of_origin || 'Bangladesh',
      barcode_value: r.barcode_value,
      rak_number: r.rak_number,
      min_stock_qty_pcs: Number(r.min_stock_qty_pcs) || 10,
      is_prescription_required: String(r.is_prescription_required).toLowerCase() === 'yes',
      is_narcotic: String(r.is_narcotic).toLowerCase() === 'yes',
      opening_stock_pcs: Number(r.opening_stock_pcs) || 0,
    }));
    return this.productService.importProducts(payload);
  };

  openImportModal(): void {
    this.isImportModalVisible = true;
  }

  onImportSuccess(result: any): void {
    this.loadDropdownData();
  }


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
      dar_number: this.form.darNumber?.trim() || null,
      drug_schedule: this.form.drugSchedule,
      is_prescription_required: this.form.drugSchedule !== 'OTC',
      is_narcotic: this.form.drugSchedule === 'NARCOTIC',
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


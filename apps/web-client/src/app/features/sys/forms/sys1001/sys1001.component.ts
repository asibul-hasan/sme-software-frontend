import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';

interface CompanyRow {
  id: number;
  companyName: string;
  companySuffix: string;
  systemId: string;
  vendorType: string;
  regNo: string;
  regDate: string;
  countryCode: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyLogo: string;
  companyAddress: string;
  fiscalYear: string;
  companyStatus: string;
}

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sys1001.component.html',
  styleUrls: ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  formdata!: FormGroup;

  companies = signal<CompanyRow[]>([
    {
      id: 1,
      companyName: 'Acme Global Holdings Ltd.',
      companySuffix: 'AGH',
      systemId: 'COMP-001',
      vendorType: 'Holding',
      regNo: 'RG-2024-001',
      regDate: '2024-01-10',
      countryCode: '+1',
      companyPhone: '(555) 123-4567',
      companyEmail: 'info@acmeglobal.com',
      companyWebsite: 'https://www.acmeglobal.com',
      companyLogo: '',
      companyAddress: '500 Innovation Drive, Suite 120, Business City',
      fiscalYear: '12',
      companyStatus: 'active',
    },
    {
      id: 2,
      companyName: 'Nova Distribution Pvt. Ltd.',
      companySuffix: 'NDPL',
      systemId: 'COMP-002',
      vendorType: 'Distributor',
      regNo: 'RG-2025-010',
      regDate: '2025-02-18',
      countryCode: '+44',
      companyPhone: '+44 20 7946 0123',
      companyEmail: 'contact@novadistribution.co.uk',
      companyWebsite: 'https://www.novadistribution.co.uk',
      companyLogo: '',
      companyAddress: '44 Commerce Street, London',
      fiscalYear: '03',
      companyStatus: 'active',
    },
  ]);

  searchTerm = signal('');
  selectedCompanyId: number | null = null;
  logoPreview = signal('');
  isDragActive = signal(false);
  private readonly maxLogoSize = 2 * 1024 * 1024;

  filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const items = this.companies();
    if (!term) {
      return items;
    }
    return items.filter((company) =>
      [company.companyName, company.companySuffix, company.systemId, company.regNo]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  });

  constructor(private fb: FormBuilder, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.formdata = this.fb.group({
      companyName: ['', Validators.required],
      companySuffix: [''],
      systemId: [{ value: '', disabled: true }],
      vendorType: ['', Validators.required],
      regNo: [''],
      regDate: [''],
      countryCode: ['+1'],
      companyPhone: ['', Validators.required],
      companyEmail: ['', [Validators.email]],
      companyWebsite: [''],
      companyLogo: [''],
      companyAddress: ['', Validators.required],
      fiscalYear: ['', Validators.required],
      companyStatus: ['active', Validators.required],
    });
  }

  selectCompany(company: CompanyRow) {
    this.selectedCompanyId = company.id;
    this.formdata.patchValue({
      companyName: company.companyName,
      companySuffix: company.companySuffix,
      systemId: company.systemId,
      vendorType: company.vendorType,
      regNo: company.regNo,
      regDate: company.regDate,
      countryCode: company.countryCode,
      companyPhone: company.companyPhone,
      companyEmail: company.companyEmail,
      companyWebsite: company.companyWebsite,
      companyLogo: company.companyLogo,
      companyAddress: company.companyAddress,
      fiscalYear: company.fiscalYear,
      companyStatus: company.companyStatus,
    });
    this.logoPreview.set(company.companyLogo || '');
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    this.isDragActive.set(false);
    if (!file) {
      this.clearLogo();
      return;
    }
    this.handleLogoFile(file);
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleLogoFile(file);
    }
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive.set(true);
  }

  onLogoDragLeave(): void {
    this.isDragActive.set(false);
  }

  clearLogo(): void {
    this.formdata.patchValue({ companyLogo: '' });
    this.logoPreview.set('');
  }

  private handleLogoFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Please upload a valid image file.');
      return;
    }
    if (file.size > this.maxLogoSize) {
      this.toastr.error('Logo size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result as string;
      this.formdata.patchValue({ companyLogo: value });
      this.logoPreview.set(value);
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.toastr.error('Please complete all required fields.');
      return;
    }

    const { systemId, ...payload } = this.formdata.getRawValue() as Omit<CompanyRow, 'id'>;
    if (this.selectedCompanyId) {
      this.companies.update((list) =>
        list.map((item) =>
          item.id === this.selectedCompanyId
            ? { ...item, ...payload }
            : item
        )
      );
      this.toastr.success('Company updated successfully.');
    } else {
      const nextId = Math.max(0, ...this.companies().map((item) => item.id)) + 1;
      const newCompany: CompanyRow = {
        id: nextId,
        ...payload,
        systemId: `COMP-${String(nextId).padStart(3, '0')}`,
      };
      this.companies.update((list) => [newCompany, ...list]);
      this.selectedCompanyId = newCompany.id;
      this.formdata.patchValue({ systemId: newCompany.systemId });
      this.toastr.success('Company added successfully.');
    }
  }

  onNew(): void {
    this.selectedCompanyId = null;
    this.formdata.reset({
      companyName: '',
      companySuffix: '',
      systemId: '',
      vendorType: '',
      regNo: '',
      regDate: '',
      countryCode: '+1',
      companyPhone: '',
      companyEmail: '',
      companyWebsite: '',
      companyLogo: '',
      companyAddress: '',
      fiscalYear: '',
      companyStatus: 'active',
    });
    this.logoPreview.set('');
    this.toastr.info('Ready to register a new company.');
  }

  onReset(): void {
    if (this.selectedCompanyId) {
      const company = this.companies().find((item) => item.id === this.selectedCompanyId);
      if (company) {
        this.selectCompany(company);
        this.toastr.info('Company details restored.');
        return;
      }
    }
    this.onNew();
  }

  onDelete(): void {
    if (!this.selectedCompanyId) {
      this.toastr.warning('Select a company before deleting.');
      return;
    }
    this.companies.update((list) => list.filter((item) => item.id !== this.selectedCompanyId));
    this.onNew();
    this.toastr.warning('Company removed from the list.');
  }
}

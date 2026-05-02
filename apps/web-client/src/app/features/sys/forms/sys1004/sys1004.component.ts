import { Component, OnInit, signal, computed, inject, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { SysDataService } from '../../services/data.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { sysConstants } from '../../constants/sys.constants';
import { ModalService } from 'apps/web-client/src/app/core/services/modal.service';

interface Currency {
  currency_no: number;
  currency_code: string;
  currency_name_en: string;
  currency_name_bn?: string;
  currency_symbol: string;
  fractional_unit_en?: string;
  fractional_unit_bn?: string;
  region: string;
  number_format: string;
  exchange_rate: number;
  decimal_places: number;
  is_base_currency: boolean;
  rate_date: string;
  last_rate_update?: string;
}

interface RateHistory {
  rate_date: string;
  exchange_rate: number;
  entered_by: string;
  entered_at: string;
}

@Component({
  selector: 'app-sys1004',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule],
  providers: [DatePipe],
  templateUrl: './sys1004.component.html',
  styles: [`:host { display: block; height: 100%; }`]
})
export class Sys1004Component implements OnInit {
  private fb = inject(FormBuilder);
  private sysService = inject(SysDataService);
  private alertService = inject(AlertService);
  private modalService = inject(ModalService);
  private datePipe = inject(DatePipe);
  public dialog = inject(MatDialog);
  public permissionService = inject(FormPermissionService);

  readonly SYS_CONSTS = sysConstants;

  // Data signals
  currencies = signal<Currency[]>([]);
  branches = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  rateHistory = signal<RateHistory[]>([]);
  isHistoryLoading = signal(false);

  searchTerm = signal('');
  selectedCurrencyNo = signal<number | null>(null);
  lastSelectedIndex: number = 0;

  filteredCurrencies = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.currencies().filter(c =>
      c.currency_name_en.toLowerCase().includes(term) || 
      (c.currency_name_bn && c.currency_name_bn.toLowerCase().includes(term)) ||
      c.currency_code.toLowerCase().includes(term)
    );
  });

  formdata: FormGroup = this.fb.group({
    currency_no: [null],
    branch_nos: [[], [Validators.required]],
    currency_code: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    currency_name_en: ['', [Validators.required]],
    currency_name_bn: [''],
    currency_symbol: ['', [Validators.required, Validators.maxLength(5)]],
    fractional_unit_en: [''],
    fractional_unit_bn: [''],
    region: ['', [Validators.required]],
    number_format: ['International', [Validators.required]],
    decimal_places: [2, [Validators.required, Validators.min(0), Validators.max(4)]],
    is_base_currency: [false],
    exchange_rate: [1.0, [Validators.required, Validators.min(0)]],
    rate_date: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit(): void {
    this.permissionService.loadPermissions('SYS_1004').subscribe();
    this.loadBranches();
    this.loadCurrencies();
  }

  loadBranches() {
    this.sysService.getList<any>('branch/list').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadCurrencies(reselectIndex?: number) {
    this.isLoading.set(true);
    this.sysService.getList<any>('currency/list')
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.currencies.set(res.data);
            if (res.data.length > 0) {
              const index = (reselectIndex !== undefined && reselectIndex < res.data.length) ? reselectIndex : 0;
              this.selectCurrency(res.data[index], index);
            } else {
              this.onNew();
            }
          }
        },
        error: (err) => {
          this.alertService.error('Failed to load currencies');
          console.error(err);
        }
      });
  }

  selectCurrency(currency: any, index?: number) {
    if (index !== undefined) this.lastSelectedIndex = index;
    this.selectedCurrencyNo.set(currency.currency_no);
    
    this.isLoading.set(true);
    this.sysService.getDetails<any>('currency/detail', { currency_no: currency.currency_no })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.formdata.patchValue({
              currency_no: res.data.currencyNo,
              branch_nos: res.data.branchNos || [],
              currency_code: res.data.currencyCode,
              currency_name_en: res.data.currencyNameEn,
              currency_name_bn: res.data.currencyNameBn,
              currency_symbol: res.data.currencySymbol,
              fractional_unit_en: res.data.fractionalUnitEn,
              fractional_unit_bn: res.data.fractionalUnitBn,
              region: res.data.region,
              number_format: res.data.numberFormat || 'International',
              decimal_places: res.data.decimalPlaces,
              is_base_currency: res.data.isBaseCurrency === 1 || res.data.isBaseCurrency === true,
              exchange_rate: res.data.exchangeRate,
              rate_date: this.datePipe.transform(res.data.rateDate, 'yyyy-MM-dd')
            });
          }
        },
        error: (err) => {
          this.alertService.error('Failed to load details');
          console.error(err);
        }
      });
  }

  onSave() {
    if (this.formdata.invalid) {
      this.formdata.markAllAsTouched();
      this.alertService.warning('Please correct the errors before saving.');
      return;
    }

    this.isSaving.set(true);
    const val = this.formdata.value;

    const payload = {
      currency_no: val.currency_no,
      branch_nos: val.branch_nos,
      currency_code: val.currency_code.toUpperCase(),
      currency_name_en: val.currency_name_en,
      currency_name_bn: val.currency_name_bn,
      currency_symbol: val.currency_symbol,
      fractional_unit_en: val.fractional_unit_en,
      fractional_unit_bn: val.fractional_unit_bn,
      region: val.region,
      number_format: val.number_format,
      decimal_places: val.decimal_places,
      is_base_currency: val.is_base_currency ? 1 : 0,
      exchange_rate: val.exchange_rate,
      rate_date: val.rate_date
    };

    const isUpdate = !!this.selectedCurrencyNo();
    const obs = isUpdate 
      ? this.sysService.update<any>('currency/update', payload)
      : this.sysService.create<any>('currency/create', payload);

    obs.pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.success(isUpdate ? 'Currency updated' : 'Currency registered');
            this.loadCurrencies(isUpdate ? this.lastSelectedIndex : 0);
          } else {
            this.alertService.error(res.message || 'Save failed');
          }
        },
        error: (err) => {
          this.alertService.error('Server error during save');
          console.error(err);
        }
      });
  }

  onDelete() {
    if (!this.selectedCurrencyNo()) return;

    this.alertService.deleteConfirm().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading.set(true);
        this.sysService.delete<any>('currency/delete', { currency_no: this.selectedCurrencyNo() })
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.success('Currency deleted successfully');
                this.loadCurrencies();
              } else {
                this.alertService.error(res.message || 'Delete failed');
              }
            },
            error: (err) => {
              this.alertService.error('Server error during delete');
              console.error(err);
            }
          });
      }
    });
  }

  onNew() {
    this.selectedCurrencyNo.set(null);
    this.formdata.reset({
      decimal_places: 2,
      exchange_rate: 1.0,
      is_base_currency: false,
      rate_date: new Date().toISOString().split('T')[0]
    });
  }

  onReset() {
    if (this.selectedCurrencyNo()) {
       const original = this.currencies().find(c => c.currency_no === this.selectedCurrencyNo());
       if (original) this.selectCurrency(original);
    } else {
      this.onNew();
    }
  }

  viewRateHistory() {
    if (!this.selectedCurrencyNo()) return;

    this.isHistoryLoading.set(true);
    this.sysService.getDetails<any>('currency/rate-history', { currency_no: this.selectedCurrencyNo() })
      .pipe(finalize(() => this.isHistoryLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.modalService.openDataList({
              title: `Rate History: ${this.formdata.get('currency_code')?.value}`,
              width: 'lg',
              columns: [
                { field: 'rate_date', label: 'Effective Date', pipe: 'date' },
                { field: 'exchange_rate', label: 'Exchange Rate', pipe: 'number', pipeArgs: '1.2-6', align: 'right' },
                { field: 'entered_by', label: 'Entered By' },
                { field: 'entered_at', label: 'Timestamp', pipe: 'date', pipeArgs: 'short' }
              ],
              data: res.data
            });
          }
        },
        error: (err) => {
          this.alertService.error('Failed to load history');
          console.error(err);
        }
      });
  }
}

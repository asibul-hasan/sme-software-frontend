import { Injectable, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Hrm1008DataService } from './data.service';
import { isSuccess } from '../../../../../core/models/response.model';

export interface HrmSettings {
  country_code: string;
  currency_code: string;
  weekend_days: string;
  fiscal_year_start: string;
  overtime_multiplier: number;
  overtime_formula: string;
  daily_rate_formula: string;
  lwp_formula: string;
  tax_regime: string;
  enable_provident_fund: number;
  enable_gratuity: number;
  enable_festival_bonus: number;
  maternity_weeks: number;
}

/** State + form + orchestration for HRM_1008 – HR Settings (single curated record per company). */
@Injectable()
export class Hrm1008ModelService {
  private fb     = inject(FormBuilder);
  private data   = inject(Hrm1008DataService);
  private toastr = inject(ToastrService);

  isLoading = signal(false);
  isSaving  = signal(false);

  form!: FormGroup;

  initForm(): void {
    this.form = this.fb.group({
      country_code:          ['BD', [Validators.required, Validators.maxLength(4)]],
      currency_code:         ['BDT', [Validators.required, Validators.maxLength(4)]],
      weekend_days:          ['FRI,SAT'],
      fiscal_year_start:     ['07-01'],
      overtime_multiplier:   [2.0, [Validators.min(0)]],
      overtime_formula:      ['BASIC_SALARY / 104', [Validators.maxLength(500)]],
      daily_rate_formula:    ['GROSS_SALARY / CALENDAR_DAYS', [Validators.maxLength(500)]],
      lwp_formula:           ['DAILY_RATE * LWP_DAYS', [Validators.maxLength(500)]],
      tax_regime:            ['BD_NBR', [Validators.maxLength(30)]],
      enable_provident_fund: [1],
      enable_gratuity:       [1],
      enable_festival_bonus: [1],
      maternity_weeks:       [16, [Validators.min(0)]],
    });
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.data.loadSettings().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            country_code:          d['country_code'] ?? 'BD',
            currency_code:         d['currency_code'] ?? 'BDT',
            weekend_days:          d['weekend_days'] ?? 'FRI,SAT',
            fiscal_year_start:     d['fiscal_year_start'] ?? '07-01',
            overtime_multiplier:   d['overtime_multiplier'] ?? 2.0,
            overtime_formula:      d['overtime_formula'] ?? 'BASIC_SALARY / 104',
            daily_rate_formula:    d['daily_rate_formula'] ?? 'GROSS_SALARY / CALENDAR_DAYS',
            lwp_formula:           d['lwp_formula'] ?? 'DAILY_RATE * LWP_DAYS',
            tax_regime:            d['tax_regime'] ?? 'BD_NBR',
            enable_provident_fund: d['enable_provident_fund'] ?? 1,
            enable_gratuity:       d['enable_gratuity'] ?? 1,
            enable_festival_bonus: d['enable_festival_bonus'] ?? 1,
            maternity_weeks:       d['maternity_weeks'] ?? 16,
          });
        }
      },
      error: () => this.toastr.error('Failed to load HR settings'),
    });
  }

  /** Apply a country pack's sensible defaults into the form (user still saves explicitly). */
  applyPack(country: string): void {
    if (country === 'BD') {
      this.form.patchValue({
        country_code: 'BD', currency_code: 'BDT', weekend_days: 'FRI,SAT', fiscal_year_start: '07-01',
        overtime_multiplier: 2.0, overtime_formula: 'BASIC_SALARY / 104', daily_rate_formula: 'GROSS_SALARY / CALENDAR_DAYS',
        lwp_formula: 'DAILY_RATE * LWP_DAYS', tax_regime: 'BD_NBR',
        enable_provident_fund: 1, enable_gratuity: 1, enable_festival_bonus: 1, maternity_weeks: 16,
      });
    } else {
      this.form.patchValue({
        country_code: 'INTL', currency_code: 'USD', weekend_days: 'SAT,SUN', fiscal_year_start: '01-01',
        overtime_multiplier: 1.5, overtime_formula: 'BASIC_SALARY / 208', daily_rate_formula: 'GROSS_SALARY / CALENDAR_DAYS',
        lwp_formula: 'DAILY_RATE * LWP_DAYS', tax_regime: 'GENERIC',
        enable_provident_fund: 0, enable_gratuity: 0, enable_festival_bonus: 0, maternity_weeks: 0,
      });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please correct the errors before saving.');
      return;
    }
    this.isSaving.set(true);
    this.data.saveSettings(this.form.getRawValue()).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res)) {
          this.toastr.success('HR settings saved');
          if (res.data) this.form.patchValue(res.data as unknown as Record<string, unknown>);
        } else {
          this.toastr.error(res.message || 'Save failed');
        }
      },
      error: () => this.toastr.error('Server error during save'),
    });
  }
}

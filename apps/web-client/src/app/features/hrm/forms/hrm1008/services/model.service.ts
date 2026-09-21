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
      country_code:          ['', [Validators.maxLength(4)]],
      currency_code:         ['', [Validators.maxLength(4)]],
      weekend_days:          ['SAT,SUN'],
      fiscal_year_start:     ['01-01'],
      overtime_multiplier:   [1.5, [Validators.min(0)]],
      overtime_formula:      ['BASIC_SALARY / 208', [Validators.maxLength(500)]],
      daily_rate_formula:    ['GROSS_SALARY / CALENDAR_DAYS', [Validators.maxLength(500)]],
      lwp_formula:           ['DAILY_RATE * LWP_DAYS', [Validators.maxLength(500)]],
      tax_regime:            ['STANDARD', [Validators.maxLength(30)]],
      enable_provident_fund: [0],
      enable_gratuity:       [0],
      enable_festival_bonus: [0],
      maternity_weeks:       [12, [Validators.min(0)]],
    });
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.data.loadSettings().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          const d = res.data as unknown as Record<string, unknown>;
          this.form.patchValue({
            country_code:          d['country_code'] ?? '',
            currency_code:         d['currency_code'] ?? '',
            weekend_days:          d['weekend_days'] ?? 'SAT,SUN',
            fiscal_year_start:     d['fiscal_year_start'] ?? '01-01',
            overtime_multiplier:   d['overtime_multiplier'] ?? 1.5,
            overtime_formula:      d['overtime_formula'] ?? 'BASIC_SALARY / 208',
            daily_rate_formula:    d['daily_rate_formula'] ?? 'GROSS_SALARY / CALENDAR_DAYS',
            lwp_formula:           d['lwp_formula'] ?? 'DAILY_RATE * LWP_DAYS',
            tax_regime:            d['tax_regime'] ?? 'STANDARD',
            enable_provident_fund: d['enable_provident_fund'] ?? 0,
            enable_gratuity:       d['enable_gratuity'] ?? 0,
            enable_festival_bonus: d['enable_festival_bonus'] ?? 0,
            maternity_weeks:       d['maternity_weeks'] ?? 12,
          });
        }
      },
      error: () => this.toastr.error('Failed to load HR settings'),
    });
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

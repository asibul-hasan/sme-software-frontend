import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../core/services/base-data.service';
import { ApiResponse, isSuccess } from '../../core/models/response.model';

// ─── Lightweight lookup DTOs ────────────────────────────────────────────────

export interface EmployeeLookup {
  employee_no: number;
  employee_id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  full_name_with_id?: string | null;
  department_no?: number | null;
  department_name?: string | null;
  designation_no?: number | null;
  designation_name?: string | null;
  branch_no?: number | null;
  user_no?: number | null;
  mobile_number?: string | null;
  official_email?: string | null;
  is_active?: number;
}

export interface DepartmentLookup {
  department_no: number;
  department_id: string;
  department_name: string;
  parent_department_no?: number | null;
  is_active: number;
}

export interface DesignationLookup {
  designation_no: number;
  designation_id: string;
  designation_name: string;
  department_no: number;
  grade_no?: number | null;
  grade_level?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  is_active: number;
}

export interface GradeLookup {
  grade_no: number;
  grade_id?: string | null;
  grade_name: string;
  rank_order?: number | null;
  min_salary?: number | null;
  max_salary?: number | null;
}

export interface GradeStepLookup {
  grade_step_no: number;
  grade_no: number;
  step: string;
  amount: number;
}

export interface BranchLookup {
  branch_no: number;
  company_no: number;
  branch_id: string;
  branch_name: string;
  is_active: number;
}

export interface CompanyLookup {
  company_no: number;
  company_id: string;
  company_name: string;
  is_active: number;
}

export interface CurrencyLookup {
  currency_no: number;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  fraction_name: string;
  decimal_places?: number;
  number_system?: number;
  exchange_rate?: number;
  is_base_currency: number;
}


/**
 * Shared service for common lookup APIs used across different modules.
 * This service centralizes access to data that is needed by multiple features
 * but doesn't necessarily belong to a single module's primary workflow.
 */
@Injectable({
  providedIn: 'root',
})
export class CommonDataService extends BaseDataService {
  protected override readonly modulePath = ''; // Root level: /api/v1/...
  private static readonly CURRENCIES_CACHE_KEY = 'sme_currencies';

  // ─── Global Signals ────────────────────────────────────────────────────────
  readonly currencies = signal<CurrencyLookup[]>([]);
  readonly isCurrenciesLoaded = signal(false);

  // ─── Global List Loaders ───────────────────────────────────────────────────

  /**
   * Load the full currency list and cache it in localStorage.
   * Called by AppBootstrapService on login/refresh.
   */
  loadCurrencies(forceRefresh = false): void {
    if (!forceRefresh && this.restoreCurrenciesFromCache()) {
      return;
    }

    this.getCurrencyList().subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.applyCurrenciesFromBootstrap(res.data);
        } else {
          this.isCurrenciesLoaded.set(true);
        }
      },
      error: () => this.isCurrenciesLoaded.set(true),
    });
  }

  restoreCurrenciesFromCache(): boolean {
    const cached = localStorage.getItem(CommonDataService.CURRENCIES_CACHE_KEY);
    if (!cached) {
      return false;
    }

    try {
      const list = JSON.parse(cached) as CurrencyLookup[];
      this.currencies.set(list);
      this.isCurrenciesLoaded.set(true);
      return true;
    } catch {
      localStorage.removeItem(CommonDataService.CURRENCIES_CACHE_KEY);
      return false;
    }
  }

  applyCurrenciesFromBootstrap(list: CurrencyLookup[] | null | undefined): void {
    if (list) {
      this.currencies.set(list);
      try {
        localStorage.setItem(CommonDataService.CURRENCIES_CACHE_KEY, JSON.stringify(list));
      } catch { /* ignore */ }
    }
    this.isCurrenciesLoaded.set(true);
  }

  clearCurrenciesCache(): void {
    localStorage.removeItem(CommonDataService.CURRENCIES_CACHE_KEY);
    this.currencies.set([]);
    this.isCurrenciesLoaded.set(false);
  }

  // ─── HR Lookups ────────────────────────────────────────────────────────────

  getEmployeeList(filters?: {
    is_active?: number | null;
    employment_type?: number | null;
    department_no?: number | null;
  }): Observable<ApiResponse<EmployeeLookup[]>> {
    const params: Record<string, number> = {};
    if (filters) {
      if (filters.is_active != null)
        params['is_active'] = filters.is_active;
      if (filters.employment_type != null)
        params['employment_type'] = filters.employment_type;
      if (filters.department_no != null)
        params['department_no'] = filters.department_no;
    }
    return this.getList<EmployeeLookup[]>('common/lookups/employees', params);
  }

  getDepartmentList(): Observable<ApiResponse<DepartmentLookup[]>> {
    return this.getList<DepartmentLookup[]>('common/lookups/departments');
  }

  getDesignationList(): Observable<ApiResponse<DesignationLookup[]>> {
    return this.getList<DesignationLookup[]>('common/lookups/designations');
  }

  getGradeList(): Observable<ApiResponse<GradeLookup[]>> {
    return this.getList<GradeLookup[]>('common/lookups/grades');
  }

  getGradeStepList(gradeNo: number): Observable<ApiResponse<GradeStepLookup[]>> {
    return this.getList<GradeStepLookup[]>(`common/lookups/grades/${gradeNo}/steps`);
  }

  // ─── System Lookups ────────────────────────────────────────────────────────

  getBranchList(): Observable<ApiResponse<BranchLookup[]>> {
    return this.getList<BranchLookup[]>('common/lookups/branches');
  }

  getCompanyList(): Observable<ApiResponse<CompanyLookup[]>> {
    return this.getList<CompanyLookup[]>('sys/companies');
  }

  getCurrencyList(): Observable<ApiResponse<CurrencyLookup[]>> {
    return this.getList<CurrencyLookup[]>('common/lookups/currencies');
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseDataService } from '../../core/services/base-data.service';
import { ApiResponse } from '../../core/models/response.model';

// ─── Lightweight lookup DTOs ────────────────────────────────────────────────

export interface EmployeeLookup {
  employee_no: number;
  employee_id: string;
  first_name: string;
  last_name?: string | null;
  full_name?: string | null;
  department_no?: number | null;
  department_name?: string | null;
  designation_no?: number | null;
  designation_name?: string | null;
  branch_no?: number | null;
  mobile_number?: string | null;
  official_email?: string | null;
  is_active: number;
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
  is_active: number;
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

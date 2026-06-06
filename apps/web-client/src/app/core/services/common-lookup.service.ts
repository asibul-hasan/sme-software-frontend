import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { ApiResponse } from '../models/response.model';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

/** Lean employee row for any employee-picker dropdown. */
export interface EmployeeLookupDto {
  employee_no:       number;
  employee_id:       string;
  /** First + middle + last name joined. */
  full_name:         string;
  /** "{employee_id} — {full_name}" — preferred label for search dropdowns. */
  full_name_with_id: string;
  department_name:   string | null;
  designation_name:  string | null;
  /** Linked user account, or null when the employee has no login. */
  user_no:           number | null;
}

/** Lean branch row for any branch-picker dropdown. */
export interface BranchLookupDto {
  branch_no:     number;
  branch_id:     string;
  branch_name:   string;
  branch_type:   string | null;
  is_main_branch: number;
}

/** Lean department row for any department-picker dropdown. */
export interface DepartmentLookupDto {
  department_no:   number;
  department_id:   string;
  department_name: string;
}

/** Lean designation row for any designation-picker dropdown. */
export interface DesignationLookupDto {
  designation_no:   number;
  designation_id:   string;
  designation_name: string;
  department_no:    number;
}

/** Uniform option for the generic master lists (currencies, products, suppliers, …): no=value, name=label. */
export interface LookupOption {
  no:   number;
  code: string | null;
  name: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Cross-form common lookup service.
 *
 * Calls `GET /api/v1/common/lookups/{resource}` — a single backend endpoint
 * that serves every form needing a standard picker.  Company/branch scoping
 * is handled server-side from the JWT; no scope params are sent by the client.
 *
 * ### Usage
 * ```ts
 * private lookup = inject(CommonLookupService);
 *
 * employees = toSignal(this.lookup.getEmployees(), { initialValue: [] });
 * branches  = toSignal(this.lookup.getBranches(),  { initialValue: [] });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CommonLookupService {
  private http   = inject(HttpClient);
  private config = inject(AppConfigService);

  private get base(): string {
    return `${this.config.apiUrl}/common/lookups`;
  }

  /** Active employees across the caller's company — use `full_name_with_id` as dropdown label. */
  getEmployees(): Observable<EmployeeLookupDto[]> {
    return this.http
      .get<ApiResponse<EmployeeLookupDto[]>>(`${this.base}/employees`)
      .pipe(map(r => r.data ?? []));
  }

  /** Active branches of the caller's company. */
  getBranches(): Observable<BranchLookupDto[]> {
    return this.http
      .get<ApiResponse<BranchLookupDto[]>>(`${this.base}/branches`)
      .pipe(map(r => r.data ?? []));
  }

  /** Active departments of the caller's current branch. */
  getDepartments(): Observable<DepartmentLookupDto[]> {
    return this.http
      .get<ApiResponse<DepartmentLookupDto[]>>(`${this.base}/departments`)
      .pipe(map(r => r.data ?? []));
  }

  /**
   * Active designations of the caller's current branch.
   * @param departmentNo — optional; narrows to a single department (cascading selects).
   */
  getDesignations(departmentNo?: number): Observable<DesignationLookupDto[]> {
    const params: Record<string, string> | undefined =
      departmentNo != null ? { departmentNo: String(departmentNo) } : undefined;
    return this.http
      .get<ApiResponse<DesignationLookupDto[]>>(`${this.base}/designations`, { params })
      .pipe(map(r => r.data ?? []));
  }

  // ── Generic master lists (uniform LookupOption: no / code / name) ──────────────

  private generic(resource: string): Observable<LookupOption[]> {
    return this.http
      .get<ApiResponse<LookupOption[]>>(`${this.base}/${resource}`)
      .pipe(map(r => r.data ?? []));
  }

  getCurrencies(): Observable<LookupOption[]> { return this.generic('currencies'); }
  getWarehouses(): Observable<LookupOption[]> { return this.generic('warehouses'); }
  getProducts():   Observable<LookupOption[]> { return this.generic('products'); }
  getUoms():       Observable<LookupOption[]> { return this.generic('uoms'); }
  getAccounts():   Observable<LookupOption[]> { return this.generic('accounts'); }
  getSuppliers():  Observable<LookupOption[]> { return this.generic('suppliers'); }
  getCustomers():  Observable<LookupOption[]> { return this.generic('customers'); }
}

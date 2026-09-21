/**
 * Common API Response and Pagination Models
 */

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly message?: string;
  readonly data?: T;
  readonly errors?: readonly string[];
  readonly timestamp?: string;
}

export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

export interface QueryFilter {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend' | null;
  startDate?: string;
  endDate?: string;
  status?: number;
  pharmacy_no?: number;
}

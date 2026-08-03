/**
 * Transactional SQL State for ERP batch processing.
 *
 * 0 = Unchanged: Existing row, untouched.
 * 1 = Insert:    Newly added row, needs backend INSERT.
 * 2 = Update:    Existing row modified, needs backend UPDATE.
 * 3 = Delete:    Existing row marked deleted, needs backend DELETE.
 */
export enum SqlRowState {
  Unchanged = 0,
  Insert = 1,
  Update = 2,
  Delete = 3,
}

/**
 * Wrapper object carrying transactional metadata around the domain row T.
 */
export interface ErpGridRowWrapper<T = any> {
  __uid: string;
  __sqlState: SqlRowState;
  __isDirty: boolean;
  __errors: Record<string, string>;
  data: T;
}

/**
 * Batch payload returned by gridApi.getDirtyRows() for backend bulk APIs.
 */
export interface GridBatchPayload<T = any> {
  inserted: T[];
  updated: T[];
  deleted: T[];
  hasErrors: boolean;
}

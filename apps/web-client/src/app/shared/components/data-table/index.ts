// ═══════════════════════════════════════════════════════════════════
//  DATA-TABLE LIBRARY  ·  Public API
//  Import everything from here: import { ... } from './data-table'
// ═══════════════════════════════════════════════════════════════════

// Core component
export { DataTableComponent } from './core/data-table.component';

// Types
export type {
  RowData,
  ColumnDef,
  ColumnType,
  SelectOption,
  ValidationRule,
  TableConfig,
  TableState,
  SortState,
  PaginationState,
  RowEvent,
  ExportOptions,
  CellValidation,
  ValidationMap,
} from './types/data-table.types';
export { SqlState } from './types/data-table.types';

// Pipes (if you need to use in other templates)
export { CellDisplayPipe } from './pipes/cell-display.pipe';

// Utils (for external use / testing)
export { exportCSV, exportXLSX, exportPDF } from './utils/export.util';
export {
  validateCell,
  validateRow,
  isValidationMapClean,
} from './utils/validation.util';
export { runPipeline } from './utils/pipeline.util';
export {
  stampRows,
  createBlankRow,
  duplicateRow,
  markRowDeleted,
  revertRow,
  applyEdit,
  newRowId,
} from './utils/row.util';

// Constants
export {
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_DENSITY_INDEX,
  DEFAULT_CURRENCY_CODE,
  DENSITY_CYCLE,
  SORT_ICONS,
} from './constants/data-table.constants';

import {
  Component, ChangeDetectionStrategy, input, output, effect, inject, OnInit, OnDestroy, ViewChild, ContentChildren, QueryList, TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, CellValueChangedEvent, SelectionChangedEvent } from 'ag-grid-community';

import { GridFullConfig, ColumnConfig, GridRowData } from '../models/grid-types';
import { SqlRowState } from '../models/grid-row-state.enum';
import { GridApiService } from '../services/grid-api.service';
import { GridStateService } from '../services/grid-state.service';
import { GridValidationService } from '../services/grid-validation.service';
import { GridExportService } from '../services/grid-export.service';
import { DEFAULT_ERP_GRID_OPTIONS } from '../utils/grid-defaults';
import { matchLookupOption, resolveLookupOptions } from '../utils/lookup-options';
import { ActionCellRendererComponent } from '../renderers/action-cell-renderer.component';
import { StatusCellRendererComponent } from '../renderers/status-cell-renderer.component';
import { SelectCellEditorComponent } from '../editors/select-cell-editor.component';
import { GridCellDirective } from '../directives/grid-cell.directive';
import { GridToolbarComponent } from './grid-toolbar.component';
import { GridStatusBarComponent } from './grid-status-bar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-grid',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    GridToolbarComponent,
    GridStatusBarComponent,
  ],
  providers: [GridApiService],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnInit, OnDestroy {
  public gridApiService = inject(GridApiService);
  private gridStateService = inject(GridStateService);
  private validationService = inject(GridValidationService);
  private gridExportService = inject(GridExportService);

  @ViewChild('agGrid') agGrid!: AgGridAngular;
  @ContentChildren(GridCellDirective) cellDirectives!: QueryList<GridCellDirective>;

  config = input.required<GridFullConfig>();
  data = input<GridRowData[]>([]);
  height = input<string>('400px');
  loading = input<boolean>(false);

  ready = output<GridApiService>();
  rowClick = output<GridRowData>();
  rowChange = output<GridRowData>();

  public gridOptions = {
    ...DEFAULT_ERP_GRID_OPTIONS,
    context: { gridApiService: this.gridApiService }
  };
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public searchValue = '';
  public gridApi?: GridApi;
  public projectedTemplates: Map<string, TemplateRef<any>> = new Map();

  constructor() {
    effect(() => {
      const list = this.data();
      const cfg = this.config();
      this.gridApiService.setRows(list as any[], cfg.rowIdField);
    });

    effect(() => {
      const wrappers = this.gridApiService.rows();
      this.rowData = wrappers
        .filter((w) => w.__sqlState !== SqlRowState.Delete)
        .map((w) => ({
          ...w.data,
          __uid: w.__uid,
          __sqlState: w.__sqlState,
          __errors: w.__errors,
        }));
    });
  }

  ngOnInit(): void {
    this.buildColumns();
  }

  ngAfterContentInit(): void {
    if (this.cellDirectives) {
      this.cellDirectives.forEach((dir) => {
        this.projectedTemplates.set(dir.name(), dir.templateRef);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.gridApi && this.config().gridId) {
      this.gridStateService.saveState(this.config().gridId, this.gridApi);
    }
  }

  private buildColumns(): void {
    const cfg = this.config();
    const cols: ColDef[] = [];

    for (const c of cfg.columns) {
      if (c.type === 'status') {
        cols.push({
          field: '__sqlState',
          headerName: c.headerName ?? 'Status',
          width: c.width ?? 110,
          pinned: c.pinned ?? 'left',
          cellRenderer: StatusCellRendererComponent,
          sortable: false,
          filter: false,
        });
      } else if (c.type === 'actions' || c.type === 'remove') {
        cols.push({
          field: c.field,
          headerName: c.headerName ?? 'Actions',
          width: c.width ?? 100,
          pinned: c.pinned ?? 'right',
          cellRenderer: ActionCellRendererComponent,
          sortable: false,
          filter: false,
        });
      } else {
        const isNumeric = c.type === 'number' || c.type === 'decimal' || c.type === 'currency' || c.align === 'right';
        const isEditable = c.isEditable ?? !!cfg.editableConfig;

        const colDef: ColDef = {
          field: c.field,
          headerName: c.headerName,
          width: c.width,
          minWidth: c.minWidth,
          maxWidth: c.maxWidth,
          flex: c.flex,
          editable: typeof isEditable === 'function' ? (params: any) => (isEditable as Function)(params.value, params.data) : isEditable,
          pinned: c.pinned,
          sortable: true,
          filter: true,
          cellClass: isNumeric ? 'text-end' : undefined,
          cellClassRules: {
            'bg-danger-subtle text-danger font-semibold': (params) => !!params.data?.__errors?.[params.colDef.field as string],
          },
          valueFormatter: c.valueFn ? (params) => c.valueFn!(params.data) : undefined,
        };

        if (c.type === 'template' && c.templateName) {
          colDef.cellRenderer = (params: any) => {
            const tpl = this.projectedTemplates.get(c.templateName!);
            if (!tpl) return params.value ?? '';
            return params.value ?? '';
          };
        } else if (c.type === 'select') {
          colDef.cellEditor = SelectCellEditorComponent;
          colDef.cellEditorParams = { options: c.options };
          colDef.cellEditorPopup = true;
          // 'over' — the editor replaces the cell; 'under' shows the cell text and the
          // editor at the same time, which reads as a duplicated value.
          colDef.cellEditorPopupPosition = 'over';
          // Show the option label, not the stored code. Shares the editor's matching so a
          // code persisted as a string still resolves against a numeric option.
          colDef.valueFormatter = (params) => {
            const opts = resolveLookupOptions(c.options, params.data);
            return matchLookupOption(opts, params.value)?.label ?? (params.value ?? '');
          };
        } else if (c.type === 'number' || c.type === 'decimal' || c.type === 'currency') {
          colDef.cellEditor = 'agNumberCellEditor';
          colDef.valueParser = (params) => (params.newValue != null && params.newValue !== '' ? Number(params.newValue) : null);
          if (c.type === 'currency' && !c.valueFn) {
            colDef.valueFormatter = (params) => (params.value != null ? Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
          }
        }

        cols.push(colDef);
      }
    }

    this.columnDefs = cols;
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.gridApiService.setApi(event.api);
    this.gridOptions.context = { gridApiService: this.gridApiService };

    if (this.config().gridId) {
      this.gridStateService.restoreState(this.config().gridId, event.api);
    }

    this.ready.emit(this.gridApiService);
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    if (!event.data || !event.data.__uid) return;
    const field = event.colDef.field;
    if (!field) return;

    // 1. Update Cell Value in API Service
    this.gridApiService.updateCellValue(event.data.__uid, field, event.newValue);

    // 2. Custom edit handler from colDef.isEditable if it's a function
    const colConfig = this.config().columns.find((c) => c.field === field);
    if (colConfig && typeof colConfig.isEditable === 'function') {
      (colConfig.isEditable as Function)(event.newValue, event.data);
    }

    // 3. Row recalculation cascade if configured
    const editCfg = this.config().editableConfig;
    if (editCfg?.recalculate) {
      editCfg.recalculate(event.data);
      this.rowChange.emit(event.data);
    }

    this.gridApiService.refreshView();
  }

  onSelectionChanged(event: SelectionChangedEvent): void {
    const selectedNodes = event.api.getSelectedNodes();
    const uids = selectedNodes.map((n) => n.data?.__uid).filter(Boolean);
    this.gridApiService.selectedUids.set(uids);
  }

  onRowClicked(event: any): void {
    if (event.data) {
      this.rowClick.emit(event.data);
    }
  }

  onSearchChange(text: string): void {
    this.searchValue = text;
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', text);
    }
  }

  onAddRow(): void {
    const editCfg = this.config().editableConfig;
    const defaults = editCfg?.newRowDefaults ? editCfg.newRowDefaults() : {};
    this.gridApiService.addRow(defaults as any);
  }

  onDeleteSelected(): void {
    const uids = this.gridApiService.selectedUids();
    for (const uid of uids) {
      this.gridApiService.deleteRow(uid);
    }
  }

  onExportExcel(): void {
    if (this.gridApi) {
      this.gridExportService.exportToExcel(this.gridApi, `${this.config().gridId || 'grid'}.csv`);
    }
  }

  onResetLayout(): void {
    if (this.gridApi && this.config().gridId) {
      this.gridStateService.resetState(this.config().gridId, this.gridApi);
    }
  }

  getInsertedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Insert).length;
  }

  getUpdatedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Update).length;
  }

  getDeletedCount(): number {
    return this.gridApiService.rows().filter((r) => r.__sqlState === SqlRowState.Delete).length;
  }
}

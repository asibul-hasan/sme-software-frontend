import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ErpGridComponent } from '../../../../shared/ag-grid/components/erp-grid.component';
import {
  GridConfig,
  GridLookupOption,
} from '../../../../shared/ag-grid/models/grid-config.model';
import { GridColumns } from '../../../../shared/ag-grid/utils/column-builder';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1301DataService } from './services/data.service';
import {
  IdGeneratorRowVM,
  Sys1301ModelService,
} from './services/model.service';

/**
 * SYS_1301 — ID Generator.
 *
 * Grid-only form: filter card (Module / Submodule / Form) at the top, one
 * `<app-erp-grid>` below. Every row configures one document-numbering pattern
 * that {@code IdPatternResolver} on the backend can materialise into concrete
 * ids (e.g. `SL-NYC-26-27-0001`).
 *
 * External row state: the model owns the rows so the cascading Module ⇄
 * Submodule ⇄ Form pickers stay in one place, and the client-side preview
 * cell can be recomputed on every edit without the grid owning derived data.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1301',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    NgSelectModule,
    PageFormLayoutComponent,
    ErpGridComponent,
  ],
  providers: [Sys1301ModelService, Sys1301DataService],
  templateUrl: './sys1301.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class Sys1301Component implements OnInit {
  public model = inject(Sys1301ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  readonly rows = computed(() => this.model.visibleRows());

  /** Chip list shown under the pattern textbox — pulls from constants so
      docs and code stay in sync. */
  readonly supportedTokens = sysConstants.docPatternTokens;

  /**
   * Built once and kept `readonly`. Every lookup that changes reactively is
   * passed as a FUNCTION so the columns never need rebuilding — see CLAUDE.md
   * "AG Grid — Columns" section for the contract.
   */
  readonly grid: GridConfig<IdGeneratorRowVM> = {
    gridKey: 'SYS_1301_ID_GEN_GRID',
    externalRowState: true,
    selectionMode: 'single',
    autoSelectFirstRow: false,
    rowIdField: '__uid',
    height: '100%',
    showPagination: true,
    pageSize: 50,
    pageSizeOptions: [25, 50, 100, 500],
    canAdd:       () => this.permissionService.canInsert(),
    canEdit:      () => this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      title: 'ID Generation Patterns',
      showAdd: true,
      showDelete: false,
      showSearch: true,
      showExport: true,
      showColumnChooser: true,
      searchPlaceholder: 'Search patterns...',
    },
    columns: [
      GridColumns.lookup<IdGeneratorRowVM>('module_no', 'Module', () =>
        this.opts(this.model.moduleOptions()),
      )
        .flex(1)
        .minWidth(140)
        .build(),
      GridColumns.lookup<IdGeneratorRowVM>('submodule_no', 'Submodule', () =>
        this.opts(this.model.submoduleOptions()),
      )
        .flex(1)
        .minWidth(140)
        .build(),
      GridColumns.lookup<IdGeneratorRowVM>('menu_no', 'Form', () =>
        this.model.filteredMenuOptions().map((m) => ({
          value: m.menu_no,
          label: `${m.form_name} (${m.form_id})`,
        })) as GridLookupOption[],
      )
        .flex(2)
        .minWidth(220)
        .required()
        .build(),
      GridColumns.text<IdGeneratorRowVM>('doc_sub_type', 'Sub-Type')
        .width(120)
        .build(),
      GridColumns.text<IdGeneratorRowVM>('pattern', 'Pattern')
        .flex(2)
        .minWidth(220)
        .required()
        .build(),
      GridColumns.number<IdGeneratorRowVM>('starting_no', 'Start #')
        .width(90)
        .build(),
      GridColumns.select<IdGeneratorRowVM>(
        'reset_policy',
        'Reset',
        sysConstants.docResetPolicies as GridLookupOption[],
      )
        .width(150)
        .build(),
      GridColumns.lookup<IdGeneratorRowVM>('fin_year_no', 'Fin Year', () =>
        this.opts(this.model.finYearOptions()),
      )
        .width(140)
        .build(),
      GridColumns.text<IdGeneratorRowVM>('preview_display', 'Preview')
        .flex(1)
        .minWidth(180)
        .build(),
      GridColumns.checkbox<IdGeneratorRowVM>('is_active', 'Active')
        .width(90)
        .build(),
      GridColumns.action<IdGeneratorRowVM>().build(),
    ],
  };

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1301');
    this.model.loadLookups();
    this.model.loadList();
  }

  private opts(list: { value: number; label: string }[]): GridLookupOption[] {
    return list as GridLookupOption[];
  }

  // ── Grid intent ─────────────────────────────────────────────────────────
  onAddRow(): void {
    this.model.addRow();
  }

  onRowChange(row: IdGeneratorRowVM): void {
    this.model.updateRow(row.__uid, row);
  }

  onRowRemove(row: IdGeneratorRowVM): void {
    this.model.deleteRow(row.__uid);
  }

  // ── Filters ─────────────────────────────────────────────────────────────
  onFilterModule(value: number | null): void {
    this.model.applyFilters({ module: value });
  }
  onFilterSubmodule(value: number | null): void {
    this.model.applyFilters({ submodule: value });
  }
  onFilterMenu(value: number | null): void {
    this.model.applyFilters({ menu: value });
  }
  clearFilters(): void {
    this.model.clearFilters();
  }

  // ── Page actions ────────────────────────────────────────────────────────
  onSearchTermChange(value: string): void {
    this.model.searchTerm.set(value);
  }

  onNew(): void {
    this.onAddRow();
  }

  onSave(): void {
    this.alertService
      .confirm('Save all ID generator patterns?', 'Save Confirmation')
      .subscribe((ok) => {
        if (ok) this.model.onSave();
      });
  }

  onReset(): void {
    this.model.loadList();
  }
}

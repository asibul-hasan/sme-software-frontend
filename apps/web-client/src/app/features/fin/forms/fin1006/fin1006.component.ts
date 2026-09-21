import { Component, ChangeDetectionStrategy, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';

import { Fin1006ModelService, GlMap } from './services/model.service';
import { Fin1006DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1006',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Fin1006ModelService, Fin1006DataService],
  templateUrl: './fin1006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1006Component implements OnInit {
  @ViewChild('erpGrid') erpGrid?: ErpGridComponent;

  public model             = inject(Fin1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly glEventTypes = finConstants.glEventTypes;

  readonly gridConfig: GridConfig<GlMap> = {
    gridKey: 'FIN_1006_GL_MAP_GRID',
    rowIdField: 'gl_map_no',
    showPagination: true,
    pageSize: 25,
    selectionMode: 'none',
    externalRowState: true,
    canAdd: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canEdit: () => this.permissionService.canInsert() || this.permissionService.canUpdate(),
    canDeleteRow: () => this.permissionService.canDelete(),
    toolbar: {
      showSearch: true,
      searchPlaceholder: 'Search mappings...',
      showAdd: false,
    },
    columns: [
      GridColumns.select<GlMap>('event_type', 'Event Type', finConstants.glEventTypes as any[]).minWidth(240).build(),
      GridColumns.select<GlMap>('leg_key', 'Leg Key', finConstants.glLegKeys as any[]).minWidth(150).build(),
      GridColumns.text<GlMap>('sub_key', 'Sub Key').minWidth(120).build(),
      GridColumns.lookup<GlMap>('account_no', 'GL Account', () => this.model.accountOptions()).minWidth(350).build(),
      GridColumns.checkbox<GlMap>('is_active', 'Active').width(80).align('center').build(),
      GridColumns.action<GlMap>().build()
    ]
  };

  ngOnInit(): void {
    setTimeout(() => {
      this.permissionService.useLocalPermissions('FIN_1006');
      this.model.loadAccounts();
      this.model.load();
    });
  }

  onSearchTermChange(v: string): void {
    this.model.searchTerm.set(v);
    this.model.pager.reset();
  }

  onEventTypeFilterChange(v: string | null): void {
    this.model.eventTypeFilter.set(v || null);
    this.model.pager.reset();
  }

  onAddRow(): void {
    this.model.addRow();
    setTimeout(() => {
      const count = this.model.filtered().length;
      if (count > 0 && this.erpGrid) {
        this.erpGrid.editRow(count - 1);
      }
    }, 50);
  }

  onSave(): void {
    if (this.erpGrid) {
      this.erpGrid.stopEditing();
      const currentRows = this.erpGrid.getRows() as GlMap[];
      for (const r of currentRows) {
        this.model.updateRow(r);
      }
      this.model.saveAll(currentRows);
      return;
    }
    this.model.saveAll();
  }

  onReset(): void {
    if (this.erpGrid) {
      this.erpGrid.stopEditing(true);
    }
    this.model.load();
  }

  onRowChange(row: GlMap): void {
    this.model.updateRow(row);
  }

  onRowRemove(row: GlMap): void {
    if (!row.gl_map_no) {
      this.model.deleteRow(row);
      return;
    }
    this.alertService.deleteConfirm().subscribe(ok => {
      if (ok) this.model.deleteRow(row);
    });
  }
}

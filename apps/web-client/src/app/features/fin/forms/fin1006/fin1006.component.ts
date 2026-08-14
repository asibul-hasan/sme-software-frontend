import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
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
  public model             = inject(Fin1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly glEventTypes = finConstants.glEventTypes;


  readonly gridConfig: GridConfig<GlMap> = {
    gridKey: 'FIN_1006_GL_MAP_GRID',
    rowIdField: 'gl_map_no',
    showPagination: true,
    pageSize: 25,
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

  onSave(): void {
    this.model.saveAll();
  }

  onRowChange(row: GlMap): void {
    (row as any).__dirty = true;
  }

  onRowRemove(row: GlMap): void {
    this.alertService.deleteConfirm().subscribe(ok => {
      if (ok) this.model.deleteRow(row);
    });
  }
}

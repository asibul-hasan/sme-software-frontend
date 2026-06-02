import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1103ModelService } from './services/model.service';
import { Sys1103DataService } from './services/data.service';

/**
 * SYS1103 – Role Permission Matrix. Pick a company role, then grant per-form
 * can_view/insert/update/delete/approve/post/cancel/export + scope + record-filter.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1103',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1103ModelService, Sys1103DataService],
  templateUrl: './sys1103.component.html',
  styleUrls: ['./sys1103.component.scss'],
})
export class Sys1103Component implements OnInit {
  public model = inject(Sys1103ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1103');
    this.model.loadRoles();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    this.model.reloadCurrent();
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1107ModelService } from './services/model.service';
import { Sys1107DataService } from './services/data.service';

/**
 * SYS1107 – User-Company Mapping. Grant a user access to additional companies.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1107',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1107ModelService, Sys1107DataService],
  templateUrl: './sys1107.component.html',
  styles: [],
})
export class Sys1107Component implements OnInit {
  public model = inject(Sys1107ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1107');
    this.model.loadInitial();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    this.model.reloadCurrent();
  }
}

import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1104ModelService } from './services/model.service';
import { Sys1104DataService } from './services/data.service';

/**
 * SYS1104 – User-Branch Mapping. Assign a user to branches with a role per branch.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1104',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1104ModelService, Sys1104DataService],
  templateUrl: './sys1104.component.html',
  styles: [],
})
export class Sys1104Component implements OnInit {
  public model = inject(Sys1104ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1104');
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

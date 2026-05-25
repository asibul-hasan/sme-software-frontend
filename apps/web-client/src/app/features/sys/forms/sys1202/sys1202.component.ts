import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1202ModelService } from './services/model.service';
import { Sys1202DataService } from './services/data.service';

/**
 * SYS1202 – Menu Enrollment. Grant a client company the menus (forms) it has purchased.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1202',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1202ModelService, Sys1202DataService],
  templateUrl: './sys1202.component.html',
  styles: [],
})
export class Sys1202Component implements OnInit {
  public model = inject(Sys1202ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1202');
    this.model.loadCompanies();
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

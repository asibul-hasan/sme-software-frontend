import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { activeStatusOptions, yesNoOptions } from '../../../../core/constants/common-options.constants';
import { Sys1108ModelService } from './services/model.service';
import { Sys1108DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1108',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1108ModelService, Sys1108DataService],
  templateUrl: './sys1108.component.html',
  styles: [],
})
export class Sys1108Component implements OnInit {
  public model = inject(Sys1108ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  readonly activeStatusOptions = activeStatusOptions;
  readonly yesNoOptions = yesNoOptions;

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('SYS_1108');
    this.model.loadRoleOptions();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSave(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.workflow_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this approval rule?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { activeStatusOptions } from '../../../../core/constants/common-options.constants';
import { Sys1101ModelService } from './services/model.service';
import { Sys1101DataService } from './services/data.service';
import { LoginInfoDialogComponent } from './components/login-info-dialog/login-info-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1101',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Sys1101ModelService, Sys1101DataService],
  templateUrl: './sys1101.component.html',
  styles: [],
})
export class Sys1101Component implements OnInit {
  public model = inject(Sys1101ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);
  private dialogService = inject(DialogService);
  readonly activeStatusOptions = activeStatusOptions;

  openLoginInfoModal(): void {
    this.dialogService.open(LoginInfoDialogComponent, {
      size: 'lg',
      data: { model: this.model },
    }).subscribe();
  }

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1101');
    this.model.initForm();
    this.setDefaultValues();
  }

  setDefaultValues() {
    this.model.filterDeptNo.set(null);
    this.model.filterDesigNo.set(null);
    this.model.filterUserStatus.set(1);
    this.model.loadInitial();
  }

  onSave(): void {
    this.model.onSave();
  }
  onSaveLoginInfo(): void {
    this.model.onSave();
  }
  onNew(): void {
    this.model.onNew();
  }
  onReset(): void {
    this.model.onReset();
  }

  onDelete(): void {
    if (!this.model.selectedUserNo()) return;
    this.alertService.deleteConfirm('Delete this user?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

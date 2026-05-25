import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Sys1201ModelService } from './services/model.service';
import { Sys1201DataService } from './services/data.service';

/**
 * SYS1201 – Dynamic Menu Builder. Vendor editor for the global catalog
 * (modules → submodules → menus).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1201',
  standalone: true,
  imports: [SharedModule, CommonModule, FormsModule],
  providers: [Sys1201ModelService, Sys1201DataService],
  templateUrl: './sys1201.component.html',
  styles: [],
})
export class Sys1201Component implements OnInit {
  public model = inject(Sys1201ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1201');
    this.model.loadAll();
  }

  confirmDeleteModule(no: number): void {
    this.alertService.deleteConfirm('Delete this module?').subscribe((ok) => { if (ok) this.model.deleteModule(no); });
  }
  confirmDeleteSubmodule(no: number): void {
    this.alertService.deleteConfirm('Delete this submodule?').subscribe((ok) => { if (ok) this.model.deleteSubmodule(no); });
  }
  confirmDeleteMenu(no: number): void {
    this.alertService.deleteConfirm('Delete this menu?').subscribe((ok) => { if (ok) this.model.deleteMenu(no); });
  }
}

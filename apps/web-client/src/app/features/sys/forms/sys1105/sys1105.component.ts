import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sys1105ModelService } from './services/model.service';
import { Sys1105DataService } from './services/data.service';

/**
 * SYS1105 – Activity Log Viewer. Read-only, filtered view over sys_audit_log.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1105',
  standalone: true,
  imports: [SharedModule, CommonModule, FormsModule],
  providers: [Sys1105ModelService, Sys1105DataService],
  templateUrl: './sys1105.component.html',
  styles: [],
})
export class Sys1105Component implements OnInit {
  public model = inject(Sys1105ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1105');
    this.model.search();
  }
}

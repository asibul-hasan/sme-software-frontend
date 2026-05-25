import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Sys1109ModelService } from './services/model.service';
import { Sys1109DataService } from './services/data.service';

/**
 * SYS1109 – Session/Login Monitor. Read-only views of active sessions and login attempts,
 * with an admin force-logout (single-session revoke).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1109',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [Sys1109ModelService, Sys1109DataService],
  templateUrl: './sys1109.component.html',
  styles: [],
})
export class Sys1109Component implements OnInit {
  public model = inject(Sys1109ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SYS_1109');
    this.model.loadSessions();
  }

  setTab(tab: 'sessions' | 'attempts'): void {
    this.model.activeTab.set(tab);
    if (tab === 'sessions' && this.model.sessions().length === 0) this.model.loadSessions();
    if (tab === 'attempts' && this.model.attempts().length === 0) this.model.loadAttempts();
  }

  onRevoke(sessionNo: number): void {
    this.alertService.deleteConfirm('Force-logout this session?').subscribe((ok) => {
      if (ok) this.model.revoke(sessionNo);
    });
  }
}

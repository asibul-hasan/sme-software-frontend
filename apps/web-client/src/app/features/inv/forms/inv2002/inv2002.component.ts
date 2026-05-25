import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv2002ModelService } from './services/model.service';
import { Inv2002DataService } from './services/data.service';

/** INV_2002 Rack/Shelf Setup — bins under a selected warehouse. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2002',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [Inv2002ModelService, Inv2002DataService],
  templateUrl: './inv2002.component.html',
  styles: [],
})
export class Inv2002Component implements OnInit {
  public model = inject(Inv2002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2002');
    this.model.loadWarehouses();
  }

  onDelete(): void {
    if (!this.model.selectedRackNo()) return;
    this.alertService.deleteConfirm('Delete this rack?').subscribe((ok) => {
      if (ok) this.model.onDelete();
    });
  }
}

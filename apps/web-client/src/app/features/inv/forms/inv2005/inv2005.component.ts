import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Inv2005ModelService } from './services/model.service';
import { Inv2005DataService } from './services/data.service';

/** INV_2005 Reorder Level — per-warehouse reorder policy grid. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2005',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [Inv2005ModelService, Inv2005DataService],
  templateUrl: './inv2005.component.html',
  styles: [],
})
export class Inv2005Component implements OnInit {
  public model = inject(Inv2005ModelService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('INV_2005');
    this.model.loadOptions();
  }
}

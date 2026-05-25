import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv1002ModelService } from './services/model.service';
import { Inv1002DataService } from './services/data.service';

/** INV_1002 Barcode Generator — manage and print barcodes for a product. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv1002',
  standalone: true,
  imports: [SharedModule, CommonModule],
  providers: [Inv1002ModelService, Inv1002DataService],
  templateUrl: './inv1002.component.html',
  styles: [],
})
export class Inv1002Component implements OnInit {
  public model = inject(Inv1002ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_1002');
    this.model.loadLookups();
  }

  onDelete(barcodeNo: number): void {
    this.alertService.deleteConfirm('Delete this barcode?').subscribe((ok) => {
      if (ok) this.model.onDelete(barcodeNo);
    });
  }
}

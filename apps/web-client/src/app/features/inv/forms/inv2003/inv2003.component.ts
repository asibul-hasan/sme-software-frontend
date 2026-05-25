import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Inv2003ModelService } from './services/model.service';
import { Inv2003DataService } from './services/data.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-inv2003',
  standalone: true,
  imports: [SharedModule, CommonModule, PageFormLayoutComponent],
  providers: [Inv2003ModelService, Inv2003DataService],
  templateUrl: './inv2003.component.html',
  styles: [],
})
export class Inv2003Component implements OnInit {
  public model = inject(Inv2003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService = inject(AlertService);

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.useLocalPermissions('INV_2003');
    this.model.loadLookups();
    this.model.loadList();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
    this.model.pager.reset();
  }
  onSave(): void { this.model.onSaveDraft(); }
  onNew(): void { this.model.onNew(); }
  onReset(): void {
    const no = this.model.selectedNo();
    const item = this.model.items().find((x) => x.transfer_no === no);
    item ? this.model.select(item) : this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm('Delete this draft transfer?').subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  onSubmit(): void { this.model.onSubmit(); }
  onDispatch(): void {
    this.alertService.deleteConfirm('Dispatch this transfer? Stock moves to transit.').subscribe((ok) => { if (ok) this.model.onDispatch(); });
  }
  onReceive(): void {
    this.alertService.deleteConfirm('Receive this transfer into the destination warehouse?').subscribe((ok) => { if (ok) this.model.onReceive(); });
  }
  onCancel(): void {
    this.alertService.deleteConfirm('Cancel this transfer?').subscribe((ok) => { if (ok) this.model.onCancel(); });
  }
}

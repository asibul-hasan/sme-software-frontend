import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Fin1001ModelService, Account } from './services/model.service';
import { Fin1001DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finConstants } from '../../constants/fin.constants';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1001',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Fin1001ModelService, Fin1001DataService],
  templateUrl: './fin1001.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1001Component implements OnInit {
  public model             = inject(Fin1001ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly drCr         = finConstants.drCr;
  readonly controlTypes = finConstants.controlTypes;

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1001'); this.model.loadGroups(); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }
  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void {
    const o = this.model.accounts().find((a) => a.account_no === this.model.selectedNo());
    if (o) this.model.select(o); else this.model.onNew();
  }
  onDelete(): void {
    if (!this.model.selectedNo()) return;
    this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); });
  }
  select(item: Account): void { this.model.select(item); }
  toUpper(c: string): void { const ctrl = this.formdata.get(c); if (ctrl?.value) ctrl.setValue(ctrl.value.toUpperCase(), { emitEvent: false }); }

  controlLabel(v?: number | null): string { return this.controlTypes.find((c) => c.value === v)?.label ?? ''; }
}

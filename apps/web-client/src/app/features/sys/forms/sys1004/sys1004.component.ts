import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1004ModelService, Currency } from './services/model.service';
import { Sys1004DataService } from './services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-sys1004',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Sys1004ModelService, Sys1004DataService, DatePipe],
  templateUrl: './sys1004.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Sys1004Component implements OnInit {
  public model             = inject(Sys1004ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);
  public dialog            = inject(MatDialog);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS   = sysConstants;

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.loadPermissions('SYS_1004').subscribe();
    this.model.loadBranches();
    this.model.loadCurrencies();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  /** Expose form to template */
  get formdata() { return this.model.form; }

  onSave(): void  { this.model.onSave(); }
  onNew(): void   { this.model.onNew(); }

  onReset(): void {
    if (this.model.selectedCurrencyNo()) {
      const original = this.model
        .currencies()
        .find((c) => c.currency_no === this.model.selectedCurrencyNo());
      if (original) this.model.selectCurrency(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedCurrencyNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  selectCurrency(currency: Currency, index: number): void {
    this.model.selectCurrency(currency, index);
  }

  viewRateHistory(): void {
    const code = this.model.form.get('currency_code')?.value ?? '';
    this.model.viewRateHistory(code);
  }
}

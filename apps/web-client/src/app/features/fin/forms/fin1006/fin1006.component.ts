import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { Fin1006ModelService, GlMap } from './services/model.service';
import { Fin1006DataService } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1006',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Fin1006ModelService, Fin1006DataService],
  templateUrl: './fin1006.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1006Component implements OnInit {
  public model             = inject(Fin1006ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly eventTypes = ['PayrollPosted', 'PurchaseInvoicePosted', 'SupplierPaymentPosted', 'SalesInvoicePosted', 'CustomerReceiptPosted', 'StockAdjustmentPosted'];
  readonly legKeys    = ['EXPENSE', 'PAYABLE', 'RECEIVABLE', 'CASH', 'BANK', 'INVENTORY', 'COGS', 'REVENUE', 'VAT_INPUT', 'VAT_OUTPUT', 'STATUTORY', 'ROUNDING', 'FX_GAIN', 'FX_LOSS'];

  ngOnInit(): void {
    this.model.initForm();
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1006'); this.model.loadAccounts(); this.model.load(); });
  }

  onSearchTermChange(v: string): void { this.model.searchTerm.set(v); this.model.pager.reset(); }
  get formdata() { return this.model.form; }

  onSave(): void { this.model.onSave(); }
  onNew(): void  { this.model.onNew(); }
  onReset(): void { const o = this.model.maps().find((m) => m.gl_map_no === this.model.selectedNo()); if (o) this.model.select(o); else this.model.onNew(); }
  onDelete(): void { if (!this.model.selectedNo()) return; this.alertService.deleteConfirm().subscribe((ok) => { if (ok) this.model.onDelete(); }); }
  select(item: GlMap): void { this.model.select(item); }
}

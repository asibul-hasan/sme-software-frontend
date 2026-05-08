import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1003ModelService, FinancialYear } from './services/model.service';
import { Sys1003DataService } from './services/data.service';
import { FormPermissionService } from 'apps/web-client/src/app/core/services/form-permission.service';
import { AlertService } from 'apps/web-client/src/app/core/services/alert.service';

@Component({
  selector: 'app-sys1003',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    PageFormLayoutComponent,
  ],
  providers: [Sys1003ModelService, Sys1003DataService, DatePipe],
  templateUrl: './sys1003.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .periods-table-container {
        max-height: 400px;
        overflow-y: auto;
      }
    `,
  ],
})
export class Sys1003Component implements OnInit {
  public model             = inject(Sys1003ModelService);
  public permissionService = inject(FormPermissionService);
  private alertService     = inject(AlertService);

  readonly sysConstants = sysConstants;
  readonly SYS_CONSTS   = sysConstants;

  ngOnInit(): void {
    this.model.initForm();
    this.permissionService.loadPermissions('SYS_1003').subscribe();
    this.model.loadBranches();
    this.model.loadFinancialYears();
  }

  onSearchTermChange(val: string): void {
    this.model.searchTerm.set(val);
  }

  /** Expose FormArray accessor to template */
  get periodsFormArray() {
    return this.model.periodsFormArray;
  }

  onSave(): void        { this.model.onSave(); }
  onNew(): void         { this.model.onNew(); }
  autoGeneratePeriods() { this.model.autoGeneratePeriods(); }
  addPeriodRow()        { this.model.addPeriodRow(); }

  onReset(): void {
    if (this.model.selectedYearNo()) {
      const original = this.model
        .financialYears()
        .find((y) => y.fin_year_no === this.model.selectedYearNo());
      if (original) this.model.selectYear(original);
    } else {
      this.model.onNew();
    }
  }

  onDelete(): void {
    if (!this.model.selectedYearNo()) return;
    this.alertService.deleteConfirm().subscribe((confirmed) => {
      if (confirmed) this.model.onDelete();
    });
  }

  onCloseFY(): void {
    if (!this.model.selectedYearNo()) return;
    this.alertService
      .confirm(
        'WARNING: Closing the Financial Year will lock all transactions. Proceed?',
        'Close Fiscal Year',
        'warn',
      )
      .subscribe((confirmed) => {
        if (confirmed) this.model.closeFiscalYear();
      });
  }

  selectYear(year: FinancialYear, index: number): void {
    this.model.selectYear(year, index);
  }
}

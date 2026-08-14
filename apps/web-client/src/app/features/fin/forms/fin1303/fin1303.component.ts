import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1303DataService, DayBookRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1303',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent],
  providers: [Fin1303DataService],
  templateUrl: './fin1303.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1303Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1303DataService);
  private toastr = inject(ToastrService);

  rows      = signal<DayBookRow[]>([]);
  isLoading = signal(false);
  from = new Date().toISOString().split('T')[0];
  to   = new Date().toISOString().split('T')[0];

  readonly gridConfig: GridConfig<DayBookRow> = {
    gridKey: 'FIN_1303_DAY_BOOK_GRID',
    showPagination: true,
    pageSize: 25,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.date<DayBookRow>('voucher_date', 'Date').width(120).build(),
      GridColumns.text<DayBookRow>('voucher_id', 'Voucher').width(150).build(),
      GridColumns.text<DayBookRow>('voucher_type_name', 'Type').width(130).build(),
      GridColumns.text<DayBookRow>('account_name', 'Account').flex(1).build(),
      GridColumns.text<DayBookRow>('narration', 'Narration').flex(1).build(),
      GridColumns.decimal<DayBookRow>('debit', 'Debit').sum().build(),
      GridColumns.decimal<DayBookRow>('credit', 'Credit').sum().build(),
    ]
  };

  ngOnInit(): void { setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1303'); this.load(); }); }

  load(): void {
    this.isLoading.set(true);
    this.data.dayBook(this.from, this.to).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.rows.set(res.data); },
      error: () => this.toastr.error('Failed to load day book'),
    });
  }
}

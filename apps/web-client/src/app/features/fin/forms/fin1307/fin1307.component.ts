import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { AppDecimalPipe } from '../../../../shared/pipes/app-decimal.pipe';
import { Fin1307DataService, Aging, AgingRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { finConstants } from '../../constants/fin.constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1307',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent, AppDatePickerComponent, AppDecimalPipe],
  providers: [Fin1307DataService],
  templateUrl: './fin1307.component.html',
  styles: [`:host { display: block; height: 100%; }`],
})
export class Fin1307Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1307DataService);
  private toastr = inject(ToastrService);

  readonly partyTypeOptions = finConstants.partyTypes.filter((o) => o.value === 1 || o.value === 2);

  aging     = signal<Aging | null>(null);
  isLoading = signal(false);
  partyType = 1;
  asOf      = new Date().toISOString().split('T')[0];

  rows = computed<AgingRow[]>(() => this.aging()?.rows ?? []);

  // The backend sends rows plus a grand total, not per-bucket totals. Summing the rows here keeps
  // the header tiles and the grid's own footer totals derived from one set of numbers.
  private sum = (pick: (r: AgingRow) => number) =>
    this.rows().reduce((acc, r) => acc + Number(pick(r) ?? 0), 0);

  totalCurrent = computed(() => this.sum((r) => r.current_amount));
  totalB1      = computed(() => this.sum((r) => r.days_31_60));
  totalB2      = computed(() => this.sum((r) => r.days_61_90));
  totalB3      = computed(() => this.sum((r) => r.days_over_90));
  totalOut     = computed(() => Number(this.aging()?.grand_total ?? 0));

  readonly gridConfig: GridConfig<AgingRow> = {
    gridKey: 'FIN_1307_AGING_GRID',
    showPagination: true,
    pageSize: 25,
    toolbar: { showSearch: true, showExport: true },
    columns: [
      GridColumns.text<AgingRow>('party_name', 'Party').flex(1).minWidth(180).build(),
      GridColumns.decimal<AgingRow>('current_amount', '0–30').sum().build(),
      GridColumns.decimal<AgingRow>('days_31_60', '31–60').sum().build(),
      GridColumns.decimal<AgingRow>('days_61_90', '61–90').sum().build(),
      GridColumns.decimal<AgingRow>('days_over_90', '90+').sum().build(),
      GridColumns.decimal<AgingRow>('total_outstanding', 'Outstanding').sum().build(),
    ]
  };

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1307'); this.load(); });
  }

  load(): void {
    this.isLoading.set(true);
    this.data.aging(this.partyType, this.asOf).pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.aging.set(res.data); },
      error: () => this.toastr.error('Failed to load aging'),
    });
  }
}

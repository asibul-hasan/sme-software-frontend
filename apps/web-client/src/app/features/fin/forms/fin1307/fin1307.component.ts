import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig } from '../../../../shared/components/common-table';
import { AppDatePickerComponent } from '../../../../shared/components/date-picker';
import { Fin1307DataService, Aging, AgingRow } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { isSuccess } from '../../../../core/models/response.model';
import { finConstants } from '../../constants/fin.constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1307',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent, AppDatePickerComponent],
  providers: [Fin1307DataService],
  templateUrl: './fin1307.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1307Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1307DataService);
  private toastr = inject(ToastrService);

  // AR (Customer) / AP (Supplier) only
  readonly partyTypeOptions = finConstants.partyTypes.filter((o) => o.value === 1 || o.value === 2);

  aging     = signal<Aging | null>(null);
  isLoading = signal(false);
  partyType = 1;
  asOf      = new Date().toISOString().split('T')[0];

  rows         = computed<AgingRow[]>(() => this.aging()?.rows ?? []);
  totalCurrent = computed(() => Number(this.aging()?.total_current ?? 0));
  totalB1      = computed(() => Number(this.aging()?.total_b1 ?? 0));
  totalB2      = computed(() => Number(this.aging()?.total_b2 ?? 0));
  totalB3      = computed(() => Number(this.aging()?.total_b3 ?? 0));
  totalOut     = computed(() => Number(this.aging()?.total_outstanding ?? 0));

  readonly columns: ColumnDef[] = [
    { title: 'Party #',  field: 'party_no', sort: true, cellType: 'text', width: '120px', pin: 'left' },
    { title: '0–30',     field: 'current', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: '31–60',    field: 'bucket1', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: '61–90',    field: 'bucket2', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: '90+',      field: 'bucket3', cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
    { title: 'Outstanding', field: 'outstanding', sort: true, cellType: 'decimal', align: 'right', precision: 2, bottomTotal: true },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: true, pagination: true, defaultPageSize: 25, dense: true, striped: true,
    showActions: false, showColumnToggle: false, showExport: true,
    exportFormats: ['excel', 'pdf', 'csv', 'print'], showTitle: false, maxHeight: '100%',
  };
  readonly tableData = computed(() => this.rows() as unknown as Record<string, unknown>[]);

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

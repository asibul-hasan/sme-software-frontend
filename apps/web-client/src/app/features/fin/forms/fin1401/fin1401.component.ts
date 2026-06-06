import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { CommonTableComponent, ColumnDef, TableConfig, statusBadge } from '../../../../shared/components/common-table';
import { Fin1401DataService, FinYearOption, FinPeriod, CloseAccount } from './services/data.service';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { AlertService } from '../../../../core/services/alert.service';
import { isSuccess } from '../../../../core/models/response.model';
import { finConstants } from '../../constants/fin.constants';
import { ToastrService } from 'ngx-toastr';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-fin1401',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, CommonTableComponent],
  providers: [Fin1401DataService],
  templateUrl: './fin1401.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .fill-card { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
    .fill-card > .card-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
  `],
})
export class Fin1401Component implements OnInit {
  public permissionService = inject(FormPermissionService);
  private data   = inject(Fin1401DataService);
  private toastr = inject(ToastrService);
  private alert  = inject(AlertService);

  readonly periodStatuses = finConstants.periodStatuses;

  years    = signal<FinYearOption[]>([]);
  periods  = signal<FinPeriod[]>([]);
  accounts = signal<CloseAccount[]>([]);
  isLoading = signal(false);
  isClosing = signal(false);

  selectedYearNo: number | null = null;
  retainedEarningsAccountNo: number | null = null;

  selectedYear = computed(() => this.years().find((y) => y.fin_year_no === this.selectedYearNo) ?? null);
  yearClosed   = computed(() => this.selectedYear()?.is_closed === 1);

  readonly columns: ColumnDef[] = [
    { title: 'Period',  field: 'fin_period_name', sort: true, cellType: 'text' },
    { title: 'Start',   field: 'start_date', cellType: 'date', dateFormat: 'dd MMM yyyy', width: '140px' },
    { title: 'End',     field: 'end_date',   cellType: 'date', dateFormat: 'dd MMM yyyy', width: '140px' },
    { title: 'Status',  field: 'period_status', cellType: 'badge', width: '120px',
      value: (r) => this.statusLabel(r['period_status'] as number),
      badgeConfig: (v) => v === 1 ? { label: 'Open', variant: 'success' } : v === 2 ? { label: 'Closed', variant: 'warning' } : { label: 'Locked', variant: 'neutral' } },
  ];
  readonly config: Partial<TableConfig> = {
    showSearch: false, pagination: false, dense: true, striped: true,
    showColumnToggle: false, showExport: false, showTitle: false, maxHeight: '100%',
    showActions: true,
    actions: [
      { type: 'custom', icon: 'lock_open', tooltip: 'Set Open',  label: 'Set Open',  disabled: () => this.yearClosed(), onClick: (r) => this.setStatus(r['fin_period_no'] as number, 1) },
      { type: 'custom', icon: 'event_busy', tooltip: 'Set Closed', label: 'Set Closed', disabled: () => this.yearClosed(), onClick: (r) => this.setStatus(r['fin_period_no'] as number, 2) },
      { type: 'custom', icon: 'lock', tooltip: 'Set Locked', label: 'Set Locked', disabled: () => this.yearClosed(), onClick: (r) => this.setStatus(r['fin_period_no'] as number, 3) },
    ],
  };
  readonly tableData = computed(() => this.periods() as unknown as Record<string, unknown>[]);

  ngOnInit(): void {
    setTimeout(() => { this.permissionService.useLocalPermissions('FIN_1401'); this.loadYears(); this.loadAccounts(); });
  }

  loadYears(): void {
    this.isLoading.set(true);
    this.data.getYears().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (res) => {
        if (isSuccess(res) && res.data) {
          this.years.set(res.data);
          if (!this.selectedYearNo && res.data.length) { this.selectedYearNo = res.data[res.data.length - 1].fin_year_no; this.loadPeriods(); }
        }
      },
      error: () => this.toastr.error('Failed to load financial years'),
    });
  }

  loadAccounts(): void {
    this.data.getAccounts().subscribe({ next: (res) => { if (isSuccess(res) && res.data) this.accounts.set(res.data); } });
  }

  loadPeriods(): void {
    if (!this.selectedYearNo) { this.periods.set([]); return; }
    this.data.getPeriods(this.selectedYearNo).subscribe({
      next: (res) => { if (isSuccess(res) && res.data) this.periods.set(res.data); },
      error: () => this.toastr.error('Failed to load periods'),
    });
  }

  setStatus(finPeriodNo: number, status: number): void {
    this.data.setPeriodStatus(finPeriodNo, status).subscribe({
      next: (res) => { if (isSuccess(res)) { this.toastr.success('Period status updated'); this.loadPeriods(); } },
      error: (e) => this.toastr.error(e?.error?.message ?? 'Failed to update period status'),
    });
  }

  runYearEndClose(): void {
    if (!this.selectedYearNo) { this.toastr.warning('Select a financial year'); return; }
    if (!this.retainedEarningsAccountNo) { this.toastr.warning('Select a retained-earnings account'); return; }
    this.alert.confirm('Run the year-end close? This posts a closing voucher moving net P&L into retained earnings, then locks every period of the year. This cannot be undone.', 'Year-End Close', 'warn')
      .subscribe((ok) => { if (ok) this.doClose(); });
  }

  private doClose(): void {
    this.isClosing.set(true);
    this.data.yearEndClose({ fin_year_no: this.selectedYearNo!, retained_earnings_account_no: this.retainedEarningsAccountNo! })
      .pipe(finalize(() => this.isClosing.set(false))).subscribe({
        next: (res) => {
          if (isSuccess(res) && res.data) {
            const v = res.data.voucher_id ? ` (voucher ${res.data.voucher_id})` : '';
            this.toastr.success(`Year closed — net profit ${res.data.net_profit.toFixed(2)}${v}`);
            this.loadYears(); this.loadPeriods();
          }
        },
        error: (e) => this.toastr.error(e?.error?.message ?? 'Year-end close failed'),
      });
  }

  statusLabel(v: number): string { return this.periodStatuses.find((s) => s.value === v)?.label ?? String(v); }
  protected readonly statusBadge = statusBadge;
}

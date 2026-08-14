import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { ErpGridComponent, GridConfig, GridColumns } from '../../../../shared/ag-grid';
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
  imports: [CommonModule, FormsModule, SharedModule, PageFormLayoutComponent, ErpGridComponent],
  providers: [Fin1401DataService],
  templateUrl: './fin1401.component.html',
  styles: [`:host { display: block; height: 100%; }`],
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
  incomeSummaryAccountNo: number | null = null;

  selectedYear = computed(() => this.years().find((y) => y.fin_year_no === this.selectedYearNo) ?? null);
  yearClosed   = computed(() => this.selectedYear()?.is_closed === 1);

  readonly gridConfig: GridConfig<FinPeriod> = {
    gridKey: 'FIN_1401_PERIOD_CLOSE_GRID',
    rowIdField: 'fin_period_no',
    selectionMode: 'single',
    autoSelectFirstRow: true,
    showPagination: false,
    canAdd: () => false,
    canEdit: () => false,
    canDeleteRow: () => false,
    toolbar: { showSearch: true },
    columns: [
      GridColumns.text<FinPeriod>('fin_period_name', 'Period').build(),
      GridColumns.date<FinPeriod>('start_date', 'Start').width(140).build(),
      GridColumns.date<FinPeriod>('end_date', 'End').width(140).build(),
      GridColumns.text<FinPeriod>('period_status', 'Status')
        .width(120)
        .align('center')
        .cellRenderer((params) => {
          const s = params.value;
          if (s === 1) return `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Open</span>`;
          if (s === 2) return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Closed</span>`;
          return `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Locked</span>`;
        })
        .build(),
      {
        field: '__actions',
        headerName: 'Actions',
        width: 240,
        pinned: 'right',
        sortable: false,
        filterable: false,
        cellRenderer: (params) => {
          if (!params.data || this.yearClosed()) return '';
          const container = document.createElement('div');
          container.className = 'flex items-center gap-1';

          const btnOpen = document.createElement('button');
          btnOpen.className = 'btn-action btn-new text-xs px-2 py-1';
          btnOpen.title = 'Set Open';
          btnOpen.innerHTML = '<span class="material-icons text-success" style="font-size:16px;">lock_open</span> Open';
          btnOpen.onclick = (e) => { e.stopPropagation(); this.setStatus(params.data.fin_period_no, 1); };

          const btnClose = document.createElement('button');
          btnClose.className = 'btn-action btn-new text-xs px-2 py-1';
          btnClose.title = 'Set Closed';
          btnClose.innerHTML = '<span class="material-icons text-warning" style="font-size:16px;">event_busy</span> Close';
          btnClose.onclick = (e) => { e.stopPropagation(); this.setStatus(params.data.fin_period_no, 2); };

          const btnLock = document.createElement('button');
          btnLock.className = 'btn-action btn-new text-xs px-2 py-1';
          btnLock.title = 'Set Locked';
          btnLock.innerHTML = '<span class="material-icons text-secondary" style="font-size:16px;">lock</span> Lock';
          btnLock.onclick = (e) => { e.stopPropagation(); this.setStatus(params.data.fin_period_no, 3); };

          container.appendChild(btnOpen);
          container.appendChild(btnClose);
          container.appendChild(btnLock);
          return container;
        }
      }
    ]
  };

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
    if (!this.incomeSummaryAccountNo) { this.toastr.warning('Select an income-summary account'); return; }
    this.alert.confirm('Run the year-end close? This posts a closing voucher moving net P&L into retained earnings, then locks every period of the year. This cannot be undone.', 'Year-End Close', 'warn')
      .subscribe((ok) => { if (ok) this.doClose(); });
  }

  private doClose(): void {
    this.isClosing.set(true);
    this.data.yearEndClose({
      fin_year_no: this.selectedYearNo!,
      retained_earnings_account_no: this.retainedEarningsAccountNo!,
      income_summary_account_no: this.incomeSummaryAccountNo!,
    })
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
}

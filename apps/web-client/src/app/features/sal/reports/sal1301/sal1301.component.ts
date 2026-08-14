import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../core/models/response.model';
import { Sal1301DataService, SalesReport } from './services/data.service';

type Tab = 'daily' | 'product' | 'cashier' | 'hour';

/**
 * SAL_1301 — Sales Reports.
 *
 * Read-only over confirmed sales. Margin comes from the cost the stock engine
 * recorded at post time, so a later purchase changing the average cost never
 * restates a day that has already traded.
 */
@Component({
  selector: 'app-sal1301',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [Sal1301DataService],
  templateUrl: './sal1301.component.html',
  styleUrls: ['./sal1301.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sal1301Component implements OnInit {
  private data = inject(Sal1301DataService);

  report = signal<SalesReport | null>(null);
  isLoading = signal(false);
  tab = signal<Tab>('daily');

  fromDate = isoDaysAgo(6);
  toDate = isoDaysAgo(0);

  /** Scales the hourly bars against the busiest hour rather than a fixed ceiling. */
  readonly peakHour = computed(() =>
    Math.max(1, ...(this.report()?.by_hour ?? []).map((h) => h.net_sales)));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.data
      .getSales(this.fromDate, this.toDate)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.report.set(res.data);
      });
  }

  setRange(days: number): void {
    this.fromDate = isoDaysAgo(days - 1);
    this.toDate = isoDaysAgo(0);
    this.load();
  }

  barWidth(value: number): string {
    return `${Math.round((value / this.peakHour()) * 100)}%`;
  }

  hourLabel(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  print(): void {
    window.print();
  }
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().substring(0, 10);
}

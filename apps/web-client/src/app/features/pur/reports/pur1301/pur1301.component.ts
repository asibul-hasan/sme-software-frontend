import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { isSuccess } from '../../../../core/models/response.model';
import { AgingReport, Pur1301DataService, SpendReport } from './services/data.service';

type Tab = 'aging' | 'spend';

/**
 * PUR_1301 — Supplier Aging &amp; Spend.
 *
 * Aging answers "who is owed, and how late"; spend answers "where the money went".
 * Both read posted bills only — a draft is not a liability and not a cost.
 */
@Component({
  selector: 'app-pur1301',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [Pur1301DataService],
  templateUrl: './pur1301.component.html',
  styleUrls: ['./pur1301.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pur1301Component implements OnInit {
  private data = inject(Pur1301DataService);

  tab = signal<Tab>('aging');
  aging = signal<AgingReport | null>(null);
  spend = signal<SpendReport | null>(null);
  isLoading = signal(false);

  asOf = isoDaysAgo(0);
  fromDate = isoDaysAgo(29);
  toDate = isoDaysAgo(0);

  ngOnInit(): void {
    this.loadAging();
  }

  loadAging(): void {
    this.isLoading.set(true);
    this.data
      .aging(this.asOf)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.aging.set(res.data);
      });
  }

  loadSpend(): void {
    this.isLoading.set(true);
    this.data
      .spend(this.fromDate, this.toDate)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((res) => {
        if (isSuccess(res) && res.data) this.spend.set(res.data);
      });
  }

  switchTo(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'spend' && !this.spend()) this.loadSpend();
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

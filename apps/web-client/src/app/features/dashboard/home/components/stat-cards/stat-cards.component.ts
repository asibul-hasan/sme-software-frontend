import { Component, ChangeDetectionStrategy, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-stat-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-cards.component.html',
  styleUrls: ['./stat-cards.component.scss']
})
export class StatCardsComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private charts: Chart[] = [];

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSparklines();
    }
  }

  private initSparklines() {
    this.createSparkline('salesSparkline', [10, 15, 8, 12, 18, 14, 20], '#2e7d32');
    this.createSparkline('revenueSparkline', [5, 10, 15, 12, 18, 22, 25], '#1565c0');
    this.createSparkline('expensesSparkline', [20, 18, 22, 15, 12, 10, 8], '#ef6c00');
    this.createSparkline('profitSparkline', [10, 12, 15, 18, 20, 25, 30], '#00838f');
  }

  private createSparkline(id: string, data: number[], color: string) {
    const ctx = document.getElementById(id) as HTMLCanvasElement;
    if (ctx) {
      this.charts.push(new Chart(ctx, {
        type: 'line',
        data: {
          labels: new Array(data.length).fill(''),
          datasets: [{
            data: data,
            borderColor: color,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      }));
    }
  }
}

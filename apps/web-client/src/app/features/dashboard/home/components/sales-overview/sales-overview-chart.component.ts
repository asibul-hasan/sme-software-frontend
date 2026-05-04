import { Component, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sales-overview-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-overview-chart.component.html',
  styleUrls: ['./sales-overview-chart.component.scss']
})
export class SalesOverviewChartComponent implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private chart: Chart | undefined;

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initChart();
    }
  }

  private initChart() {
    const ctx = document.getElementById('salesOverviewChart') as HTMLCanvasElement;
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['1 May', '8 May', '15 May', '22 May', '31 May'],
          datasets: [{
            label: 'Revenue',
            data: [150000, 450000, 200000, 600000, 3245650],
            borderColor: '#3b82f6',
            borderWidth: 3,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            }
          }
        }
      });
    }
  }
}

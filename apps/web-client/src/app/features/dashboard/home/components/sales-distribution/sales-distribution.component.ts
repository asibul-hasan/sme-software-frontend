import { Component, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sales-distribution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-distribution.component.html',
  styleUrls: ['./sales-distribution.component.scss']
})
export class SalesDistributionComponent implements AfterViewInit {
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
    const ctx = document.getElementById('salesDistChart') as HTMLCanvasElement;
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'Cash',
              data: [12000, 19000, 3000, 5000, 2000, 3000, 10000],
              backgroundColor: '#10b981',
              borderRadius: 4,
            },
            {
              label: 'Credit',
              data: [2000, 3000, 15000, 7000, 12000, 11000, 5000],
              backgroundColor: '#3b82f6',
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, font: { size: 10 } } }
          },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            y: { stacked: true, grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
          }
        }
      });
    }
  }
}

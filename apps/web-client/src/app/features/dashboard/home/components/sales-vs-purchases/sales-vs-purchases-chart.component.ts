import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sales-vs-purchases-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-vs-purchases-chart.component.html',
  styleUrls: ['./sales-vs-purchases-chart.component.scss']
})
export class SalesVsPurchasesChartComponent implements AfterViewInit, OnDestroy {
  private chart: any;

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  private initChart() {
    const ctx = document.getElementById('salesVsPurchasesChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Sales',
            data: [65000, 59000, 80000, 81000, 56000, 55000],
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 12,
          },
          {
            label: 'Purchases',
            data: [45000, 48000, 40000, 19000, 86000, 27000],
            backgroundColor: '#3b82f6',
            borderRadius: 6,
            barThickness: 12,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, weight: 'bold' },
              color: '#94a3b8'
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.1)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (value) => '৳' + (Number(value) / 1000) + 'k'
            }
          }
        }
      }
    });
  }
}

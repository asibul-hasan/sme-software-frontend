import { Component, AfterViewInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-branch-sales-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branch-sales-chart.component.html',
  styleUrls: ['./branch-sales-chart.component.scss']
})
export class BranchSalesChartComponent implements AfterViewInit {
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
    const ctx = document.getElementById('branchSalesChart') as HTMLCanvasElement;
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Head Office', 'Uttara', 'Chattogram', 'Sylhet'],
          datasets: [{
            data: [38, 26, 19, 17],
            backgroundColor: ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b'],
            borderWidth: 4,
            borderColor: 'transparent',
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                color: '#94a3b8',
                font: { size: 11, weight: 'bold' }
              }
            }
          }
        }
      });
    }
  }
}

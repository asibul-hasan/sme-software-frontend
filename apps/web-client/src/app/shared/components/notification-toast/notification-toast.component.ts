import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (notification(); as item) {
      <div class="notification-toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080;">
        <div class="toast show shadow-lg border-0 rounded-3 overflow-hidden bg-white" style="min-width: 320px; max-width: 400px;">
          <div class="toast-header bg-primary text-white d-flex align-items-center justify-content-between px-3 py-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-bell-fill me-1"></i>
              <strong class="me-auto text-white">{{ item.form_name }}</strong>
            </div>
            <button type="button" class="btn-close btn-close-white ms-2" (click)="dismiss()"></button>
          </div>
          <div class="toast-body p-3">
            <h6 class="fw-semibold text-dark mb-1">{{ item.title }}</h6>
            <p class="text-muted small mb-3">{{ item.message }}</p>
            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-outline-secondary btn-sm px-3" (click)="dismiss()">Dismiss</button>
              <button class="btn btn-primary btn-sm px-3" (click)="openModal(item)">Read</button>
            </div>
          </div>
          <div class="progress" style="height: 3px;">
            <div class="progress-bar bg-primary" [style.width.%]="progress()"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .notification-toast-container {
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  public notificationService = inject(NotificationService);
  public notification = this.notificationService.activeToast;

  public progress = signal(100);
  private intervalId: any;
  private duration = 8000; // 8 seconds auto-dismiss
  private elapsed = 0;

  ngOnInit(): void {
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private startTimer(): void {
    this.clearTimer();
    this.elapsed = 0;
    this.progress.set(100);

    this.intervalId = setInterval(() => {
      this.elapsed += 100;
      this.progress.set(Math.max(0, 100 - (this.elapsed / this.duration) * 100));
      if (this.elapsed >= this.duration) {
        this.dismiss();
      }
    }, 100);
  }

  private clearTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public dismiss(): void {
    this.clearTimer();
    this.notificationService.dismissToast();
  }

  public openModal(item: any): void {
    this.clearTimer();
    this.notificationService.openModal(item);
  }
}

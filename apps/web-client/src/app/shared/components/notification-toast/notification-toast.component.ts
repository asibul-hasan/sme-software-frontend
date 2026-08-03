import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationModalComponent } from '../notification-modal/notification-modal.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (notification(); as item) {
      <div class="notification-toast-container fixed right-4 top-4 z-[1080]">
        <div
          class="w-[360px] overflow-hidden rounded-xl border border-line bg-surface text-content shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
        >
          <div class="flex items-start gap-3 p-3">
            <span
              class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--indigo-rgb),0.1)] text-indigo"
            >
              <mat-icon class="!h-[18px] !w-[18px] !text-[18px] leading-none">notifications</mat-icon>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-xs font-semibold text-indigo">{{ item.form_name }}</span>
                <button
                  type="button"
                  class="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-subtle hover:bg-muted"
                  (click)="dismiss()"
                >
                  <mat-icon class="!h-[16px] !w-[16px] !text-[16px] leading-none">close</mat-icon>
                </button>
              </div>

              <div class="truncate text-sm font-semibold">{{ item.title }}</div>
              <p class="mb-0 mt-0.5 line-clamp-2 text-xs text-subtle">{{ item.message }}</p>

              <div class="mt-2 flex justify-end gap-2">
                <button
                  class="cursor-pointer rounded-lg border border-line bg-transparent px-3 py-1.5 text-xs font-semibold"
                  (click)="dismiss()"
                >
                  Dismiss
                </button>
                <button
                  class="cursor-pointer rounded-lg border-0 bg-indigo px-3 py-1.5 text-xs font-semibold text-white"
                  (click)="openModal(item)"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          <!-- Auto-dismiss countdown -->
          <div class="h-[3px] w-full bg-muted">
            <div class="h-full bg-indigo transition-[width] duration-100" [style.width.%]="progress()"></div>
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
  private dialogService = inject(DialogService);
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

  /** Opens the inbox dialog on the toasted item, via the shared DialogService. */
  public openModal(item: NotificationItem): void {
    this.clearTimer();
    this.notificationService.dismissToast();
    this.dialogService
      .open(NotificationModalComponent, {
        size: 'xl',
        panelClass: 'notification-dialog-panel',
        data: { notificationNo: item.notification_no },
      })
      .subscribe(() => this.notificationService.fetchNotifications());
  }
}

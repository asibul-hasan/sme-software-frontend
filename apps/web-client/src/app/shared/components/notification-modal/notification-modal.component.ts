import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop fade show" (click)="close()"></div>
      <div class="modal d-block fade show" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
          <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden" style="height: 600px;">
            <!-- Header -->
            <div class="modal-header bg-dark text-white px-4 py-3 border-bottom d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-inbox-fill text-warning fs-5"></i>
                <h5 class="modal-title m-0 fw-semibold text-white">Notifications</h5>
                <span class="badge bg-primary rounded-pill ms-2">{{ unreadCount() }} unread</span>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="close()"></button>
            </div>

            <!-- Gmail-Style Split Body -->
            <div class="modal-body p-0 d-flex" style="height: calc(600px - 60px);">
              <!-- Left List Panel (Gmail Inbox Style) -->
              <div class="notification-list-panel border-end bg-light" style="width: 350px; min-width: 300px; overflow-y: auto;">
                @if (notifications().length === 0) {
                  <div class="p-4 text-center text-muted">
                    <i class="bi bi-bell-slash fs-1 d-block mb-2 text-secondary"></i>
                    No notifications available
                  </div>
                }
                @for (item of notifications(); track item.notification_no) {
                  <div class="notification-item p-3 border-bottom cursor-pointer position-relative transition-all"
                       [class.active-item]="selected()?.notification_no === item.notification_no"
                       [class.unread-item]="item.status === 0"
                       (click)="selectItem(item)">
                    <div class="d-flex align-items-center justify-content-between mb-1">
                      <span class="badge bg-secondary text-truncate" style="max-width: 180px;">{{ item.form_name }}</span>
                      <small class="text-muted" style="font-size: 0.75rem;">{{ item.created_at | date:'dd/MM HH:mm' }}</small>
                    </div>
                    <div class="fw-semibold text-dark text-truncate mb-1" style="font-size: 0.9rem;">
                      @if (item.status === 0) {
                        <span class="d-inline-block rounded-circle bg-primary me-1" style="width: 8px; height: 8px;"></span>
                      }
                      {{ item.title }}
                    </div>
                    <div class="text-muted small text-truncate" style="font-size: 0.8rem;">
                      {{ item.message }}
                    </div>
                  </div>
                }
              </div>

              <!-- Right Detail View Panel -->
              <div class="notification-detail-panel flex-grow-1 p-4 bg-white d-flex flex-column justify-content-between" style="overflow-y: auto;">
                @if (selected(); as activeItem) {
                  <div>
                    <!-- Detail Header -->
                    <div class="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                      <div>
                        <span class="badge bg-primary px-3 py-2 fs-6 mb-2">{{ activeItem.form_name }}</span>
                        <h4 class="fw-bold text-dark m-0">{{ activeItem.title }}</h4>
                      </div>
                      <div class="text-end text-muted small">
                        <div>Received: {{ activeItem.created_at | date:'medium' }}</div>
                        @if (activeItem.status === 2) {
                          <span class="badge bg-success mt-1">Action Completed</span>
                        }
                      </div>
                    </div>

                    <!-- Message Body -->
                    <div class="p-3 bg-light rounded-3 mb-4 border">
                      <p class="fs-6 text-dark m-0">{{ activeItem.message }}</p>
                    </div>

                    <!-- Leave / Reliever Specific Details Card -->
                    @if (activeItem.payload) {
                      <div class="card border-0 bg-white shadow-sm rounded-3 mb-4 border">
                        <div class="card-header bg-light fw-bold py-2">
                          <i class="bi bi-file-text me-2"></i> Application Details
                        </div>
                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-md-6" *ngIf="activeItem.payload.applicant_name">
                              <small class="text-muted d-block">Applicant Name</small>
                              <span class="fw-semibold text-dark">{{ activeItem.payload.applicant_name }}</span>
                            </div>
                            <div class="col-md-6" *ngIf="activeItem.payload.from_date">
                              <small class="text-muted d-block">Leave Period</small>
                              <span class="fw-semibold text-dark">{{ activeItem.payload.from_date | date:'dd/MM/yyyy' }} - {{ activeItem.payload.to_date | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <div class="col-md-6" *ngIf="activeItem.payload.total_days">
                              <small class="text-muted d-block">Total Days</small>
                              <span class="fw-semibold text-dark">{{ activeItem.payload.total_days }} day(s)</span>
                            </div>
                            <div class="col-md-6" *ngIf="activeItem.payload.reason">
                              <small class="text-muted d-block">Reason</small>
                              <span class="fw-semibold text-dark">{{ activeItem.payload.reason }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Optional Reliever Remarks Input -->
                    <div class="mb-3" *ngIf="activeItem.status !== 2">
                      <label class="form-label text-muted small fw-semibold">Remarks (Optional)</label>
                      <input type="text" class="form-control" [(ngModel)]="remarks" placeholder="Enter remarks if any..." />
                    </div>
                  </div>

                  <!-- Footer Action Buttons -->
                  <div class="d-flex align-items-center justify-content-end gap-2 border-top pt-3">
                    @if (activeItem.status !== 2) {
                      <button class="btn btn-danger px-4" (click)="respond(activeItem, 1)">
                        <i class="bi bi-x-circle me-1"></i> Reject
                      </button>
                      <button class="btn btn-success px-4" (click)="respond(activeItem, 2)">
                        <i class="bi bi-check-circle me-1"></i> Accept
                      </button>
                    }
                    <button class="btn btn-secondary px-4" (click)="close()">Close</button>
                  </div>
                } @else {
                  <div class="h-100 d-flex align-items-center justify-content-center text-muted">
                    Select a notification from the list to view details.
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cursor-pointer { cursor: pointer; }
    .notification-item:hover { background-color: #f8f9fa; }
    .active-item { background-color: #e9ecef !important; border-left: 4px solid #0d6efd !important; }
    .unread-item { background-color: #f0f7ff; }
  `]
})
export class NotificationModalComponent {
  public notificationService = inject(NotificationService);
  public isOpen = this.notificationService.isModalOpen;
  public notifications = this.notificationService.notifications;
  public selected = this.notificationService.selectedNotification;
  public unreadCount = this.notificationService.unreadCount;

  public remarks = '';

  public close(): void {
    this.notificationService.closeModal();
  }

  public selectItem(item: NotificationItem): void {
    this.notificationService.selectNotification(item);
  }

  public respond(item: NotificationItem, status: number): void {
    this.notificationService.respondRelieverRequest(item, status, this.remarks, () => {
      this.remarks = '';
    });
  }
}

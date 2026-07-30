import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { AppConfigService } from './app-config.service';
import { AuthService } from './auth.service';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';

export interface NotificationItem {
  notification_no: number;
  target_user_no: number;
  menu_no?: number;
  form_id?: string;
  form_name: string;
  document_type?: string;
  document_pk?: number;
  approval_request_no?: number;
  title: string;
  message: string;
  payload_json?: string;
  status: number; // 0 = Unread, 1 = Read, 2 = ActionTaken
  created_at: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private config = inject(AppConfigService);
  private authService = inject(AuthService);

  public notifications = signal<NotificationItem[]>([]);
  public activeToast = signal<NotificationItem | null>(null);
  public isModalOpen = signal<boolean>(false);
  public selectedNotification = signal<NotificationItem | null>(null);

  public unreadCount = computed(() =>
    this.notifications().filter(n => n.status === 0).length
  );

  constructor() {
    this.fetchNotifications();
    // Periodically poll unread notifications every 30 seconds silently in the background
    setInterval(() => this.fetchNotifications(), 30000);
  }

  public fetchNotifications(): void {
    const token = this.authService.getToken();
    if (!token || !this.authService.isAuthenticated()) {
      this.notifications.set([]);
      this.activeToast.set(null);
      return;
    }

    const url = `${this.config.apiUrl}/sys/notifications/user`;
    // Pass SKIP_LOADER context to keep notification background polling completely silent
    this.http.get<any>(url, {
      context: new HttpContext().set(SKIP_LOADER, true)
    }).subscribe({
      next: (res) => {
        const rawList: NotificationItem[] = res?.data ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList)) {
          const parsed = rawList.map(item => ({
            ...item,
            payload: item.payload_json ? JSON.parse(item.payload_json) : null
          }));

          // Check if a new unread notification arrived for toast
          const currentUnread = parsed.filter(n => n.status === 0);
          if (currentUnread.length > 0 && !this.activeToast()) {
            this.activeToast.set(currentUnread[0]);
          }

          this.notifications.set(parsed);
          if (!this.selectedNotification() && parsed.length > 0) {
            this.selectedNotification.set(parsed[0]);
          }
        }
      },
      error: (err) => {
        // Silent catch on network/auth error during initial boot
        console.warn('Notifications poll warning:', err?.statusText || err?.message);
      }
    });
  }

  public openModal(notification?: NotificationItem): void {
    if (notification) {
      this.selectedNotification.set(notification);
    } else if (this.notifications().length > 0) {
      this.selectedNotification.set(this.notifications()[0]);
    }
    this.isModalOpen.set(true);
    this.dismissToast();
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
  }

  public dismissToast(): void {
    this.activeToast.set(null);
  }

  public selectNotification(item: NotificationItem): void {
    this.selectedNotification.set(item);
    if (item.status === 0) {
      this.markAsRead(item.notification_no);
    }
  }

  public markAsRead(notificationNo: number): void {
    const token = this.authService.getToken();
    if (!token || !this.authService.isAuthenticated()) return;

    const url = `${this.config.apiUrl}/sys/notifications/${notificationNo}/read`;
    this.http.post(url, {}, {
      context: new HttpContext().set(SKIP_LOADER, true)
    }).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.notification_no === notificationNo ? { ...n, status: 1 } : n)
        );
      },
      error: (err) => console.warn('Mark read failed:', err?.message)
    });
  }

  public respondRelieverRequest(notification: NotificationItem, status: number, remarks?: string, callback?: () => void): void {
    if (!notification.document_pk) return;
    const token = this.authService.getToken();
    if (!token || !this.authService.isAuthenticated()) return;

    const relieverUrl = `${this.config.apiUrl}/hrm/leave-applications/${notification.document_pk}/reliever-status`;
    this.http.put(relieverUrl, {
      status,
      remarks
    }, {
      context: new HttpContext().set(SKIP_LOADER, true)
    }).subscribe({
      next: () => {
        // Mark notification action taken
        const actionUrl = `${this.config.apiUrl}/sys/notifications/${notification.notification_no}/action`;
        this.http.post(actionUrl, {}, {
          context: new HttpContext().set(SKIP_LOADER, true)
        }).subscribe();
        this.notifications.update(list =>
          list.map(n => n.notification_no === notification.notification_no ? { ...n, status: 2 } : n)
        );
        if (callback) callback();
      },
      error: (err) => console.error('Failed to update reliever status:', err)
    });
  }
}

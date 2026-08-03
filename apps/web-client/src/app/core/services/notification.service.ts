import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/response.model';
import { AppConfigService } from './app-config.service';
import { AuthService } from './auth.service';
import { NotificationHubService } from './notification-hub.service';
import { SKIP_LOADER } from '../interceptors/loader.interceptor';

/** Poll cadence when the realtime socket is down — the only delivery path, so it stays brisk. */
const POLL_INTERVAL_DISCONNECTED_MS = 30_000;

/** Poll cadence when the socket is up. Still polls: a safety net against a missed push. */
const POLL_INTERVAL_CONNECTED_MS = 180_000;

/**
 * A button the notification itself advertises (`payload.actions`).
 *
 * The inbox never decides which buttons to show — the module that raised the notification does.
 * That is what keeps one component serving leave, purchase orders, expense reports and anything
 * added later without edits.
 */
export interface NotificationAction {
  key: string;
  label: string;
  style: 'primary' | 'success' | 'danger' | 'neutral' | string;
}

/** One page of the inbox, with totals for the pager. */
export interface NotificationPage {
  items: NotificationItem[];
  unread_count: number;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

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
  /** Buttons available right now — computed by the server per read, never stored on the row. */
  actions?: NotificationAction[];
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
  private hub = inject(NotificationHubService);

  public notifications = signal<NotificationItem[]>([]);
  public activeToast = signal<NotificationItem | null>(null);
  // No isModalOpen signal: the inbox is a MatDialog opened through the shared DialogService, so
  // the dialog owns its own lifetime. The service holds only what survives a dialog closing.
  public selectedNotification = signal<NotificationItem | null>(null);

  /** Unread total reported by the server — covers notifications beyond the loaded page. */
  private serverUnreadCount = signal<number>(0);

  public unreadCount = computed(() => this.serverUnreadCount());

  /** True when notifications are arriving over the socket rather than only by poll. */
  public readonly isLive = this.hub.connected;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs = 0;

  constructor() {
    // Follow the session: connect the socket and start polling on login, tear both down on
    // logout so the next user never inherits the previous one's stream or notification list.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.fetchNotifications();
        void this.hub.connect((payload) => this.onRealtimeNotification(payload));
      } else {
        void this.hub.disconnect();
        this.stopPolling();
        this.notifications.set([]);
        this.serverUnreadCount.set(0);
        this.activeToast.set(null);
        this.selectedNotification.set(null);
      }
    });

    // Back the poll off once the socket is carrying pushes, and speed it up again if the socket
    // drops. Polling never stops entirely while signed in — it is what guarantees delivery.
    effect(() => {
      if (!this.authService.isAuthenticated()) return;

      this.schedulePolling(
        this.hub.connected() ? POLL_INTERVAL_CONNECTED_MS : POLL_INTERVAL_DISCONNECTED_MS,
      );
    });
  }

  /**
   * A notification pushed over the socket.
   *
   * The payload is merged into the list rather than triggering a refetch, so the bell updates
   * instantly. A `null` payload means the socket reconnected after a gap and pushes may have been
   * missed, so the list is re-synced from REST instead.
   */
  private onRealtimeNotification(payload: unknown): void {
    if (payload == null) {
      this.fetchNotifications();
      return;
    }

    const item = payload as NotificationItem;
    if (typeof item?.notification_no !== 'number') return;

    const parsed: NotificationItem = {
      ...item,
      payload: item.payload_json ? this.parsePayload(item.payload_json) : null,
    };

    // A push can race the poll that already fetched the same row — never show it twice.
    if (this.notifications().some(n => n.notification_no === parsed.notification_no)) return;

    this.notifications.update(list => [parsed, ...list]);

    if (parsed.status === 0) {
      this.serverUnreadCount.update(c => c + 1);
      if (!this.activeToast()) this.activeToast.set(parsed);
    }
  }

  private schedulePolling(intervalMs: number): void {
    if (this.pollTimer && this.pollIntervalMs === intervalMs) return;

    this.stopPolling();
    this.pollIntervalMs = intervalMs;
    this.pollTimer = setInterval(() => this.fetchNotifications(), intervalMs);
  }

  private stopPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.pollIntervalMs = 0;
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
        // The endpoint returns a page envelope { items, unread_count, page, ... }.
        // The bare-array form is still accepted so a stale API doesn't blank the bell.
        const data = res?.data;
        const rawList: NotificationItem[] =
          data?.items ?? (Array.isArray(data) ? data : Array.isArray(res) ? res : []);

        if (!Array.isArray(rawList)) return;

        const parsed = rawList.map(item => ({
          ...item,
          payload: item.payload_json ? this.parsePayload(item.payload_json) : null
        }));

        // The badge counts every unread notification, not just this page's.
        this.serverUnreadCount.set(
          typeof data?.unread_count === 'number' ? data.unread_count : parsed.filter(n => n.status === 0).length
        );

        // Toast only genuinely NEW arrivals — comparing against what we already hold
        // stops the same notification re-popping on every 30s poll.
        const known = new Set(this.notifications().map(n => n.notification_no));
        const fresh = parsed.find(n => n.status === 0 && !known.has(n.notification_no));
        if (fresh && !this.activeToast()) {
          this.activeToast.set(fresh);
        }

        this.notifications.set(parsed);
        if (!this.selectedNotification() && parsed.length > 0) {
          this.selectedNotification.set(parsed[0]);
        }
      },
      error: (err) => {
        // Silent catch on network/auth error during initial boot
        console.warn('Notifications poll warning:', err?.statusText || err?.message);
      }
    });
  }

  /** A malformed payload must not take the whole bell down. */
  private parsePayload(json: string): any {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
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

        // Callers only invoke this for an unread row, and the item may not be in the bell's
        // list at all (the dialog can mark one from page 2), so the count is decremented
        // directly rather than inferred from the loaded list. Clamped at zero.
        this.serverUnreadCount.update(c => Math.max(0, c - 1));
      },
      error: (err) => console.warn('Mark read failed:', err?.message)
    });
  }

  /**
   * Loads one page for the inbox dialog — its own paging, search and filter, independent of the
   * bell's rolling list. Search and paging run on the server so they cover every notification, not
   * just the page already in memory.
   */
  public fetchPage(opts: {
    page?: number;
    pageSize?: number;
    unreadOnly?: boolean;
    search?: string;
  } = {}): Observable<ApiResponse<NotificationPage>> {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 0))
      .set('pageSize', String(opts.pageSize ?? 10))
      .set('unreadOnly', String(opts.unreadOnly ?? false));

    if (opts.search?.trim()) params = params.set('search', opts.search.trim());

    return this.http.get<ApiResponse<NotificationPage>>(
      `${this.config.apiUrl}/sys/notifications/user`,
      { params, context: new HttpContext().set(SKIP_LOADER, true) },
    );
  }

  /**
   * Performs one of the actions the notification advertised.
   *
   * Sends only the action KEY — the server resolves what that means for this document type. The
   * client never names an endpoint, so adding an actionable document type needs no frontend change.
   */
  public executeAction(
    notificationNo: number,
    actionKey: string,
    remarks?: string,
  ): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.config.apiUrl}/sys/notifications/${notificationNo}/action`,
      { action_key: actionKey, remarks: remarks || null },
      { context: new HttpContext().set(SKIP_LOADER, true) },
    );
  }

  /** Marks every unread notification read in one call, then reflects it locally. */
  public markAllAsRead(): void {
    if (!this.authService.isAuthenticated()) return;

    const url = `${this.config.apiUrl}/sys/notifications/read-all`;
    this.http.post(url, {}, {
      context: new HttpContext().set(SKIP_LOADER, true)
    }).subscribe({
      next: () => {
        // Status 2 (acted on) is stronger than read — don't downgrade it.
        this.notifications.update(list =>
          list.map(n => (n.status === 0 ? { ...n, status: 1 } : n))
        );
        this.serverUnreadCount.set(0);
        this.activeToast.set(null);
      },
      error: (err) => console.warn('Mark all read failed:', err?.message)
    });
  }

  // respondRelieverRequest was removed: reliever Accept/Reject now goes through executeAction(),
  // the one generic notification-action endpoint. Keeping a second, document-specific path would
  // mean two ways to do one thing — and that one was already broken (it PUT to
  // /hrm/leave-applications/{pk}/... when the route is /hrm/forms/hrm1301/leaves/{no}/...).
}

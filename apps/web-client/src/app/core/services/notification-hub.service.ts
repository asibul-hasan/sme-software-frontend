import { Injectable, inject, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { AppConfigService } from './app-config.service';
import { AuthService } from './auth.service';

/**
 * SignalR transport for the notification bell.
 *
 * Owns nothing but the connection: it hands every pushed notification to a callback and lets
 * `NotificationService` remain the single source of truth for bell state.
 *
 * The REST poll is NOT replaced by this. A socket can be down, blocked by a proxy, or asleep in a
 * background tab, so polling stays as the guarantee of eventual delivery and the hub is the
 * low-latency path. That is why `connect()` is safe to fail — nothing breaks, notifications just
 * arrive on the next poll instead.
 */
@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private config = inject(AppConfigService);
  private auth = inject(AuthService);

  private connection: HubConnection | null = null;
  private onNotification: ((payload: unknown) => void) | null = null;

  /** True while a live socket is up — the bell can slow its poll when this is set. */
  public readonly connected = signal(false);

  /**
   * Opens the socket if it is not already open. Idempotent, so callers can invoke it on every
   * auth change without tracking state themselves.
   */
  public async connect(handler: (payload: unknown) => void): Promise<void> {
    this.onNotification = handler;

    if (this.connection) return;
    if (!this.auth.isAuthenticated() || !this.auth.getToken()) return;

    const connection = new HubConnectionBuilder()
      .withUrl(this.hubUrl(), {
        // Read lazily on every (re)connect: SignalR calls this again when it reconnects, so a
        // token refreshed since the first handshake is picked up automatically. Returning the
        // token here is what puts it in ?access_token=, which the API only honours on /hubs.
        accessTokenFactory: () => this.auth.getToken() ?? '',
        withCredentials: false,
      })
      // Backoff rather than a fixed retry, so a server restart does not get hammered by every
      // open tab at once. null ends retries; the poll keeps working regardless.
      .withAutomaticReconnect([0, 2000, 10000, 30000, 60000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (payload: unknown) => this.onNotification?.(payload));

    connection.onreconnected(() => {
      this.connected.set(true);
      // Anything pushed while the socket was down was missed — the caller re-syncs from REST.
      this.onNotification?.(null);
    });
    connection.onreconnecting(() => this.connected.set(false));
    connection.onclose(() => this.connected.set(false));

    this.connection = connection;

    try {
      await connection.start();
      this.connected.set(true);
    } catch (err) {
      // Never surface this: realtime is an optimisation, the poll is the contract.
      console.warn('Notification hub unavailable; falling back to polling.', err);
      this.connected.set(false);
      this.connection = null;
    }
  }

  /** Closes the socket. Called on logout so the next user does not inherit this one's stream. */
  public async disconnect(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.connected.set(false);

    if (!connection || connection.state === HubConnectionState.Disconnected) return;

    try {
      await connection.stop();
    } catch {
      // Already gone — nothing to clean up.
    }
  }

  /**
   * The hub is mounted at the server root (`/hubs/notification`), not under the `/api/v1` path
   * that `apiUrl` points at, so the origin is taken from `apiUrl` and the API path dropped.
   */
  private hubUrl(): string {
    const apiUrl = this.config.apiUrl;

    try {
      return new URL('/hubs/notification', apiUrl).toString();
    } catch {
      return apiUrl.replace(/\/api\/v\d+\/?$/, '') + '/hubs/notification';
    }
  }
}

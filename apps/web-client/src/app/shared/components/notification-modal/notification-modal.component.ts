import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import {
  NotificationService,
  NotificationItem,
  NotificationAction,
} from '../../../core/services/notification.service';

const PAGE_SIZE = 5;

/** Payload accepted by `DialogService.open(NotificationModalComponent, { data })`. */
export interface NotificationDialogData {
  notificationNo?: number;
}

/**
 * The ERP-wide notification inbox, opened as a MatDialog through the shared `DialogService`.
 *
 * **Nothing here knows what a leave or a purchase order is.** Everything that varies by document
 * type comes from the notification itself: the detail table renders whatever `payload` holds, the
 * buttons come from `payload.actions` (declared by the module that raised it), and acting posts
 * the action KEY to one generic endpoint that routes it server-side. A new document type appears
 * here — with its own fields and buttons — without a line changing in this file.
 *
 * Styling is Tailwind against the app's own tokens (`bg-surface`, `text-subtle`, `border-line`,
 * `--indigo-rgb`). This project does NOT load Bootstrap; only `tailwind.css` and `styles.scss` are
 * in the build, so Bootstrap utility classes silently do nothing here.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="flex h-[640px] max-h-[85vh] flex-col overflow-hidden bg-surface text-content">
      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div class="flex items-center gap-2">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[rgba(var(--indigo-rgb),0.1)] text-indigo"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] leading-none">notifications</mat-icon>
          </span>
          <h5 class="m-0 text-xl font-bold">Notifications</h5>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-semibold text-indigo disabled:opacity-40"
            [disabled]="unreadCount() === 0"
            (click)="markAllRead()"
          >
            <mat-icon class="!h-[16px] !w-[16px] !text-[16px] leading-none">done_all</mat-icon>
            Mark all as read
          </button>
          <button
            type="button"
            class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-subtle hover:bg-muted"
            (click)="close()"
          >
            <mat-icon class="!h-[18px] !w-[18px] !text-[18px] leading-none">close</mat-icon>
          </button>
        </div>
      </div>

      <!-- ── Body ───────────────────────────────────────────── -->
      <div class="flex min-h-0 flex-1">
        <!-- List -->
        <div class="flex w-[340px] shrink-0 flex-col border-r border-line">
          <div class="p-2">
            <div class="flex items-center gap-2 rounded-[10px] border border-line px-2">
              <mat-icon class="!h-[16px] !w-[16px] !text-[16px] leading-none text-subtle">search</mat-icon>
              <input
                type="text"
                class="w-full border-0 bg-transparent py-2 text-sm text-content outline-none placeholder:text-subtle"
                placeholder="Search notifications..."
                [ngModel]="search()"
                (ngModelChange)="onSearch($event)"
              />
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto">
            @if (loading()) {
              <div class="p-4 text-center text-xs text-subtle">Loading…</div>
            } @else if (items().length === 0) {
              <div class="p-4 text-center text-xs text-subtle">No notifications found.</div>
            }

            @for (item of items(); track item.notification_no) {
              <button
                type="button"
                class="block w-full cursor-pointer border-0 border-b border-l-[3px] border-b-line bg-transparent px-3 py-2 text-left hover:bg-muted"
                [ngClass]="
                  isActive(item)
                    ? 'border-l-indigo bg-[rgba(var(--indigo-rgb),0.06)]'
                    : 'border-l-transparent'
                "
                (click)="select(item)"
              >
                <div class="flex gap-2">
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--indigo-rgb),0.1)] text-indigo"
                  >
                    <mat-icon class="!h-[17px] !w-[17px] !text-[17px] leading-none">{{
                      iconFor(item)
                    }}</mat-icon>
                  </span>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-xs font-semibold text-indigo">{{ item.form_name }}</span>
                      <span class="shrink-0 text-xxs text-subtle">{{ when(item.created_at) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-sm font-semibold">{{ item.title }}</span>
                      @if (item.status === 0) {
                        <span class="h-2 w-2 shrink-0 rounded-full bg-indigo"></span>
                      }
                    </div>
                    <div class="truncate text-xs text-subtle">{{ item.message }}</div>
                  </div>
                </div>
              </button>
            }
          </div>

          <!-- Pager -->
          <div class="shrink-0 border-t border-line px-3 py-2">
            <div class="mb-2 text-xxs text-subtle">{{ rangeLabel() }}</div>
            <div class="flex items-center gap-1">
              <button
                class="flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent text-xs disabled:opacity-40"
                [disabled]="page() === 0"
                (click)="goTo(page() - 1)"
              >
                <mat-icon class="!h-[15px] !w-[15px] !text-[15px] leading-none">arrow_back</mat-icon>
              </button>

              @for (p of pages(); track p) {
                <button
                  class="flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-lg border text-xs"
                  [ngClass]="
                    p === page()
                      ? 'border-indigo bg-indigo text-white'
                      : 'border-line bg-transparent'
                  "
                  (click)="goTo(p)"
                >
                  {{ p + 1 }}
                </button>
              }

              <button
                class="flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent text-xs disabled:opacity-40"
                [disabled]="!hasMore()"
                (click)="goTo(page() + 1)"
              >
                <mat-icon class="!h-[15px] !w-[15px] !text-[15px] leading-none">arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Detail -->
        <div class="min-w-0 flex-1 overflow-y-auto bg-muted p-3">
          @if (selected(); as active) {
            <div class="flex h-full flex-col rounded-xl border border-line bg-surface p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <span
                    class="mb-2 inline-flex items-center gap-1 rounded-full bg-[rgba(var(--indigo-rgb),0.1)] px-2.5 py-1 text-xs font-semibold text-indigo"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>{{ active.form_name }}
                  </span>
                  <h4 class="m-0 text-xl font-bold">{{ active.title }}</h4>
                </div>
                <span class="shrink-0 text-right text-xxs text-subtle">
                  Received: {{ active.created_at | date: 'MMM d, y, h:mm:ss a' }}
                </span>
              </div>

              <div class="mt-3 rounded-[10px] border border-line px-4 py-3 text-base">
                {{ active.message }}
              </div>

              <div class="flex-1"></div>

              @if (actions(active).length > 0) {
                <div class="mt-3 border-t border-line pt-3">
                  <input
                    type="text"
                    class="mb-2 w-full rounded-lg border border-input-border bg-input px-3 py-2 text-sm outline-none"
                    placeholder="Remarks (optional)"
                    [(ngModel)]="remarks"
                  />
                  <div class="flex justify-end gap-2">
                    @for (a of actions(active); track a.key) {
                      <button
                        class="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                        [ngClass]="buttonClass(a)"
                        [disabled]="busy()"
                        (click)="act(active, a)"
                      >
                        {{ a.label }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="flex h-full items-center justify-center text-xs text-subtle">
              Select a notification to see its details.
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NotificationModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<NotificationModalComponent>, { optional: true });
  private notificationService = inject(NotificationService);
  private toastr = inject(ToastrService);
  private data = inject<NotificationDialogData | null>(MAT_DIALOG_DATA, { optional: true });

  readonly items = signal<NotificationItem[]>([]);
  readonly selected = signal<NotificationItem | null>(null);
  readonly unreadCount = signal(0);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly search = signal('');

  remarks = '';

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly pages = computed(() => {
    const count = Math.ceil(this.total() / PAGE_SIZE) || 1;
    return Array.from({ length: Math.min(count, 3) }, (_, i) => i);
  });

  readonly rangeLabel = computed(() => {
    const t = this.total();
    if (t === 0) return 'No notifications';
    const from = this.page() * PAGE_SIZE + 1;
    const to = Math.min(from + this.items().length - 1, t);
    return `Showing ${from} to ${to} of ${t} notifications`;
  });

  ngOnInit(): void {
    this.load();
  }

  isActive(item: NotificationItem): boolean {
    return this.selected()?.notification_no === item.notification_no;
  }

  // ── data ──────────────────────────────────────────────────────────────────

  private load(): void {
    this.loading.set(true);

    this.notificationService
      .fetchPage({ page: this.page(), pageSize: PAGE_SIZE, search: this.search() })
      .subscribe({
        next: (res) => {
          const data = res?.data;
          const list = (data?.items ?? []).map((n) => ({
            ...n,
            payload: n.payload_json ? this.parse(n.payload_json) : null,
          }));

          this.items.set(list);
          this.total.set(data?.total ?? list.length);
          this.unreadCount.set(data?.unread_count ?? 0);
          this.hasMore.set(!!data?.has_more);
          this.loading.set(false);

          // Preference order: the row the dialog was opened on, then the current selection,
          // then the newest — so the detail pane is never pointlessly empty.
          const wanted = this.data?.notificationNo;
          const preferred = wanted ? list.find((n) => n.notification_no === wanted) : undefined;
          const current = this.selected();
          const stillHere = list.find((n) => n.notification_no === current?.notification_no);

          this.select(preferred ?? stillHere ?? list[0] ?? null);
        },
        error: () => {
          this.loading.set(false);
          this.toastr.error('Could not load notifications');
        },
      });
  }

  goTo(page: number): void {
    if (page < 0) return;
    this.page.set(page);
    this.load();
  }

  onSearch(term: string): void {
    this.search.set(term);
    // Debounced: the search hits the database, so don't fire per keystroke.
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(0);
      this.load();
    }, 300);
  }

  select(item: NotificationItem | null): void {
    this.selected.set(item);
    this.remarks = '';

    if (item && item.status === 0) {
      this.notificationService.markAsRead(item.notification_no);
      this.items.update((l) =>
        l.map((n) => (n.notification_no === item.notification_no ? { ...n, status: 1 } : n)),
      );
      this.unreadCount.update((c) => Math.max(0, c - 1));
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
    this.items.update((l) => l.map((n) => (n.status === 0 ? { ...n, status: 1 } : n)));
    this.unreadCount.set(0);
  }

  // ── generic rendering ─────────────────────────────────────────────────────

  /**
   * Buttons for this notification, as the server computed them for THIS read.
   *
   * Not read from the stored payload: actions written at dispatch time are a snapshot, so a
   * notification raised before an action existed would show no buttons forever. The server derives
   * them per request from the document's current state, so the UI infers nothing.
   */
  actions(item: NotificationItem): NotificationAction[] {
    return Array.isArray(item.actions) ? item.actions : [];
  }

  buttonClass(a: NotificationAction): string {
    switch (a.style) {
      case 'primary':
        return 'bg-indigo text-white';
      case 'success':
        return 'bg-success text-white';
      case 'danger':
        return 'border border-danger text-danger bg-transparent';
      default:
        return 'border border-line bg-transparent';
    }
  }

  /**
   * Icon by module prefix, not by individual document type — a small closed set that degrades to a
   * sensible default, so an unknown type still renders properly.
   */
  iconFor(item: NotificationItem): string {
    const type = (item.document_type || item.form_id || '').toUpperCase();
    if (type.startsWith('HRM')) return 'person';
    if (type.startsWith('PUR')) return 'shopping_cart';
    if (type.startsWith('INV')) return 'inventory_2';
    if (type.startsWith('SAL')) return 'receipt_long';
    if (type.startsWith('FIN')) return 'payments';
    return 'campaign';
  }

  /** Today → time, yesterday → "Yesterday", older → date. */
  when(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';

    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── acting ────────────────────────────────────────────────────────────────

  act(item: NotificationItem, action: NotificationAction): void {
    this.busy.set(true);

    this.notificationService.executeAction(item.notification_no, action.key, this.remarks).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.toastr.success(res?.message || `${action.label} completed`);
        this.remarks = '';
        this.notificationService.fetchNotifications(); // refresh the bell
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.toastr.error(err?.error?.message || `${action.label} failed`);
      },
    });
  }

  private parse(json: string): any {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  close(): void {
    this.dialogRef?.close();
  }
}

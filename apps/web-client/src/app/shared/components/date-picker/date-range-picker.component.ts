import {
  Component, computed, effect, ElementRef, EventEmitter, HostListener,
  inject, input, OnDestroy, Output, signal, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: AppDateRangePickerComponent, multi: true },
  ],
  styles: [`
    .adrp-host { position: relative; display: inline-block; width: 100%; }
    .adrp-input-wrap {
      display: flex;
      align-items: center;
      height: 42px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      background: var(--input-bg, #fff);
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
      cursor: pointer;
    }
    .adrp-input-wrap:focus-within {
      border-color: var(--indigo, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .adrp-input-wrap.disabled {
      background: var(--bg-secondary);
      opacity: 0.7;
      cursor: not-allowed;
    }
    .adrp-input {
      flex: 1;
      height: 100%;
      padding: 0 12px;
      font-size: var(--text-base, 13.5px);
      font-family: var(--font-family-base, inherit);
      color: var(--text-primary);
      background: transparent;
      border: none;
      outline: none;
      cursor: pointer;
      min-width: 0;
    }
    .adrp-input::placeholder { color: var(--text-secondary); }
    .adrp-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 16px;
      padding: 0 4px;
      flex-shrink: 0;
      opacity: 0.5;
    }
    .adrp-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 100%;
      flex-shrink: 0;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .adrp-icon-btn:hover { color: var(--indigo); background: rgba(99,102,241,0.05); }
    .adrp-clear {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 50%;
      font-size: 16px;
      line-height: 1;
      padding: 0;
      margin-right: 4px;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .adrp-clear:hover { background: rgba(0,0,0,0.08); color: var(--danger, #dc3545); }

    /* Popup */
    .adrp-popup {
      position: fixed;
      z-index: 999999;
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px var(--border-color, rgba(0,0,0,0.06));
      padding: 0;
      user-select: none;
      animation: adrp-pop 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes adrp-pop {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Calendar header */
    .adrp-cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 12px 8px;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    .adrp-cal-nav {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--text-secondary);
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.15s, color 0.15s;
    }
    .adrp-cal-nav:hover { background: var(--bg-secondary, #f1f3f5); color: var(--text-primary); }
    .adrp-cal-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Dual calendar grid */
    .adrp-cals {
      display: flex;
      gap: 0;
      padding: 8px 8px 4px;
    }
    .adrp-cal {
      flex: 1;
      min-width: 250px;
    }
    .adrp-cal + .adrp-cal {
      border-left: 1px solid var(--border-color, #e5e7eb);
      padding-left: 12px;
      margin-left: 12px;
    }
    .adrp-cal-month-label {
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      padding: 4px 0 8px;
    }
    .adrp-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .adrp-weekday {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      padding: 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .adrp-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
    }
    .adrp-day {
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      border-radius: 8px;
      border: none;
      background: none;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;
      position: relative;
    }
    .adrp-day:hover { background: var(--bg-secondary, #f1f3f5); }
    .adrp-day--other-month { color: var(--text-secondary); opacity: 0.35; pointer-events: none; }
    .adrp-day--today { border: 2px solid var(--indigo, #6366f1); font-weight: 700; }
    .adrp-day--start {
      background: var(--indigo, #6366f1) !important;
      color: #fff !important;
      font-weight: 700;
      border-radius: 8px 0 0 8px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    .adrp-day--end {
      background: var(--indigo, #6366f1) !important;
      color: #fff !important;
      font-weight: 700;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    .adrp-day--start-end {
      border-radius: 8px;
    }
    .adrp-day--in-range {
      background: rgba(99, 102, 241, 0.08);
      color: var(--indigo, #6366f1);
      border-radius: 0;
    }
    .adrp-day--disabled { color: var(--text-secondary); opacity: 0.3; cursor: not-allowed; pointer-events: none; }

    /* Footer */
    .adrp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .adrp-footer-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
    .adrp-footer-label strong {
      color: var(--indigo, #6366f1);
      font-weight: 700;
    }
    .adrp-footer-btns {
      display: flex;
      gap: 4px;
    }
    .adrp-footer-btn {
      padding: 5px 14px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      background: none;
    }
    .adrp-apply-btn {
      background: var(--indigo, #6366f1);
      color: #fff;
    }
    .adrp-apply-btn:hover { background: color-mix(in srgb, var(--indigo, #6366f1) 85%, black); }
    .adrp-apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .adrp-cancel-btn { color: var(--text-secondary); }
    .adrp-cancel-btn:hover { background: var(--bg-secondary, #f1f3f5); }
    .adrp-clear-btn { color: var(--text-secondary); }
    .adrp-popup.adrp-popup--up {
      top: auto;
      bottom: calc(100% + 6px);
    }
  `],
  template: `
    <div class="adrp-host">
      <div class="adrp-input-wrap" [class.disabled]="disabled()" (click)="onToggle()">
        <input
          type="text"
          class="adrp-input"
          [value]="startDisplay()"
          [placeholder]="startPlaceholder()"
          [disabled]="disabled()"
          readonly
        />
        <span class="adrp-separator">→</span>
        <input
          type="text"
          class="adrp-input"
          [value]="endDisplay()"
          [placeholder]="endPlaceholder()"
          [disabled]="disabled()"
          readonly
        />
        @if (hasValue() && !disabled()) {
          <button class="adrp-clear" (click)="clearAll($event)" type="button">&times;</button>
        }
        <button class="adrp-icon-btn" type="button">
          <span class="material-icons" style="font-size:18px">calendar_today</span>
        </button>
      </div>

      @if (isOpen()) {
        <div class="adrp-popup" [style.top.px]="popupTop()" [style.left.px]="popupLeft()">
          <!-- Navigation -->
          <div class="adrp-cal-header">
            <button class="adrp-cal-nav" (click)="navigatePrev()" type="button">&laquo;</button>
            <span class="adrp-cal-title">{{ headerLabel() }}</span>
            <button class="adrp-cal-nav" (click)="navigateNext()" type="button">&raquo;</button>
          </div>

          <!-- Dual calendars -->
          <div class="adrp-cals">
            <!-- Left calendar -->
            <div class="adrp-cal">
              <div class="adrp-cal-month-label">{{ monthLabel(leftMonth()) }}</div>
              <div class="adrp-weekdays">
                @for (d of weekDays; track d) { <div class="adrp-weekday">{{ d }}</div> }
              </div>
              <div class="adrp-days">
                @for (day of leftDays(); track day.key) {
                  <button
                    class="adrp-day"
                    [class.adrp-day--other-month]="day.otherMonth"
                    [class.adrp-day--today]="day.isToday"
                    [class.adrp-day--start]="day.isStart"
                    [class.adrp-day--end]="day.isEnd"
                    [class.adrp-day--start-end]="day.isStartEnd"
                    [class.adrp-day--in-range]="day.inRange"
                    [class.adrp-day--disabled]="day.disabled"
                    (click)="selectDay(day); $event.stopPropagation()"
                    type="button"
                  >{{ day.date.date() }}</button>
                }
              </div>
            </div>

            <!-- Right calendar -->
            <div class="adrp-cal">
              <div class="adrp-cal-month-label">{{ monthLabel(rightMonth()) }}</div>
              <div class="adrp-weekdays">
                @for (d of weekDays; track d) { <div class="adrp-weekday">{{ d }}</div> }
              </div>
              <div class="adrp-days">
                @for (day of rightDays(); track day.key) {
                  <button
                    class="adrp-day"
                    [class.adrp-day--other-month]="day.otherMonth"
                    [class.adrp-day--today]="day.isToday"
                    [class.adrp-day--start]="day.isStart"
                    [class.adrp-day--end]="day.isEnd"
                    [class.adrp-day--start-end]="day.isStartEnd"
                    [class.adrp-day--in-range]="day.inRange"
                    [class.adrp-day--disabled]="day.disabled"
                    (click)="selectDay(day); $event.stopPropagation()"
                    type="button"
                  >{{ day.date.date() }}</button>
                }
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="adrp-footer">
            <div class="adrp-footer-label">
              @if (pendingStart() && pendingEnd()) {
                <strong>{{ formatShort(pendingStart()) }}</strong> → <strong>{{ formatShort(pendingEnd()) }}</strong>
                <span style="margin-left:6px">({{ dayCount() }} day{{ dayCount() !== 1 ? 's' : '' }})</span>
              } @else if (pendingStart()) {
                <strong>{{ formatShort(pendingStart()) }}</strong> → select end
              } @else {
                Select start date
              }
            </div>
            <div class="adrp-footer-btns">
              <button class="adrp-footer-btn adrp-clear-btn" (click)="clearPending($event)" type="button">Clear</button>
              <button class="adrp-footer-btn adrp-cancel-btn" (click)="isOpen.set(false)" type="button">Cancel</button>
              <button
                class="adrp-footer-btn adrp-apply-btn"
                [disabled]="!pendingStart() || !pendingEnd()"
                (click)="applyRange()"
                type="button"
              >Apply</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AppDateRangePickerComponent implements ControlValueAccessor, OnDestroy {
  readonly startPlaceholder = input('Start date');
  readonly endPlaceholder = input('End date');
  readonly disabled = input(false);
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);

  readonly rangeChange = new EventEmitter<DateRange>();

  readonly isOpen = signal(false);
  readonly viewYear = signal(dayjs().year());
  readonly viewMonth = signal(dayjs().month());

  // Committed values
  readonly committedStart = signal<string | null>(null);
  readonly committedEnd = signal<string | null>(null);

  // Pending selection (set while calendar is open)
  readonly pendingStart = signal<string | null>(null);
  readonly pendingEnd = signal<string | null>(null);

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  private onChange: (v: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly leftMonth = computed(() => this.viewMonth());
  readonly rightMonth = computed(() => {
    const m = this.viewMonth() + 1;
    return m > 11 ? 0 : m;
  });

  readonly headerLabel = computed(() => {
    const lm = this.leftMonth();
    const rm = this.rightMonth();
    const y = this.viewYear();
    const ry = rm === 0 ? y + 1 : y;
    return `${this.monthLabels[lm]} ${y}  —  ${this.monthLabels[rm]} ${ry}`;
  });

  readonly startDisplay = computed(() => {
    const v = this.committedStart();
    return v ? this.formatShort(v) : '';
  });

  readonly endDisplay = computed(() => {
    const v = this.committedEnd();
    return v ? this.formatShort(v) : '';
  });

  readonly hasValue = computed(() => !!this.committedStart() || !!this.committedEnd());

  readonly dayCount = computed(() => {
    const s = this.pendingStart();
    const e = this.pendingEnd();
    if (!s || !e) return 0;
    return dayjs(e).diff(dayjs(s), 'day') + 1;
  });

  readonly leftDays = computed(() => this.buildCalendarDays(this.viewYear(), this.leftMonth()));
  readonly rightDays = computed(() => {
    const m = this.rightMonth();
    const y = m === 0 ? this.viewYear() + 1 : this.viewYear();
    return this.buildCalendarDays(y, m);
  });

  private elementRef = inject(ElementRef);
  readonly popupTop = signal(0);
  readonly popupLeft = signal(0);

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: EventTarget | null): void {
    if (this.isOpen() && target && !this.elementRef.nativeElement.contains(target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowScroll(): void {
    if (this.isOpen()) {
      this.checkPosition();
    }
  }

  checkPosition(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const popupHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < popupHeight && rect.top > popupHeight) {
      this.popupTop.set(Math.max(8, rect.top - popupHeight - 4));
    } else {
      this.popupTop.set(rect.bottom + 4);
    }
    const popupWidth = 540;
    const maxLeft = window.innerWidth - popupWidth - 10;
    this.popupLeft.set(Math.min(Math.max(8, rect.left), maxLeft));
  }

  ngOnDestroy(): void {}

  // ControlValueAccessor
  writeValue(v: DateRange | null): void {
    this.committedStart.set(v?.startDate ?? null);
    this.committedEnd.set(v?.endDate ?? null);
  }
  registerOnChange(fn: (v: DateRange | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {}

  onToggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.isOpen.set(false);
    } else {
      this.checkPosition();
      this.pendingStart.set(this.committedStart());
      this.pendingEnd.set(this.committedEnd());
      this.isOpen.set(true);
      this.onTouched();
    }
  }

  navigatePrev(): void {
    this.viewMonth.update(m => {
      if (m === 0) { this.viewYear.update(y => y - 1); return 11; }
      return m - 1;
    });
  }

  navigateNext(): void {
    this.viewMonth.update(m => {
      if (m === 11) { this.viewYear.update(y => y + 1); return 0; }
      return m + 1;
    });
  }

  selectDay(day: { date: Dayjs; disabled: boolean }): void {
    if (day.disabled) return;
    const dateStr = day.date.format('YYYY-MM-DD');

    if (!this.pendingStart() || (this.pendingStart() && this.pendingEnd())) {
      // Start fresh selection
      this.pendingStart.set(dateStr);
      this.pendingEnd.set(null);
    } else {
      // Set end date
      const start = dayjs(this.pendingStart());
      if (day.date.isBefore(start, 'day')) {
        this.pendingStart.set(dateStr);
        this.pendingEnd.set(null);
      } else {
        this.pendingEnd.set(dateStr);
      }
    }
  }

  applyRange(): void {
    const range: DateRange = { startDate: this.pendingStart(), endDate: this.pendingEnd() };
    this.committedStart.set(range.startDate);
    this.committedEnd.set(range.endDate);
    this.onChange(range);
    this.rangeChange.emit(range);
    this.isOpen.set(false);
  }

  clearPending(event: Event): void {
    event.stopPropagation();
    this.pendingStart.set(null);
    this.pendingEnd.set(null);
  }

  clearAll(event: Event): void {
    event.stopPropagation();
    this.committedStart.set(null);
    this.committedEnd.set(null);
    this.pendingStart.set(null);
    this.pendingEnd.set(null);
    this.onChange(null);
    this.rangeChange.emit({ startDate: null, endDate: null });
    this.isOpen.set(false);
  }

  monthLabel(m: number): string { return this.monthLabels[m]; }

  formatShort(dateStr: string | null): string {
    if (!dateStr) return '';
    return dayjs(dateStr).format('DD/MM/YYYY');
  }

  private buildCalendarDays(year: number, month: number): Array<{
    date: Dayjs; key: string; otherMonth: boolean; isToday: boolean;
    isStart: boolean; isEnd: boolean; isStartEnd: boolean; inRange: boolean; disabled: boolean;
  }> {
    const first = dayjs(new Date(year, month, 1));
    const startDay = first.day();
    const daysInMonth = first.daysInMonth();
    const today = dayjs().startOf('day');
    const ps = this.pendingStart() ? dayjs(this.pendingStart()) : null;
    const pe = this.pendingEnd() ? dayjs(this.pendingEnd()) : null;
    const minDate = this.min() ? dayjs(this.min()) : null;
    const maxDate = this.max() ? dayjs(this.max()) : null;

    const result: Array<{
      date: Dayjs; key: string; otherMonth: boolean; isToday: boolean;
      isStart: boolean; isEnd: boolean; isStartEnd: boolean; inRange: boolean; disabled: boolean;
    }> = [];

    // Previous month fill
    const prev = first.subtract(1, 'month');
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prev.date(prev.daysInMonth() - i);
      result.push(this.makeDay(d, today, ps, pe, minDate, maxDate, true));
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = first.date(i);
      result.push(this.makeDay(d, today, ps, pe, minDate, maxDate, false));
    }

    // Next month fill (42 cells = 6 rows)
    const remaining = 42 - result.length;
    const next = first.add(1, 'month');
    for (let i = 1; i <= remaining; i++) {
      const d = next.date(i);
      result.push(this.makeDay(d, today, ps, pe, minDate, maxDate, true));
    }

    return result;
  }

  private makeDay(
    d: Dayjs, today: Dayjs, ps: Dayjs | null, pe: Dayjs | null,
    minDate: Dayjs | null, maxDate: Dayjs | null, otherMonth: boolean,
  ) {
    const isStart = ps ? d.isSame(ps, 'day') : false;
    const isEnd = pe ? d.isSame(pe, 'day') : false;
    const isStartEnd = isStart && isEnd;
    const inRange = ps && pe ? d.isAfter(ps, 'day') && d.isBefore(pe, 'day') : false;
    const disabled = !!(minDate && d.isBefore(minDate, 'day')) || !!(maxDate && d.isAfter(maxDate, 'day'));

    return {
      date: d,
      key: d.format('YYYY-MM-DD'),
      otherMonth,
      isToday: d.isSame(today, 'day'),
      isStart,
      isEnd,
      isStartEnd,
      inRange,
      disabled,
    };
  }
}

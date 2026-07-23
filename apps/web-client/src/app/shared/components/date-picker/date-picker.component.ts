import {
  Component, computed, effect, ElementRef, EventEmitter, HostListener,
  inject, input, OnDestroy, Output, signal, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: AppDatePickerComponent, multi: true },
  ],
  styles: [`
    .adp-host { position: relative; display: inline-block; width: 100%; }
    .adp-input-wrap { position: relative; display: flex; align-items: center; }
    .adp-input {
      width: 100%;
      height: 42px;
      padding: 0 36px 0 12px;
      font-size: var(--text-base, 13.5px);
      font-family: var(--font-family-base, inherit);
      color: var(--text-primary);
      background: var(--input-bg, #fff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      cursor: pointer;
      box-sizing: border-box;
    }
    .adp-input:focus {
      border-color: var(--indigo, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .adp-input:disabled { background: var(--bg-secondary); opacity: 0.7; cursor: not-allowed; }
    .adp-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-secondary);
      font-size: 18px;
    }
    .adp-clear {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 50%;
      font-size: 16px;
      line-height: 1;
      padding: 0;
      transition: background 0.15s, color 0.15s;
    }
    .adp-clear:hover { background: rgba(0,0,0,0.08); color: var(--danger, #dc3545); }
    .adp-popup {
      position: fixed;
      z-index: 999999;
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px var(--border-color, rgba(0,0,0,0.06));
      padding: 0;
      min-width: 280px;
      user-select: none;
      animation: adp-pop 0.15s ease-out;
    }
    .adp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 12px 8px;
    }
    .adp-header-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      border: none;
      background: none;
      transition: background 0.15s;
    }
    .adp-header-title:hover { background: var(--bg-secondary, #f1f3f5); }
    .adp-nav-btn {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      font-size: 18px;
    }
    .adp-nav-btn:hover { background: var(--bg-secondary, #f1f3f5); color: var(--text-primary); }
    .adp-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      padding: 0 8px;
      margin-bottom: 4px;
    }
    .adp-weekday {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      padding: 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .adp-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      padding: 0 8px 8px;
    }
    .adp-day {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      border-radius: 8px;
      cursor: pointer;
      margin: 0 auto;
      transition: background 0.12s, color 0.12s;
    }
    .adp-day:hover:not(.adp-day--disabled) { background: var(--bg-secondary, #f1f3f5); }
    .adp-day--other-month { color: var(--text-secondary); opacity: 0.35; }
    .adp-day--today { font-weight: 800; color: var(--indigo, #6366f1); box-shadow: inset 0 0 0 1.5px var(--indigo, #6366f1); }
    .adp-day--selected { background: var(--indigo, #6366f1) !important; color: #fff !important; font-weight: 700; }
    .adp-day--disabled { opacity: 0.3; cursor: not-allowed; }
    .adp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .adp-footer-btn {
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
      background: none;
    }
    .adp-today-btn { color: var(--indigo, #6366f1); }
    .adp-today-btn:hover { background: rgba(99,102,241,0.08); }
    .adp-clear-btn { color: var(--text-secondary); }
    .adp-clear-btn:hover { background: var(--bg-secondary, #f1f3f5); }
    .adp-month-grid, .adp-year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 12px;
    }
    .adp-month-btn, .adp-year-btn {
      padding: 10px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid var(--border-color, #e5e7eb);
      background: var(--card-bg, #fff);
      color: var(--text-primary);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .adp-month-btn:hover, .adp-year-btn:hover { border-color: var(--indigo, #6366f1); color: var(--indigo, #6366f1); }
    .adp-month-btn--selected, .adp-year-btn--selected { background: var(--indigo, #6366f1); color: #fff; border-color: var(--indigo, #6366f1); }
  `],
  template: `
    <div class="adp-host">
      <div class="adp-input-wrap" (click)="toggleOpen()">
        <input
          type="text"
          class="form-control adp-input"
          [class]="inputClass()"
          [value]="displayText()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          (focus)="onInputFocus()"
          (keydown)="onInputKeydown($event)"
          readonly
        />
        @if (value() && !disabled()) {
          <button class="adp-clear" (click)="clearValue($event)" type="button">&times;</button>
        } @else {
          <span class="adp-icon material-icons" style="font-size:18px">calendar_today</span>
        }
      </div>

      @if (isOpen()) {
        <div class="adp-popup" [style.top.px]="popupTop()" [style.left.px]="popupLeft()">
          @if (viewMode() === 'days') {
            <div class="adp-header">
              <button class="adp-nav-btn" (click)="navigatePrev()" type="button">&lsaquo;</button>
              <button class="adp-header-title" (click)="viewMode.set('months')" type="button">
                {{ monthLabel() }} {{ viewYear() }}
              </button>
              <button class="adp-nav-btn" (click)="navigateNext()" type="button">&rsaquo;</button>
            </div>
            <div class="adp-weekdays">
              @for (day of weekDays; track day) {
                <div class="adp-weekday">{{ day }}</div>
              }
            </div>
            <div class="adp-days">
              @for (day of calendarDays(); track day.key) {
                <button
                  class="adp-day"
                  [class.adp-day--other-month]="day.otherMonth"
                  [class.adp-day--today]="day.isToday"
                  [class.adp-day--selected]="day.isSelected"
                  [class.adp-day--disabled]="day.disabled"
                  (click)="selectDay(day); $event.stopPropagation()"
                  type="button"
                  [attr.tabindex]="day.otherMonth ? -1 : 0"
                >
                  {{ day.date.date() }}
                </button>
              }
            </div>
            <div class="adp-footer">
              <button class="adp-footer-btn adp-today-btn" (click)="selectToday()" type="button">Today</button>
              <button class="adp-footer-btn adp-clear-btn" (click)="clearValue($event)" type="button">Clear</button>
            </div>
          } @else if (viewMode() === 'months') {
            <div class="adp-header">
              <button class="adp-nav-btn" (click)="prevYear()" type="button">&lsaquo;</button>
              <button class="adp-header-title" (click)="viewMode.set('years')" type="button">{{ viewYear() }}</button>
              <button class="adp-nav-btn" (click)="nextYear()" type="button">&rsaquo;</button>
            </div>
            <div class="adp-month-grid">
              @for (m of monthLabels; track m.index; let i = $index) {
                <button
                  class="adp-month-btn"
                  [class.adp-month-btn--selected]="isMonthSelected(i)"
                  (click)="selectMonth(i); $event.stopPropagation()"
                  type="button"
                >
                  {{ m.label }}
                </button>
              }
            </div>
          } @else if (viewMode() === 'years') {
            <div class="adp-header">
              <button class="adp-nav-btn" (click)="prevYearPage()" type="button">&lsaquo;</button>
              <button class="adp-header-title" type="button">{{ yearRangeLabel() }}</button>
              <button class="adp-nav-btn" (click)="nextYearPage()" type="button">&rsaquo;</button>
            </div>
            <div class="adp-year-grid">
              @for (y of yearRange(); track y) {
                <button
                  class="adp-year-btn"
                  [class.adp-year-btn--selected]="isYearSelected(y)"
                  (click)="selectYear(y); $event.stopPropagation()"
                  type="button"
                >
                  {{ y }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AppDatePickerComponent implements ControlValueAccessor, OnDestroy {
  readonly value = signal<string | null>(null);
  readonly placeholder = input('Select date');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly inputClass = input('');
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);

  readonly valueChange = new EventEmitter<string | null>();

  readonly isOpen = signal(false);
  readonly viewMode = signal<'days' | 'months' | 'years'>('days');
  readonly viewYear = signal(dayjs().year());
  readonly viewMonth = signal(dayjs().month());

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthLabels = [
    { index: 0, label: 'Jan' }, { index: 1, label: 'Feb' }, { index: 2, label: 'Mar' },
    { index: 3, label: 'Apr' }, { index: 4, label: 'May' }, { index: 5, label: 'Jun' },
    { index: 6, label: 'Jul' }, { index: 7, label: 'Aug' }, { index: 8, label: 'Sep' },
    { index: 9, label: 'Oct' }, { index: 10, label: 'Nov' }, { index: 11, label: 'Dec' },
  ];

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private closeOnOutsideClick = false;

  readonly displayText = computed(() => {
    const v = this.value();
    if (!v) return '';
    const d = dayjs(v);
    return d.isValid() ? d.format('DD/MM/YYYY') : v;
  });

  readonly monthLabel = computed(() => this.monthLabels[this.viewMonth()]?.label ?? '');

  readonly calendarDays = computed(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const first = dayjs(new Date(year, month, 1));
    const startDay = first.day();
    const daysInMonth = first.daysInMonth();
    const today = dayjs().startOf('day');
    const selected = this.value() ? dayjs(this.value()) : null;
    const minDate = this.min() ? dayjs(this.min()) : null;
    const maxDate = this.max() ? dayjs(this.max()) : null;

    const result: Array<{
      date: Dayjs; key: string; otherMonth: boolean; isToday: boolean; isSelected: boolean; disabled: boolean;
    }> = [];

    // Previous month fill
    const prevMonth = first.subtract(1, 'month');
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonth.date(prevMonth.daysInMonth() - i);
      result.push(this.makeDay(d, today, selected, minDate, maxDate, true));
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = first.date(i);
      result.push(this.makeDay(d, today, selected, minDate, maxDate, false));
    }

    // Next month fill (always 42 cells = 6 rows)
    const remaining = 42 - result.length;
    const nextMonth = first.add(1, 'month');
    for (let i = 1; i <= remaining; i++) {
      const d = nextMonth.date(i);
      result.push(this.makeDay(d, today, selected, minDate, maxDate, true));
    }

    return result;
  });

  readonly yearRange = computed(() => {
    const base = this.viewYear();
    const start = base - (base % 12) - 1;
    const years: number[] = [];
    for (let i = 0; i < 12; i++) years.push(start + i + 1);
    return years;
  });

  readonly yearRangeLabel = computed(() => {
    const range = this.yearRange();
    return `${range[0]} – ${range[range.length - 1]}`;
  });

  private elementRef = inject(ElementRef);
  readonly popupTop = signal(0);
  readonly popupLeft = signal(0);

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (this.isOpen() && target && !this.elementRef.nativeElement.contains(target as Node)) {
      this.isOpen.set(false);
      this.viewMode.set('days');
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowScroll(): void {
    if (this.isOpen()) {
      this.checkPosition();
    }
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.viewMode.set('days');
    } else {
      this.checkPosition();
      this.isOpen.set(true);
      this.onTouched();
    }
  }

  checkPosition(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const popupHeight = 315;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < popupHeight && rect.top > popupHeight) {
      this.popupTop.set(Math.max(8, rect.top - popupHeight - 4));
    } else {
      this.popupTop.set(rect.bottom + 4);
    }
    const maxLeft = window.innerWidth - 290;
    this.popupLeft.set(Math.min(Math.max(8, rect.left), maxLeft));
  }

  ngOnDestroy(): void {}

  // ControlValueAccessor
  writeValue(v: string | null): void {
    this.value.set(v || null);
    if (v) {
      const d = dayjs(v);
      if (d.isValid()) {
        this.viewYear.set(d.year());
        this.viewMonth.set(d.month());
      }
    }
  }

  registerOnChange(fn: (v: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {}

  onInputFocus(): void {
    if (!this.disabled()) {
      this.checkPosition();
      this.isOpen.set(true);
      this.onTouched();
    }
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
      this.viewMode.set('days');
    }
  }

  navigatePrev(): void {
    if (this.viewMode() === 'days') {
      this.viewMonth.update(m => {
        if (m === 0) { this.viewYear.update(y => y - 1); return 11; }
        return m - 1;
      });
    }
  }

  navigateNext(): void {
    if (this.viewMode() === 'days') {
      this.viewMonth.update(m => {
        if (m === 11) { this.viewYear.update(y => y + 1); return 0; }
        return m + 1;
      });
    }
  }

  prevYear(): void { this.viewYear.update(y => y - 1); }
  nextYear(): void { this.viewYear.update(y => y + 1); }
  prevYearPage(): void { this.viewYear.update(y => y - 12); }
  nextYearPage(): void { this.viewYear.update(y => y + 12); }

  selectDay(day: { date: Dayjs; otherMonth: boolean; disabled: boolean }): void {
    if (day.disabled || day.otherMonth) return;
    const formatted = day.date.format('YYYY-MM-DD');
    this.value.set(formatted);
    this.onChange(formatted);
    this.valueChange.emit(formatted);
    this.isOpen.set(false);
    this.viewMode.set('days');
  }

  selectToday(): void {
    const today = dayjs().format('YYYY-MM-DD');
    this.value.set(today);
    this.onChange(today);
    this.valueChange.emit(today);
    this.isOpen.set(false);
    this.viewMode.set('days');
  }

  selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.viewMode.set('days');
  }

  selectYear(year: number): void {
    this.viewYear.set(year);
    this.viewMode.set('months');
  }

  isMonthSelected(m: number): boolean {
    return this.viewMonth() === m && this.viewYear() === dayjs(this.value() || undefined).year();
  }

  isYearSelected(y: number): boolean {
    return y === dayjs(this.value() || undefined).year();
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
    this.isOpen.set(false);
    this.viewMode.set('days');
  }

  private makeDay(
    d: Dayjs, today: Dayjs, selected: Dayjs | null,
    minDate: Dayjs | null, maxDate: Dayjs | null, otherMonth: boolean,
  ) {
    return {
      date: d,
      key: d.format('YYYY-MM-DD'),
      otherMonth,
      isToday: d.isSame(today, 'day'),
      isSelected: selected ? d.isSame(selected, 'day') : false,
      disabled: !!(minDate && d.isBefore(minDate, 'day')) || !!(maxDate && d.isAfter(maxDate, 'day')),
    };
  }
}

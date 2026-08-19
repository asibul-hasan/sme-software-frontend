import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppDecimalPipe } from '@app/shared/pipes/app-decimal.pipe';
import { UiModalComponent } from '@app/shared/ui/modal/ui-modal.component';
import { UiBadgeComponent } from '@app/shared/ui/badge/ui-badge.component';
import { MatIconModule } from '@angular/material/icon';
import { ColumnDef, BadgeConfig } from './table.types';

interface FieldGroup {
  label: string;
  value: unknown;
  displayValue: string;
  cellType: string;
  col: ColumnDef;
}

@Component({
  selector: 'app-table-view-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiBadgeComponent, MatIconModule],
  providers: [AppDecimalPipe],
  template: `
    <ui-modal [(open)]="isOpen" [title]="title()" [maxWidth]="640">
      <div class="d-flex flex-column">
        @for (group of fieldGroups(); track group.col.field) {
          <div class="d-flex align-items-start py-2 border-bottom" style="gap:16px;border-color:var(--border-color)">
            <span class="fw-semibold text-muted" style="flex:0 0 160px;font-size:13px;padding-top:2px">{{ group.label }}</span>
            <span style="flex:1;font-size:14px;color:var(--text-primary);word-break:break-word">
              @switch (group.cellType) {
                @case ('badge') {
                  @if (getBadgeConfig(group); as badge) {
                    <ui-badge [variant]="badge.variant">{{ badge.label }}</ui-badge>
                  }
                }
                @case ('checkbox') {
                  @if (group.value) {
                    <mat-icon class="text-success" style="font-size:18px;width:18px;height:18px">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="text-muted" style="font-size:18px;width:18px;height:18px;opacity:0.5">cancel</mat-icon>
                  }
                }
                @case ('icon') { <mat-icon style="font-size:20px;width:20px;height:20px">{{ group.value }}</mat-icon> }
                @default { {{ group.displayValue }} }
              }
            </span>
          </div>
        } @empty {
          <div class="text-center text-muted py-4" style="opacity:0.6">No data available</div>
        }
      </div>
    </ui-modal>
  `,
})
export class TableViewModalComponent {
  readonly open = input(false);
  readonly columns = input<ColumnDef[]>([]);
  readonly row = input<Record<string, unknown> | null>(null);
  readonly title = input('View Details');
  readonly openChange = output<boolean>();

  private readonly datePipe = new DatePipe('en-US');
  private readonly appDecimalPipe = inject(AppDecimalPipe);
  readonly isOpen = signal(false);

  constructor() {
    effect(() => this.isOpen.set(this.open()));
    effect(() => { const v = this.isOpen(); if (v !== this.open()) this.openChange.emit(v); });
  }

  readonly fieldGroups = computed<FieldGroup[]>(() => {
    const r = this.row();
    if (!r) return [];
    return this.columns()
      .filter((col) => col.cellType !== 'button')
      .map((col) => ({
        label: col.title,
        value: r[col.field],
        displayValue: this.formatValue(r[col.field], col),
        cellType: col.cellType || 'text',
        col,
      }));
  });

  getBadgeConfig(group: FieldGroup): BadgeConfig | null {
    return group.col.badgeConfig ? group.col.badgeConfig(group.value, this.row()!) : null;
  }

  private formatValue(value: unknown, col: ColumnDef): string {
    if (value == null || value === '') return '-';
    switch (col.cellType) {
      case 'date': case 'datepipe':
        return this.datePipe.transform(value as string | number | Date, col.dateFormat || 'mediumDate') || String(value);
      case 'number': case 'decimal': case 'currency': {
        const n = Number(value); if (isNaN(n)) return String(value);
        // Same precision the parent table uses — a locked 'en-US' with a `?? 2` fallback
        // meant this modal could disagree with the very row it was opened from.
        const f = this.appDecimalPipe.transform(n, col.cellType === 'number' ? (col.precision ?? 0) : col.precision);
        return col.cellType === 'currency' ? `${col.currencyCode || ''} ${f}`.trim() : (f || String(value));
      }
      case 'select': {
        if (!col.options) return String(value);
        const opts = typeof col.options === 'function' ? col.options(this.row()!) : col.options;
        const lk = col.labelKey || 'label', vk = col.valueKey || 'value';
        const o = opts.find((x) => (x as unknown as Record<string, unknown>)[vk] === value);
        return o ? String((o as unknown as Record<string, unknown>)[lk]) : String(value);
      }
      case 'checkbox': return value ? 'Yes' : 'No';
      default: return String(value);
    }
  }
}

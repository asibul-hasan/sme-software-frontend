import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, NzButtonModule, NzIconModule],
  template: `
    <div
      class="flex flex-col items-center justify-center text-center select-none"
      [class.py-12]="!compact"
      [class.px-6]="!compact"
      [class.py-6]="compact"
      [class.px-4]="compact"
      [class.bg-white]="!transparent"
      [class.rounded-xl]="!compact"
      [class.border]="!transparent && !compact"
      [class.border-slate-200]="!transparent && !compact"
    >
      <!-- State Icon Badge -->
      <div
        class="rounded-full flex items-center justify-center mb-2.5 shadow-2xs transition-transform duration-200 hover:scale-105"
        [ngClass]="iconBgClass()"
        [class.w-14]="!compact"
        [class.h-14]="!compact"
        [class.w-11]="compact"
        [class.h-11]="compact"
      >
        <span
          nz-icon
          [nzType]="resolvedIcon()"
          [class.text-2xl]="!compact"
          [class.text-lg]="compact"
          [ngClass]="iconColorClass()"
        ></span>
      </div>

      <!-- Title -->
      @if (title) {
        <h3
          class="font-bold text-slate-800 m-0 leading-snug"
          [class.text-base]="!compact"
          [class.text-sm]="compact"
        >
          {{ title }}
        </h3>
      }

      <!-- Description / Subtitle -->
      @if (description) {
        <p
          class="text-slate-500 m-0 mt-1 max-w-md leading-relaxed"
          [class.text-xs]="compact"
          [class.text-sm]="!compact"
        >
          {{ description }}
        </p>
      }

      <!-- Custom Injected Body Content -->
      <div class="text-xs text-slate-400">
        <ng-content></ng-content>
      </div>

      <!-- Actionable CTAs -->
      @if (actionText || secondaryActionText || hasCustomActions) {
        <div class="mt-3.5 flex flex-wrap items-center justify-center gap-2">
          <!-- Primary CTA (Router Link or Action Click) -->
          @if (actionText) {
            @if (actionRoute) {
              <a
                nz-button
                nzType="primary"
                [routerLink]="actionRoute"
                class="rounded-lg font-semibold inline-flex items-center gap-1.5 shadow-xs"
                [attr.aria-label]="actionText"
              >
                @if (actionIcon) {
                  <span nz-icon [nzType]="actionIcon"></span>
                }
                <span>{{ actionText }}</span>
              </a>
            } @else {
              <button
                type="button"
                nz-button
                nzType="primary"
                (click)="onActionClick()"
                class="rounded-lg font-semibold inline-flex items-center gap-1.5 shadow-xs"
                [attr.aria-label]="actionText"
              >
                @if (actionIcon) {
                  <span nz-icon [nzType]="actionIcon"></span>
                }
                <span>{{ actionText }}</span>
              </button>
            }
          }

          <!-- Secondary Action (e.g. Reset filter / Refresh) -->
          @if (secondaryActionText) {
            <button
              type="button"
              nz-button
              nzType="default"
              (click)="onSecondaryActionClick()"
              class="rounded-lg font-medium inline-flex items-center gap-1.5 border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400"
              [attr.aria-label]="secondaryActionText"
            >
              @if (secondaryActionIcon) {
                <span nz-icon [nzType]="secondaryActionIcon"></span>
              }
              <span>{{ secondaryActionText }}</span>
            </button>
          }

          <!-- Projected Actions Slot -->
          <ng-content select="[actions]"></ng-content>
        </div>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title?: string;
  @Input() description = 'No data available';
  @Input() image = 'simple';
  @Input() stateType: 'empty' | 'filtered' | 'error' | 'offline' | 'success' = 'empty';
  @Input() icon?: string;

  // Primary Action
  @Input() actionText?: string;
  @Input() actionIcon = 'plus';
  @Input() actionRoute?: string | any[];
  @Output() actionClick = new EventEmitter<void>();

  // Secondary Action
  @Input() secondaryActionText?: string;
  @Input() secondaryActionIcon = 'reload';
  @Output() secondaryActionClick = new EventEmitter<void>();

  // Layout modifiers
  @Input() compact = false;
  @Input() transparent = false;
  @Input() hasCustomActions = false;

  resolvedIcon(): string {
    if (this.icon) return this.icon;
    switch (this.stateType) {
      case 'filtered': return 'filter';
      case 'error': return 'warning';
      case 'offline': return 'disconnect';
      case 'success': return 'check-circle';
      case 'empty':
      default: return 'inbox';
    }
  }

  iconBgClass(): string {
    switch (this.stateType) {
      case 'filtered': return 'bg-amber-50 border border-amber-200';
      case 'error': return 'bg-rose-50 border border-rose-200';
      case 'offline': return 'bg-purple-50 border border-purple-200';
      case 'success': return 'bg-emerald-50 border border-emerald-200';
      case 'empty':
      default: return 'bg-slate-100 border border-slate-200';
    }
  }

  iconColorClass(): string {
    switch (this.stateType) {
      case 'filtered': return 'text-amber-600';
      case 'error': return 'text-rose-600';
      case 'offline': return 'text-purple-600';
      case 'success': return 'text-emerald-600';
      case 'empty':
      default: return 'text-slate-400';
    }
  }

  onActionClick(): void {
    this.actionClick.emit();
  }

  onSecondaryActionClick(): void {
    this.secondaryActionClick.emit();
  }
}

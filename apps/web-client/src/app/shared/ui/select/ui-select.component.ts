import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { UiIconComponent } from '../icon/ui-icon.component';

interface UiSelectOption {
  label: string;
  value: unknown;
}

/**
 * Searchable single-select — replaces `@ng-select/ng-select`.
 * A `ControlValueAccessor`: works with `formControlName` / `ngModel`.
 *
 *   <ui-select formControlName="country" [options]="countries"
 *              labelKey="label" valueKey="value"
 *              placeholder="Select country" />
 *
 * `options` may be objects (use `labelKey`/`valueKey`) or primitives.
 */
@Component({
  selector: 'ui-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
  template: `
    <button
      type="button"
      class="ui-select-trigger"
      [class.ui-select-trigger--invalid]="invalid()"
      [class.ui-select-trigger--open]="isOpen()"
      [disabled]="disabled()"
      (click)="toggle()"
      (blur)="onTouched()"
    >
      <span
        class="ui-select-value"
        [class.ui-select-placeholder]="!selectedLabel()"
      >
        {{ selectedLabel() || placeholder() }}
      </span>
      @if (clearable() && selectedLabel() && !disabled()) {
        <span class="ui-select-clear" (click)="clear($event)">
          <ui-icon [size]="15">close</ui-icon>
        </span>
      }
      <ui-icon [size]="20" class="ui-select-arrow">expand_more</ui-icon>
    </button>

    <ng-template #panel>
      <div class="ui-select-panel" [style.width.px]="panelWidth()">
        @if (searchable()) {
          <div class="ui-select-search">
            <ui-icon [size]="16">search</ui-icon>
            <input
              #searchBox
              type="text"
              [value]="query()"
              (input)="query.set(searchBox.value)"
              placeholder="Search…"
            />
          </div>
        }
        <div class="ui-select-options" role="listbox">
          @for (opt of filtered(); track opt.value) {
            <button
              type="button"
              role="option"
              class="ui-select-option"
              [class.ui-select-option--active]="opt.value === value()"
              (click)="select(opt)"
            >
              {{ opt.label }}
            </button>
          } @empty {
            <div class="ui-select-empty">No results</div>
          }
        </div>
      </div>
    </ng-template>
  `,
  host: { class: 'block w-full' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
  styles: `
    .ui-select-trigger {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      height: 42px;
      padding: 0 8px 0 12px;
      background: var(--input-bg);
      border: 1px solid var(--input-border);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 13.5px;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition:
        border-color 0.2s,
        box-shadow 0.2s;
    }
    .ui-select-trigger:hover:not(:disabled) {
      border-color: var(--input-focus-border);
    }
    .ui-select-trigger--open {
      border-color: var(--input-focus-border) !important;
      box-shadow: 0 0 0 3px var(--input-focus-ring);
    }
    .ui-select-trigger--invalid {
      border-color: var(--rose);
    }
    .ui-select-trigger:disabled {
      background: var(--bg-secondary);
      cursor: not-allowed;
      opacity: 0.8;
    }
    .ui-select-value {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ui-select-placeholder {
      color: var(--text-secondary);
      opacity: 0.65;
    }
    .ui-select-arrow {
      color: var(--text-secondary);
      flex-shrink: 0;
    }
    .ui-select-clear {
      display: flex;
      flex-shrink: 0;
      color: var(--text-secondary);
      border-radius: 4px;
    }
    .ui-select-clear:hover {
      color: var(--rose);
    }

    .ui-select-panel {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
      animation: ui-select-in 0.13s ease;
    }
    @keyframes ui-select-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .ui-select-search {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 10px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
    .ui-select-search input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 13px;
      font-family: inherit;
    }
    .ui-select-options {
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }
    .ui-select-option {
      display: block;
      width: 100%;
      padding: 8px 10px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--text-primary);
      font-size: 13.5px;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s;
    }
    .ui-select-option:hover {
      background: var(--sidebar-hover);
    }
    .ui-select-option--active {
      background: var(--select-bg);
      color: var(--select-text);
      font-weight: 600;
    }
    .ui-select-empty {
      padding: 16px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
    }
  `,
})
export class UiSelectComponent implements ControlValueAccessor {
  readonly options = input<readonly unknown[]>([]);
  readonly labelKey = input('label');
  readonly valueKey = input('value');
  readonly placeholder = input('Select');
  readonly searchable = input(true, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly value = signal<unknown>(null);
  readonly disabled = signal(false);
  readonly query = signal('');
  readonly isOpen = signal(false);
  protected readonly panelWidth = signal(0);

  private readonly panelTpl = viewChild.required('panel', {
    read: TemplateRef,
  });
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly vcr = inject(ViewContainerRef);
  private overlayRef?: OverlayRef;

  private readonly normalized = computed<UiSelectOption[]>(() =>
    this.options().map((opt) => {
      if (opt !== null && typeof opt === 'object') {
        const rec = opt as Record<string, unknown>;
        return {
          label: String(rec[this.labelKey()] ?? ''),
          value: rec[this.valueKey()],
        };
      }
      return { label: String(opt), value: opt };
    }),
  );

  protected readonly filtered = computed<UiSelectOption[]>(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.normalized();
    return q ? list.filter((o) => o.label.toLowerCase().includes(q)) : list;
  });

  protected readonly selectedLabel = computed<string>(() => {
    const current = this.value();
    return this.normalized().find((o) => o.value === current)?.label ?? '';
  });

  private onChangeFn: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.disabled() || this.isOpen()) return;
    this.panelWidth.set(this.host.nativeElement.offsetWidth);
    this.overlayRef = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPositions([
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
          { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });
    this.overlayRef.attach(new TemplatePortal(this.panelTpl(), this.vcr));
    this.isOpen.set(true);
    this.overlayRef.backdropClick().subscribe(() => this.close());
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.close();
    });
    setTimeout(() =>
      this.overlayRef?.overlayElement.querySelector('input')?.focus(),
    );
  }

  close(): void {
    if (!this.isOpen()) return;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.isOpen.set(false);
    this.query.set('');
    this.onTouched();
  }

  select(opt: UiSelectOption): void {
    this.value.set(opt.value);
    this.onChangeFn(opt.value);
    this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value.set(null);
    this.onChangeFn(null);
  }

  writeValue(value: unknown): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChangeFn = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

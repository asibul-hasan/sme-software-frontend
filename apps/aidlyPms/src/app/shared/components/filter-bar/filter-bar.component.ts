import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LabelOption } from '../../constants/label-values.constant';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
  ],
  template: `
    <div class="bg-white p-3 rounded-lg border border-slate-200 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        <!-- Search Input -->
        <div class="w-full sm:w-72">
          <nz-input-group [nzPrefix]="prefixTemplate">
            <input
              type="text"
              nz-input
              [placeholder]="searchPlaceholder"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
            />
          </nz-input-group>
          <ng-template #prefixTemplate>
            <span nz-icon nzType="search" class="text-slate-400"></span>
          </ng-template>
        </div>

        <!-- Optional Status / Dropdown Select -->
        @if (options && options.length > 0) {
          <div class="w-48">
            <nz-select
              class="w-full"
              nzPlaceHolder="Select Status"
              [(ngModel)]="selectedOption"
              (ngModelChange)="onOptionChange($event)"
              nzAllowClear
            >
              @for (opt of options; track opt.value) {
                <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
              }
            </nz-select>
          </div>
        }

        <ng-content select="[extraFilters]"></ng-content>
      </div>

      <!-- Action Buttons Slot -->
      <div class="flex items-center gap-2 shrink-0">
        @if (searchQuery || selectedOption !== null) {
          <button nz-button class="btn-reset rounded-md" nzSize="default" (click)="resetFilters()">
            <span nz-icon nzType="reload"></span>
            Reset
          </button>
        }
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
})
export class FilterBarComponent {
  @Input() searchPlaceholder = 'Search records...';
  @Input() options?: readonly LabelOption[];

  @Output() filterSearch = new EventEmitter<string>();
  @Output() optionChange = new EventEmitter<number | null>();
  @Output() filterReset = new EventEmitter<void>();

  searchQuery = '';
  selectedOption: number | null = null;

  onSearchChange(val: string): void {
    this.filterSearch.emit(val);
  }

  onOptionChange(val: number | null): void {
    this.optionChange.emit(val);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedOption = null;
    this.filterReset.emit();
  }
}

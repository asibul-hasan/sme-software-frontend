import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

export type SidebarSortDirection = '' | 'asc' | 'desc';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-form-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, TranslateModule, FormsModule],
  templateUrl: './page-form-layout.component.html',
  styleUrls: ['./page-form-layout.component.scss']
})
export class PageFormLayoutComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'settings';
  @Input() recordsCount: number = 0;
  @Input() sidebarTitle: string = 'Records';
  @Input() hasSidebar: boolean = true;
  
  @Input() showSave: boolean = true;
  @Input() showNew: boolean = true;
  @Input() showReset: boolean = true;
  @Input() showDelete: boolean = false;
  
  @Input() isSaving: boolean = false;
  @Input() isLoading: boolean = false;

  @Input() searchTerm: string = '';
  @Output() searchTermChange = new EventEmitter<string>();

  /** Show the ascending/descending sort toggle beside the search box. */
  @Input() showSort: boolean = true;
  /** Current list sort direction — two-way bindable: [(sortDirection)]. */
  @Input() sortDirection: SidebarSortDirection = '';
  @Output() sortDirectionChange = new EventEmitter<SidebarSortDirection>();

  /**
   * Optional paginator to drive sorting directly. Pass `[pager]="model.pager"` and the
   * sort toggle flips the pager's own `sortDirection` — no per-form `[sortDirection]`
   * wiring or model signal needed. (Provide `sortKey` to `makePaginator` so it sorts.)
   */
  @Input() pager: { sortDirection: () => SidebarSortDirection; toggleSortDirection: () => void } | null = null;

  /** The direction the toggle should reflect — pager wins when present. */
  get currentSort(): SidebarSortDirection {
    return this.pager ? this.pager.sortDirection() : this.sortDirection;
  }

  get sortTitle(): string {
    if (this.currentSort === 'asc') return 'Sort ascending';
    if (this.currentSort === 'desc') return 'Sort descending';
    return 'Default order';
  }

  get sortIcon(): string {
    if (this.currentSort === 'asc') return 'arrow_upward';
    if (this.currentSort === 'desc') return 'arrow_downward';
    return 'sort';
  }

  /** True when the host form has one or more dropdown filters applied. Drives "Clear all". */
  @Input() hasActiveFilters: boolean = false;
  /** Emitted when the user hits "Clear all" — the host form should reset its filter dropdowns. */
  @Output() clearFilters = new EventEmitter<void>();

  @Output() save = new EventEmitter<void>();
  @Output() new = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onSearchChange(val: string) {
    this.searchTermChange.emit(val);
  }

  /** Flip the sort direction. Drives the pager directly when one is bound, else emits. */
  toggleSort() {
    if (this.pager) {
      this.pager.toggleSortDirection();
      return;
    }
    this.sortDirection = this.nextSortDirection(this.sortDirection);
    this.sortDirectionChange.emit(this.sortDirection);
  }

  private nextSortDirection(current: SidebarSortDirection): SidebarSortDirection {
    if (current === '') return 'asc';
    if (current === 'asc') return 'desc';
    return '';
  }

  /** Clear just the search text. */
  clearSearch() {
    this.searchTermChange.emit('');
  }

  /** Clear the search text AND tell the host form to reset its filters. */
  clearAll() {
    if (this.searchTerm) this.searchTermChange.emit('');
    this.clearFilters.emit();
  }

  /** True when anything (search or filters) is narrowing the list. */
  get isFiltering(): boolean {
    return !!this.searchTerm || this.hasActiveFilters;
  }
}

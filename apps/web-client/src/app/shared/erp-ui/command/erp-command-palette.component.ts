import { Component, ChangeDetectionStrategy, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Form' | 'Menu' | 'Action' | 'Report';
  route?: string;
  icon?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'erp-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (isOpen()) {
      <div class="erp-command-backdrop" (click)="close()">
        <div class="erp-command-dialog card border shadow-lg" (click)="$event.stopPropagation()">
          <div class="card-header bg-white p-2 d-flex align-items-center gap-2 border-bottom">
            <mat-icon class="text-primary">search</mat-icon>
            <input
              type="text"
              class="form-control border-0 shadow-none ps-0"
              placeholder="Search forms, menus, reports or press Esc to close (Ctrl+K)..."
              [(ngModel)]="query"
              (input)="onSearch()"
              autoFocus
            />
            <kbd class="bg-light text-muted px-2 py-1 rounded small">ESC</kbd>
          </div>
          <div class="card-body p-2" style="max-height: 350px; overflow-y: auto;">
            @for (item of filteredCommands(); track item.id) {
              <div
                class="erp-command-item d-flex align-items-center justify-content-between p-2 rounded cursor-pointer"
                (click)="executeCommand(item)"
              >
                <div class="d-flex align-items-center gap-2">
                  <mat-icon class="text-secondary" style="font-size:18px; width:18px; height:18px">{{ item.icon || 'description' }}</mat-icon>
                  <span class="fw-medium text-dark">{{ item.title }}</span>
                </div>
                <span class="badge bg-light text-muted border">{{ item.category }}</span>
              </div>
            }
            @if (filteredCommands().length === 0) {
              <div class="text-center text-muted py-4">No matching command or form found.</div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .erp-command-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px);
      z-index: 10500; display: flex; align-items: flex-start; justify-content: center; padding-top: 80px;
    }
    .erp-command-dialog { width: 620px; max-width: 90vw; border-radius: 8px; overflow: hidden; }
    .erp-command-item:hover { background: rgba(59, 130, 246, 0.08); }
  `]
})
export class ErpCommandPaletteComponent {
  private router = inject(Router);
  public isOpen = signal<boolean>(false);
  public query = '';

  readonly commands: CommandItem[] = [
    { id: '1', title: 'SYS1104 – User Branch Mapping', category: 'Form', route: '/sys/forms/sys1104', icon: 'hub' },
    { id: '2', title: 'SYS1108 – Approval Workflow Setup', category: 'Form', route: '/sys/forms/sys1108', icon: 'approval' },
    { id: '3', title: 'HRM1001 – Employee Information', category: 'Form', route: '/hrm/forms/hrm1001', icon: 'badge' },
    { id: '4', title: 'INV1001 – Store Requisition Entry', category: 'Form', route: '/inv/forms/inv1001', icon: 'inventory_2' },
    { id: '5', title: 'AG Grid Enterprise Framework Showcase', category: 'Form', route: '/grid-showcase', icon: 'grid_on' },
  ];

  public filteredCommands = signal<CommandItem[]>(this.commands);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isOpen.set(!this.isOpen());
    } else if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  onSearch(): void {
    const q = this.query.toLowerCase().trim();
    if (!q) {
      this.filteredCommands.set(this.commands);
    } else {
      this.filteredCommands.set(this.commands.filter((c) => c.title.toLowerCase().includes(q)));
    }
  }

  executeCommand(item: CommandItem): void {
    this.close();
    if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.query = '';
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core';

interface Branch {
  id: number;
  name: string;
  code: string;
  is_primary?: boolean;
}

@Component({
  selector: 'app-branch-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    @if (branches().length > 1) {
      <mat-form-field appearance="outline" class="branch-selector">
        <mat-icon matPrefix>store</mat-icon>
        <mat-select 
          [value]="selectedBranch()"
          (selectionChange)="onBranchChange($event.value)">
          @for (branch of branches(); track branch.id) {
            <mat-option [value]="branch.id">
              <div class="branch-option">
                <span class="branch-name">{{ branch.name }}</span>
                @if (branch.code) {
                  <span class="branch-code">({{ branch.code }})</span>
                }
                @if (branch.is_primary) {
                  <mat-icon class="primary-icon">verified</mat-icon>
                }
              </div>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    }
  `,
  styles: [`
    .branch-selector {
      width: 200px;
      
      ::ng-deep {
        .mat-mdc-text-field-wrapper {
          background-color: var(--bg-secondary);
        }
        
        .mat-mdc-form-field-infix {
          padding: 8px 0;
        }
      }
    }

    .branch-option {
      display: flex;
      align-items: center;
      gap: 8px;

      .branch-name {
        flex: 1;
      }

      .branch-code {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .primary-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #4caf50;
      }
    }
  `]
})
export class BranchSwitcherComponent implements OnInit {
  private authService = inject(AuthService);
  
  branches = signal<Branch[]>([]);
  selectedBranch = signal<number>(0);

  ngOnInit() {
    this.loadBranches();
  }

  private loadBranches() {
    const user = this.authService.user();
    if (user?.branch_ids) {
      // In real app, fetch branch details from API
      // For now, mock data
      const mockBranches: Branch[] = user.branch_ids.map((id: number, index: number) => ({
        id,
        name: `Branch ${index + 1}`,
        code: `BR${index + 1}`,
        is_primary: index === 0
      }));

      this.branches.set(mockBranches);
      this.selectedBranch.set(user.branch_id || mockBranches[0]?.id || 0);
    }
  }

  onBranchChange(branchId: number) {
    this.selectedBranch.set(branchId);
    this.authService.switchBranch(branchId);
    console.log('Branch changed to:', branchId);
  }
}
import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
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
  company?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
                @if (branch.company) {
                  <span class="branch-code">{{ branch.company }}</span>
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
    const branches = this.authService.availableBranches().map((branch) => ({
      id: branch.branch_no,
      name: branch.branch_name,
      code: branch.branch_no?.toString() ?? '',
      company: branch.company_name,
    }));

    this.branches.set(branches);
    this.selectedBranch.set(user?.branch_no || branches[0]?.id || 0);
  }

  onBranchChange(branchId: number) {
    const previous = this.selectedBranch();
    this.selectedBranch.set(branchId); // optimistic
    this.authService.switchBranch(branchId).subscribe({
      // success: setSession() has updated the global user signal to the new branch
      error: () => this.selectedBranch.set(previous), // roll back the dropdown on failure
    });
  }
}

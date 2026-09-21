import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDialogVariant =
  | 'primary'
  | 'warn'
  | 'danger'
  | 'success'
  | 'info';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogVariant;
  /** When false, hides the Cancel button — renders as an OK-only alert. */
  showCancel?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
      <!-- Close Button -->
      <button
        type="button"
        (click)="onCancel()"
        class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
      >
        <mat-icon class="!text-[18px]">close</mat-icon>
      </button>

      <!-- Body -->
      <div class="px-6 pt-5 pb-3 text-center">
        <!-- Icon -->
        <div
          class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          [ngClass]="iconBackground"
        >
          <mat-icon class="!h-6 !w-6 !text-[26px]" [ngClass]="iconColor">
            {{ icon }}
          </mat-icon>
        </div>

        <!-- Title -->
        <h2 class="text-base font-semibold tracking-tight text-gray-900">
          {{ data.title || 'Confirmation' }}
        </h2>

        <!-- Message -->
        <p class="mt-1.5 text-xs leading-5 text-gray-500">
          {{ data.message }}
        </p>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-2.5"
      >
        <button
          *ngIf="showCancel"
          type="button"
          (click)="onCancel()"
          class="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-100"
        >
          {{ data.cancelText || 'Cancel' }}
        </button>

        <button
          type="button"
          (click)="onConfirm()"
          class="rounded-lg px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md"
          [ngClass]="buttonClass"
        >
          {{ data.confirmText || (showCancel ? 'Confirm' : 'OK') }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  get showCancel(): boolean {
    return this.data.showCancel !== false;
  }

  get icon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'delete_outline';
      case 'warn':
        return 'warning_amber';
      case 'success':
        return 'check_circle_outline';
      case 'info':
        return 'info_outline';
      default:
        return 'help_outline';
    }
  }

  get iconBackground(): string {
    switch (this.data.type) {
      case 'danger':
        return 'bg-red-100';
      case 'warn':
        return 'bg-amber-100';
      case 'success':
        return 'bg-emerald-100';
      case 'info':
        return 'bg-sky-100';
      default:
        return 'bg-blue-100';
    }
  }

  get iconColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'text-red-600';
      case 'warn':
        return 'text-amber-600';
      case 'success':
        return 'text-emerald-600';
      case 'info':
        return 'text-sky-600';
      default:
        return 'text-blue-600';
    }
  }

  get buttonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warn':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

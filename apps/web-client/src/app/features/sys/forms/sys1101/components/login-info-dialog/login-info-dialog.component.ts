import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../../../../shared';
import { Sys1101ModelService } from '../../services/model.service';
import { activeStatusOptions } from '../../../../../../core/constants/common-options.constants';

export interface LoginInfoDialogData {
  model: Sys1101ModelService;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-info-dialog',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './login-info-dialog.component.html',
})
export class LoginInfoDialogComponent {
  private dialogRef = inject(MatDialogRef<LoginInfoDialogComponent>);
  public data = inject<LoginInfoDialogData>(MAT_DIALOG_DATA, { optional: true });
  readonly activeStatusOptions = activeStatusOptions;

  /** Active tab in the Password Management card. */
  passwordTab = signal<'change' | 'reset'>('change');

  get model(): Sys1101ModelService | undefined {
    return this.data?.model;
  }

  onSaveLoginInfo(): void {
    this.model?.onSave();
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close();
  }
}

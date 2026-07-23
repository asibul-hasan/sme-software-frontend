import { Injectable, InjectionToken, Type, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';

export const DIALOG_DATA = new InjectionToken<any>('DIALOG_DATA');

export interface DialogOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  data?: any;
  title?: string;
  disableClose?: boolean;
  panelClass?: string | string[];
  width?: string;
  height?: string;
}

export class DialogRef<R = any> {
  constructor(private matRef: MatDialogRef<any, R>) {}

  close(result?: R): void {
    this.matRef.close(result);
  }
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  private readonly sizeMap: Record<string, string> = {
    sm: '400px',
    md: '650px',
    lg: '900px',
    xl: '1200px',
  };

  /**
   * Opens a component inside a modal dialog.
   *
   * @param component The Component class to render inside the dialog.
   * @param options Dialog configuration object `{ size: 'xl' | 'lg' | 'md' | 'sm', data: {...} }` or size string `'xl'`.
   * @returns Observable that emits the result passed to `dialogRef.close(result)` when closed.
   *
   * Example:
   * ```ts
   * this.dialogService.open(MyModalComponent, { size: 'lg', data: { id: 123 } })
   *   .subscribe((res) => {
   *     console.log('Dialog closed with:', res);
   *   });
   * ```
   */
  open<T = any, R = any>(
    component: Type<T>,
    options?: DialogOptions | 'sm' | 'md' | 'lg' | 'xl' | string
  ): Observable<R | undefined> {
    const config = this.buildConfig(options);
    const dialogRef = this.dialog.open(component, config);
    return dialogRef.afterClosed();
  }

  private buildConfig(
    options?: DialogOptions | 'sm' | 'md' | 'lg' | 'xl' | string
  ): MatDialogConfig {
    let opts: DialogOptions = {};
    if (typeof options === 'string') {
      opts = { size: options };
    } else if (options) {
      opts = options;
    }

    const sizeKey = opts.size || 'md';
    const width = opts.width || this.sizeMap[sizeKey] || sizeKey;

    return {
      width,
      height: opts.height,
      data: opts.data,
      disableClose: opts.disableClose ?? false,
      panelClass: opts.panelClass || 'custom-dialog-container',
      autoFocus: false,
    };
  }
}

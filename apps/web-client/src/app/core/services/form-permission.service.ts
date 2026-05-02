import { Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { AuthDataService } from '../../features/auth/services/data.service';

export interface FormPermission {
  formId: string;
  formName?: string;
  create: boolean;
  update: boolean;
  delete: boolean;
  view: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormPermissionService {
  // Store the permission state for the currently active form
  public currentPermission = signal<FormPermission | null>(null);

  constructor(private dataService: AuthDataService) {}

  loadPermissions(formId: string): Observable<FormPermission | null> {
    return this.dataService.checkFormPermission(formId).pipe(
      map(response => {
        if (response && response.data) {
          const permData = response.data;
          const parsedPerm: FormPermission = {
            formId: permData.formId || permData.form_Id || formId,
            formName: permData.formName || permData.form_name,
            create: permData.create === 'true' || permData.create === true,
            update: permData.update === 'true' || permData.update === true,
            delete: permData.delete === 'true' || permData.delete === true,
            view: permData.view === 'true' || permData.view === true,
          };
          this.currentPermission.set(parsedPerm);
          return parsedPerm;
        }
        this.currentPermission.set(null);
        return null;
      }),
      catchError(err => {
        console.error('Failed to load form permissions', err);
        this.currentPermission.set(null);
        return of(null);
      })
    );
  }

  hasPermission(action: 'create' | 'update' | 'delete' | 'view'): boolean {
    const perms = this.currentPermission();
    if (!perms) return false;
    return !!perms[action];
  }

  clear() {
    this.currentPermission.set(null);
  }
}
